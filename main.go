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

func handleAdminActive(w http.ResponseWriter, r *http.Request) {
	if r.Method == "GET" {
		// Serve the login form
		tmpl := template.Must(template.New("login").Parse(`
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Admin Login</title>
				<style>
					body {
						font-family: Arial, sans-serif;
						background-color: #1a1a1a;
						color: #ffffff;
						margin: 0;
						padding: 20px;
						display: flex;
						justify-content: center;
						align-items: center;
						height: 100vh;
					}
					.container {
						background-color: #2a2a2a;
						border-radius: 5px;
						padding: 20px;
						max-width: 300px;
					}
					h1 {
						color: #00aaff;
						text-align: center;
					}
					input[type="password"] {
						width: 90%;
						padding: 5%;
						margin: 10px 0;
						border: none;
						border-radius: 3px;
						background-color: #212121;
						color: white;
					}
					input[type="submit"] {
						width: 100%;
						padding: 5%;
						background-color: #00aaff;
						color: #ffffff;
						border: none;
						border-radius: 3px;
						cursor: pointer;
					}
				</style>
			</head>
			<body>
				<div class="container">
					<h1>Admin Login</h1>
					<form method="POST">
						<input type="password" name="password" placeholder="Enter password" required>
						<input type="submit" value="Login">
					</form>
				</div>
			</body>
			</html>
		`))
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

		tmpl := template.Must(template.New("admin").Funcs(funcMap).Parse(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Active Channels</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #1a1a1a;
                        color: #ffffff;
                        margin: 0;
                        padding: 20px;
                    }
                    h1, h2 {
                        color: #00aaff;
                    }
                    .container {
                        background-color: #2a2a2a;
                        border-radius: 5px;
                        padding: 20px;
                        max-width: 800px;
                        margin: 0 auto;
                    }
                    ul {
                        list-style-type: none;
                        padding: 0;
                    }
                    li {
                        margin-bottom: 10px;
                    }
                    .collapsible {
                        background-color: #3a3a3a;
                        color: #ffffff;
                        cursor: pointer;
                        padding: 18px;
                        width: 100%;
                        border: none;
                        text-align: left;
                        outline: none;
                        font-size: 15px;
                    }
                    .active, .collapsible:hover {
                        background-color: #4a4a4a;
                    }
                    .content {
                        padding: 0 18px;
                        display: none;
                        overflow: hidden;
                        background-color: #2a2a2a;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Active Channels</h1>
                    <p>Total active channels: {{.Count}}</p>
                    <p>All-time highest active channels: {{.AllTimeHighest}}</p>
                    <h2>Currently Active Channels:</h2>
                    <ul>
                        {{range $channel, $lastActive := .Channels}}
                            <li>{{$channel}} - {{formatTime $lastActive}}</li>
                        {{end}}
                    </ul>
                    
                    <button class="collapsible">Unique Users ({{len .UniqueUsers}})</button>
                    <div class="content">
                        <ul>
                            {{range $user := .UniqueUsers}}
                                <li>{{$user}}</li>
                            {{end}}
                        </ul>
                    </div>
                </div>
                
                <script>
                var coll = document.getElementsByClassName("collapsible");
                var i;

                for (i = 0; i < coll.length; i++) {
                    coll[i].addEventListener("click", function() {
                        this.classList.toggle("active");
                        var content = this.nextElementSibling;
                        if (content.style.display === "block") {
                            content.style.display = "none";
                        } else {
                            content.style.display = "block";
                        }
                    });
                }
                </script>
            </body>
            </html>
        `))

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

		tmpl.Execute(w, data)
	} else {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func synthesizeSpeechHandler(w http.ResponseWriter, r *http.Request) {
	// Check if the request is coming from your website
	if !isRequestFromYourWebsite(r) {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Get parameters from the request
	voiceName := r.URL.Query().Get("voice")
	text := r.URL.Query().Get("text")

	// Make sure the length of text is under 1000 characters
	if len(text) > 1000 {
		http.Error(w, "Text length exceeds the limit of 1000 characters", http.StatusBadRequest)
		return
	}

	// Convert voice name to Polly voice ID
	voiceID, ok := voiceMap[voiceName]
	if !ok {
		http.Error(w, "Invalid voice name", http.StatusBadRequest)
		return
	}

	// Set up the input parameters
	input := &polly.SynthesizeSpeechInput{
		OutputFormat: aws.String("mp3"),
		Text:         aws.String(text),
		VoiceId:      aws.String(voiceID),
	}

	// Use a mutex to ensure thread-safe access to the Polly client
	mu.Lock()
	output, err := pollySvc.SynthesizeSpeech(input)
	mu.Unlock()

	if err != nil {
		http.Error(w, "Failed to synthesize speech", http.StatusInternalServerError)
		return
	}

	// Read the audio stream
	audioBytes, err := io.ReadAll(output.AudioStream)
	if err != nil {
		http.Error(w, "Failed to read audio stream", http.StatusInternalServerError)
		return
	}

	// Set response headers
	w.Header().Set("Content-Type", "audio/mpeg")
	w.Header().Set("Content-Length", fmt.Sprintf("%d", len(audioBytes)))

	// Write the audio data directly to the response
	_, err = w.Write(audioBytes)
	if err != nil {
		http.Error(w, "Failed to write audio data", http.StatusInternalServerError)
		return
	}
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
		return originURL.Host == host
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
		callbackUrl = "https://chat.johnnycyan.com/auth/callback"
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
	err = http.ListenAndServe(port, nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
