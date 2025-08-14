package main

import (
	"encoding/json"
	"fmt"
	"html/template"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"sync"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/polly"
	"github.com/gorilla/websocket"
	"github.com/nicklaw5/helix/v2"
)

type ActiveChannels struct {
	Count          int               `json:"count"`
	Channels       map[string]string `json:"channels"`
	AllTimeHighest int               `json:"all_time_highest"`
	UniqueUsers    map[string]bool   `json:"unique_users"`
}

var (
	pollySvc       *polly.Polly
	voiceMap       map[string]string
	mu             sync.Mutex
	activeChannels ActiveChannels
	activeMutex    sync.Mutex
	tokens         map[string]string
	AdminPassword  string
)

func init() {
	// Create an AWS session
	sess, err := session.NewSession(&aws.Config{
		Region: aws.String("eu-north-1"), // Change this to your preferred region
	})
	if err != nil {
		panic(fmt.Sprintf("Failed to create AWS session: %v", err))
	}

	// Create Polly client
	pollySvc = polly.New(sess)

	// Initialize voice map
	voiceMap = map[string]string{
		"Brian":    "Brian",
		"Ivy":      "Ivy",
		"Justin":   "Justin",
		"Russell":  "Russell",
		"Nicole":   "Nicole",
		"Emma":     "Emma",
		"Amy":      "Amy",
		"Joanna":   "Joanna",
		"Salli":    "Salli",
		"Kimberly": "Kimberly",
		"Kendra":   "Kendra",
		"Joey":     "Joey",
		"Mizuki":   "Mizuki",
		"Chantal":  "Chantal",
		"Mathieu":  "Mathieu",
		"Maxim":    "Maxim",
		"Hans":     "Hans",
		"Raveena":  "Raveena",
	}

	// Initialize activeChannels
	activeChannels = ActiveChannels{
		Count:          0,
		Channels:       make(map[string]string),
		AllTimeHighest: 0,
	}

	// Load existing active channels from file
	loadTokens()
	loadActiveChannels()
}

func loadTokens() {
	file, err := os.ReadFile("tokens.json")
	if err != nil {
		log.Fatal("Error reading tokens.json:", err)
	}

	err = json.Unmarshal(file, &tokens)
	if err != nil {
		log.Fatal("Error parsing tokens.json:", err)
	}

	AdminPassword = tokens["admin_password"]
}

func loadActiveChannels() {
	file, err := os.ReadFile("active.json")
	if err == nil {
		json.Unmarshal(file, &activeChannels)
	}
}

func saveActiveChannels() {
	file, _ := json.MarshalIndent(activeChannels, "", "  ")
	os.WriteFile("active.json", file, 0644)
}

func updateActiveChannel(channel string) {
	activeMutex.Lock()
	defer activeMutex.Unlock()

	cleanupInactiveChannels()

	activeChannels.Channels[channel] = time.Now().Format(time.RFC3339)
	activeChannels.Count = len(activeChannels.Channels)

	if activeChannels.Count > activeChannels.AllTimeHighest {
		activeChannels.AllTimeHighest = activeChannels.Count
	}

	// Store unique user
	if activeChannels.UniqueUsers == nil {
		activeChannels.UniqueUsers = make(map[string]bool)
	}
	activeChannels.UniqueUsers[channel] = true

	saveActiveChannels()
}

func cleanupInactiveChannels() {
	threshold := time.Now().Add(-3 * time.Minute)
	for channel, lastActive := range activeChannels.Channels {
		lastActiveTime, _ := time.Parse(time.RFC3339, lastActive)
		if lastActiveTime.Before(threshold) {
			delete(activeChannels.Channels, channel)
		}
	}
	activeChannels.Count = len(activeChannels.Channels)
}

func handleActive(w http.ResponseWriter, r *http.Request) {
	channel := r.URL.Query().Get("channel")
	if channel == "" {
		http.Error(w, "No channel specified", http.StatusBadRequest)
		return
	}

	updateActiveChannel(channel)
	w.WriteHeader(http.StatusOK)
}

