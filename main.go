package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"

	"github.com/nicklaw5/helix/v2"
)

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
		"access_token":  accessToken,
		"refresh_token": refreshToken,
		"client_id":     clientID,
		"client_secret": clientSecret,
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

func cacheBuster(filePath string) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		log.Fatalf("Error reading file: %v", err)
		return
	}

	// Convert file content to string
	content := string(data)

	// Get the current timestamp
	timestamp := fmt.Sprintf("?v=%d", time.Now().Unix())

	// Regular expression to match the <head>...</head> section
	headRe := regexp.MustCompile(`(?s)<head>(.*?)</head>`)
	matchedHead := headRe.FindStringSubmatch(content)
	if len(matchedHead) < 2 {
		log.Println("No <head> section found in the file")
		return
	}

	originalHead := matchedHead[1]

	// Regular expression to match <script src="..."></script> tags
	scriptRe := regexp.MustCompile(`<script\s+src="([^"]+)"([^>]*)></script>`)

	updatedHead := scriptRe.ReplaceAllStringFunc(originalHead, func(scriptTag string) string {
		// Extract the src value
		matches := scriptRe.FindStringSubmatch(scriptTag)
		if len(matches) == 0 {
			return scriptTag
		}

		src := matches[1]
		rest := matches[2]

		// Replace or append the timestamp query parameter
		newSrc := regexp.MustCompile(`(\?v=\d+)?`).ReplaceAllString(src, "")
		newSrc += timestamp

		return fmt.Sprintf(`<script src="%s"%s></script>`, newSrc, rest)
	})

	// Replace the old head section with the updated head section
	updatedContent := strings.Replace(content, originalHead, updatedHead, 1)

	// Write the updated content back to the file
	err = os.WriteFile(filePath, []byte(updatedContent), 0644)
	if err != nil {
		log.Fatalf("Error writing file: %v", err)
		return
	}

	log.Println("Updated script sources with the current timestamp")
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
	// serve the current directory as a static web server
	staticFilesV2 := http.FileServer(http.Dir("./dist"))
	http.Handle("/", staticFilesV2)

	log.Println("Serving static files from current directory on http://localhost" + port)
	err = http.ListenAndServe(port, nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
