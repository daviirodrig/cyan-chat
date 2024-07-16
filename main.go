package main

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"

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
		body, _ := io.ReadAll(resp.Body)
		http.Error(w, string(body), resp.StatusCode)
		return
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
		body, _ := io.ReadAll(resp.Body)
		http.Error(w, string(body), resp.StatusCode)
		return
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
	log.Println("Access token: " + accessToken)
}

func main() {
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
	client, err = helix.NewClient(&helix.Options{
		ClientID:        clientID,
		ClientSecret:    clientSecret,
		RedirectURI:     "http://localhost" + port + "/auth/callback",
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
	})
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
	// serve the current directory as a static web server
	staticFilesV2 := http.FileServer(http.Dir("./src"))
	http.Handle("/", staticFilesV2)

	log.Println("Serving static files from current directory on http://localhost" + port)
	err = http.ListenAndServe(port, nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