func loadTemplate(filename string) (*template.Template, error) {
	content, err := os.ReadFile(filename)
	if err != nil {
		return nil, err
	}

	tmpl, err := template.New(filepath.Base(filename)).Parse(string(content))
	if err != nil {
		return nil, err
	}

	return tmpl, nil
}

func loadTemplateWithFuncMap(filename string, funcMap template.FuncMap) (*template.Template, error) {
	content, err := os.ReadFile(filename)
	if err != nil {
		return nil, err
	}

	tmpl, err := template.New(filepath.Base(filename)).Funcs(funcMap).Parse(string(content))
	if err != nil {
		return nil, err
	}

	return tmpl, nil
}

func handleAdminActive(w http.ResponseWriter, r *http.Request) {
	if r.Method == "GET" {
		tmpl, err := loadTemplate("login.html")
		if err != nil {
			http.Error(w, "Failed to load template", http.StatusInternalServerError)
			return
		}
		// Serve the login form
		tmpl.Execute(w, nil)
	} else if r.Method == "POST" {
		// Handle login
		r.ParseForm()
		password := r.FormValue("password")
		if password != AdminPassword {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		activeMutex.Lock()
		cleanupInactiveChannels()
		activeMutex.Unlock()

		funcMap := template.FuncMap{
			"formatTime": func(t string) string {
				parsedTime, err := time.Parse(time.RFC3339, t)
				if err != nil {
					return "Invalid time"
				}
				duration := time.Since(parsedTime)
				minutes := int(duration.Minutes())

				if minutes < 1 {
					return "<1m ago"
				} else {
					return fmt.Sprintf("%dm ago", minutes)
				}
			},
		}

		tmpl, err := loadTemplateWithFuncMap("admin.html", funcMap)
		if err != nil {
			http.Error(w, "Failed to load template", http.StatusInternalServerError)
			return
		}

		data := struct {
			ActiveChannels
			UniqueUsers []string
		}{
			ActiveChannels: activeChannels,
			UniqueUsers:    make([]string, 0, len(activeChannels.UniqueUsers)),
		}

		for user := range activeChannels.UniqueUsers {
			data.UniqueUsers = append(data.UniqueUsers, user)
		}

		sort.Strings(data.UniqueUsers)

		tmpl.Execute(w, data)
	} else {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func synthesizeSpeechHandler(w http.ResponseWriter, r *http.Request) {
	log.Printf("Starting speech synthesis request from: %s", r.RemoteAddr)

	// Check if the request is coming from your website
	if !isRequestFromYourWebsite(r) {
		log.Printf("Unauthorized request from: %s", r.RemoteAddr)
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Get parameters from the request
	voiceName := r.URL.Query().Get("voice")
	text := r.URL.Query().Get("text")
	log.Printf("Received request - Voice: %s, Text length: %d", voiceName, len(text))

	// Make sure the length of text is under 1000 characters
	if len(text) > 1000 {
		log.Printf("Text length exceeded limit: %d characters", len(text))
		http.Error(w, "Text length exceeds the limit of 1000 characters", http.StatusBadRequest)
		return
	}

	// Create a temporary file with a unique name
	tmpFile, err := os.CreateTemp("", "tts-*.mp3")
	if err != nil {
		log.Printf("Failed to create temporary file: %v", err)
		http.Error(w, "Failed to create temporary file", http.StatusInternalServerError)
		return
	}
	log.Printf("Created temporary file: %s", tmpFile.Name())
	tmpFile.Close()
	defer os.Remove(tmpFile.Name()) // Clean up the temporary file when done

	// Prepare the command with proper voice and text
	cmd := exec.Command("edge-tts",
		"--text", text,
		"--voice", voiceName,
		"--write-media", tmpFile.Name(),
	)
	log.Printf("Executing edge-tts command: %v", cmd.Args)

	// Execute the command
	if err := cmd.Run(); err != nil {
		log.Printf("Failed to execute edge-tts command: %v", err)
		http.Error(w, "Failed to synthesize speech", http.StatusInternalServerError)
		return
	}
	log.Printf("Successfully generated speech audio file")

	// Open the generated file
	audioFile, err := os.Open(tmpFile.Name())
	if err != nil {
		log.Printf("Failed to open generated audio file: %v", err)
		http.Error(w, "Failed to read audio file", http.StatusInternalServerError)
		return
	}
	defer audioFile.Close()

	// Get file info for Content-Length header
	fileInfo, err := audioFile.Stat()
	if err != nil {
		log.Printf("Failed to get audio file info: %v", err)
		http.Error(w, "Failed to get audio file info", http.StatusInternalServerError)
		return
	}
	log.Printf("Audio file size: %d bytes", fileInfo.Size())

	// Set response headers
	w.Header().Set("Content-Type", "audio/mpeg")
	w.Header().Set("Content-Length", fmt.Sprintf("%d", fileInfo.Size()))
	log.Printf("Set response headers - Content-Type: audio/mpeg, Content-Length: %d", fileInfo.Size())

	// Stream the file to the response
	bytesWritten, err := io.Copy(w, audioFile)
	if err != nil {
		log.Printf("Failed to stream audio data: %v", err)
		http.Error(w, "Failed to stream audio data", http.StatusInternalServerError)
		return
	}
	log.Printf("Successfully streamed %d bytes of audio data", bytesWritten)

}
func isRequestFromYourWebsite(r *http.Request) bool {
	// Check if it's a same-origin request
	origin := r.Header.Get("Origin")
	host := r.Host

	// If Origin is empty, it's likely a same-origin request
	if origin == "" {
		return true
	}

	// If Origin is set, compare it with the Host
	if origin != "" {
		originURL, err := url.Parse(origin)
		if err != nil {
			return false
		}
		// Allow same host
		if originURL.Host == host {
			return true
		}
		// Explicitly allow local dev from localhost:3000
		if originURL.Host == "localhost:3000" {
			return true
		}
		if originURL.Host == "unificado.justdavi.dev" {
			return true
		}
		return false
	}

	return false
}

type OAuthResponse struct {
	UserID   string `json:"user_id"`
	ClientID string `json:"client_id"`
}

type ErrorResponse struct {
	Message string `json:"message"`
}

var (
	accessToken  string
	refreshToken string
	clientID     string
	clientSecret string
	client       *helix.Client
)

func TwitchOAuthHandler(w http.ResponseWriter, r *http.Request) {
	req, err := http.NewRequest("GET", "https://id.twitch.tv/oauth2/validate", nil)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	req.Header.Add("Authorization", "Bearer "+accessToken)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		if resp.StatusCode == http.StatusUnauthorized {
			log.Println("Refreshing token")
			err = refreshTokenOnce()
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			TwitchOAuthHandler(w, r)
		} else {
			body, _ := io.ReadAll(resp.Body)
			http.Error(w, string(body), resp.StatusCode)
			return
		}
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(body)
}

func TwitchGetUserIDforUsernameHandler(w http.ResponseWriter, r *http.Request) {
	req, err := http.NewRequest("GET", "https://api.twitch.tv/helix/users?login="+r.URL.Query().Get("username"), nil)
	if err != nil {
		log.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	req.Header.Add("Authorization", "Bearer "+accessToken)
	req.Header.Add("Client-Id", clientID)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		if resp.StatusCode == http.StatusUnauthorized {
			log.Println("Refreshing token")
			err = refreshTokenOnce()
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			TwitchGetUserIDforUsernameHandler(w, r)
		} else {
			body, _ := io.ReadAll(resp.Body)
			log.Println(string(body))
			http.Error(w, string(body), resp.StatusCode)
			return
		}
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(body)
}

func TwitchAPIHandler(w http.ResponseWriter, r *http.Request) {
	url := r.URL.Query().Get("url")
	req, err := http.NewRequest("GET", "https://api.twitch.tv/helix"+url, nil)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	req.Header.Add("Authorization", "Bearer "+accessToken)
	req.Header.Add("Client-Id", clientID)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		if resp.StatusCode == http.StatusUnauthorized {
			log.Println("Refreshing token")
			err = refreshTokenOnce()
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			TwitchAPIHandler(w, r)
		} else {
			body, _ := io.ReadAll(resp.Body)
			http.Error(w, string(body), resp.StatusCode)
			return
		}
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(body)
}

func TwitchRedirectHandler(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	if code == "" {
		http.Error(w, "No code found.", http.StatusBadRequest)
		return
	}

	resp, err := client.RequestUserAccessToken(code)
	if err != nil {
		log.Fatal(err)
	}

	accessToken = resp.Data.AccessToken
	refreshToken = resp.Data.RefreshToken
	saveTokens(accessToken, refreshToken)
}

func handleChatterinoBadges(w http.ResponseWriter, r *http.Request) {
	// Set CORS headers to allow requests from any origin
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET")

	// Make a request to the Chatterino API
	resp, err := http.Get("https://api.chatterino.com/badges")
	if err != nil {
		http.Error(w, "Failed to fetch Chatterino badges", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	// Read the response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		http.Error(w, "Failed to read response body", http.StatusInternalServerError)
		return
	}

	// Parse the JSON response
	var result map[string]interface{}
	err = json.Unmarshal(body, &result)
	if err != nil {
		http.Error(w, "Failed to parse JSON response", http.StatusInternalServerError)
		return
	}

	// Set the content type to JSON
	w.Header().Set("Content-Type", "application/json")

	// Send the parsed JSON back to the client
	json.NewEncoder(w).Encode(result)
}

func saveTokens(accessToken string, refreshToken string) {
	file, err := os.Create("tokens.json")
	if err != nil {
		log.Fatal(err)
		return
	}
	defer file.Close()
	err = json.NewEncoder(file).Encode(map[string]string{
		"access_token":   accessToken,
		"refresh_token":  refreshToken,
		"client_id":      clientID,
		"client_secret":  clientSecret,
		"admin_password": AdminPassword,
	})
	if err != nil {
		log.Fatal(err)
		return
	}
}

func refreshTokenOnce() error {
	resp, err := client.RefreshUserAccessToken(refreshToken)
	if err != nil {
		log.Println("Failed to refresh token: " + err.Error())
		return err
	}
	accessToken = resp.Data.AccessToken
	refreshToken = resp.Data.RefreshToken
	saveTokens(accessToken, refreshToken)
	log.Println("Token Refreshed")
	return nil
}

func refreshTokenLoop() {
	for {
		resp, err := client.RefreshUserAccessToken(refreshToken)
		if err != nil {
			log.Println("Failed to refresh token: " + err.Error())
			time.Sleep(time.Second * 5)
			go refreshTokenLoop()
		}
		accessToken = resp.Data.AccessToken
		refreshToken = resp.Data.RefreshToken
		saveTokens(accessToken, refreshToken)
		log.Println("Token Refreshed")
		time.Sleep(time.Minute * 120)
	}
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Be careful with this in production
	},
}

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	// Check if the request is coming from your website
	if !isRequestFromYourWebsite(r) {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Extract the channel parameter from the request URL
	channel := r.URL.Query().Get("channel")
	if channel == "" {
		log.Println("No channel specified")
		http.Error(w, "No channel specified", http.StatusBadRequest)
		return
	}

	// Upgrade the HTTP connection to a WebSocket connection
	clientConn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Upgrade error:", err)
		return
	}
	defer clientConn.Close()

	// Connect to the YouTube WebSocket using the provided channel
	youtubeConn, _, err := websocket.DefaultDialer.Dial("ws://localhost:9905/c/"+channel, nil)
	if err != nil {
		log.Println("YouTube WebSocket connection error:", err)
		return
	}
	defer youtubeConn.Close()

	// Bidirectional relay (same as before)
	go relay(clientConn, youtubeConn)
	relay(youtubeConn, clientConn)
}

func relay(src, dst *websocket.Conn) {
	for {
		messageType, message, err := src.ReadMessage()
		if err != nil {
			log.Println("Read error:", err)
			return
		}
		err = dst.WriteMessage(messageType, message)
		if err != nil {
			log.Println("Write error:", err)
			return
		}
	}
}

func main() {
	// cacheBuster("./src/index.html")
	// cacheBuster("./src/v2/index.html")
	// load access and refresh tokens from file
	file, err := os.Open("tokens.json")
	if err != nil {
		log.Fatal(err)
		return
	}
	defer file.Close()

	var tokens map[string]string
	err = json.NewDecoder(file).Decode(&tokens)
	if err != nil {
		log.Fatal(err)
		return
	}
	accessToken = tokens["access_token"]
	refreshToken = tokens["refresh_token"]
	clientID = tokens["client_id"]
	clientSecret = tokens["client_secret"]
	if accessToken == "" {
		log.Fatal("No access token found.")
		return
	}
	if refreshToken == "" {
		log.Fatal("No refresh token found.")
		return
	}
	if clientID == "" {
		log.Fatal("No client ID found.")
		return
	}
	if clientSecret == "" {
		log.Fatal("No client secret found.")
		return
	}
	log.Println("Access token: " + accessToken)

	args := os.Args[1:]
	port := args[0]
	var location string
	if len(args) > 1 {
		location = args[1]
		if location == "" {
			location = "remote"
		}
	} else {
		location = "remote"
	}
	var callbackUrl string
	if location == "local" {
		callbackUrl = "http://localhost" + port + "/auth/callback"
	} else {
		callbackUrl = "https://chatsemban.justdavi.dev/auth/callback"
	}

	client, err = helix.NewClient(&helix.Options{
		ClientID:        clientID,
		ClientSecret:    clientSecret,
		RedirectURI:     callbackUrl,
		UserAccessToken: accessToken,
		RefreshToken:    refreshToken,
	})
	if err != nil {
		log.Println(err)
	}
	client.OnUserAccessTokenRefreshed(func(newAccessToken, newRefreshToken string) {
		log.Println("Refreshed access token")
		accessToken = newAccessToken
		refreshToken = newRefreshToken
		saveTokens(accessToken, refreshToken)
		client.SetUserAccessToken(accessToken)
		client.SetRefreshToken(refreshToken)
	})
	go refreshTokenLoop()
	url := client.GetAuthorizationURL(&helix.AuthorizationURLParams{
		ResponseType: "code", // or "token"
		Scopes:       []string{},
		State:        "some-state",
		ForceVerify:  false,
	})
	log.Printf("%s\n", url)

	http.HandleFunc("/twitch/oauth", TwitchOAuthHandler)
	http.HandleFunc("/twitch/api", TwitchAPIHandler)
	http.HandleFunc("/auth/callback", TwitchRedirectHandler)
	http.HandleFunc("/twitch/get_id", TwitchGetUserIDforUsernameHandler)
	http.HandleFunc("/api/chatterino-badges", handleChatterinoBadges)
	http.HandleFunc("/api/tts", synthesizeSpeechHandler)
	http.HandleFunc("/ws", handleWebSocket)
	http.HandleFunc("/active", handleActive)
	http.HandleFunc("/admin/active", handleAdminActive)
	// serve the current directory as a static web server
	staticFilesV2 := http.FileServer(http.Dir("./dist"))
	http.Handle("/", staticFilesV2)

	log.Println("Serving static files from current directory on http://localhost" + port)
	// Wrap the default mux with CORS middleware
	err = http.ListenAndServe(port, withCORS(http.DefaultServeMux))
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}

// withCORS is a simple middleware to enable CORS for localhost:3000 (dev)
func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		fmt.Println("CORS Origin:", origin)
		switch origin {
		case "http://localhost:3000":
			// Reflect the allowed origin
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Vary", "Origin")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			// Enable cookies/Authorization header if needed
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			if r.Method == http.MethodOptions {
				// Preflight request
				w.WriteHeader(http.StatusNoContent)
				return
			}
		case "https://unificado.justdavi.dev":
			// Reflect the allowed origin
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Vary", "Origin")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			// Enable cookies/Authorization header if needed
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			if r.Method == http.MethodOptions {
				// Preflight request
				w.WriteHeader(http.StatusNoContent)
				return
			}
		}
		next.ServeHTTP(w, r)
	})
}
