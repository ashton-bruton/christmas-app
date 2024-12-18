(async function () {
    "use strict";
  
    const CLIENT_ID = "17e06f98389c4e1daed074f8142138f0";
    const REDIRECT_URI = "https://christmas-app-e9bf7.web.app/html/failure.html";
    const SCOPES = "streaming user-read-playback-state user-modify-playback-state";
  
    const authMessage = document.getElementById("authMessage");
    const loginButton = document.getElementById("loginButton");
    const optionsContainer = document.getElementById("optionsContainer");
    const scoreElement = document.getElementById("score");
  
    let token = null;
    let refreshToken = null;
    let player = null;
    let game = { score: 0, correctSong: null, allSongs: [] };
  
    // Authentication Flow
    async function authenticate() {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get("access_token");
      const refresh = params.get("refresh_token");
  
      if (accessToken) {
        token = accessToken;
        refreshToken = refresh;
        window.history.pushState("", document.title, window.location.pathname); // Remove token from URL
        initializePlayer();
      } else {
        loginButton.style.display = "block";
        loginButton.addEventListener("click", () => {
          const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(
            REDIRECT_URI
          )}&scope=${encodeURIComponent(SCOPES)}`;
          window.location.href = authUrl;
        });
      }
    }
  
    // Refresh Token Logic
    async function refreshAccessToken() {
      if (!refreshToken) {
        console.error("Refresh token is not available.");
        return;
      }
  
      try {
        const response = await fetch("https://accounts.spotify.com/api/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${btoa(CLIENT_ID + ":" + "YOUR_CLIENT_SECRET")}`,
          },
          body: `grant_type=refresh_token&refresh_token=${refreshToken}`,
        });
  
        if (!response.ok) throw new Error("Failed to refresh token");
  
        const data = await response.json();
        token = data.access_token;
      } catch (error) {
        console.error("Error refreshing token:", error.message);
      }
    }
  
    // Spotify Web Playback SDK Initialization
    window.onSpotifyWebPlaybackSDKReady = () => {
      authMessage.textContent = "Initializing Spotify Player...";
      loginButton.style.display = "none";
  
      player = new Spotify.Player({
        name: "Beat Shazam Game",
        getOAuthToken: async (cb) => {
          if (!token) await refreshAccessToken();
          cb(token);
        },
        volume: 0.5,
      });
  
      player.addListener("ready", ({ device_id }) => {
        authMessage.textContent = "Player is ready! Let's play!";
        console.log("Device ID", device_id);
        fetchSongs("soul"); // Fetch songs in the "Soul" genre
      });
  
      player.addListener("not_ready", ({ device_id }) => {
        console.error("Device ID has gone offline", device_id);
      });
  
      player.addListener("initialization_error", ({ message }) => {
        console.error("Initialization error:", message);
      });
  
      player.addListener("authentication_error", async ({ message }) => {
        console.error("Authentication error:", message);
        await refreshAccessToken();
      });
  
      player.connect();
    };
  
    // Fetch Songs from Spotify
    async function fetchSongs(genre) {
      try {
        const response = await fetch(
          `https://api.spotify.com/v1/search?q=genre:${genre}&type=track&limit=10`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
  
        if (!response.ok) throw new Error("Failed to fetch songs from Spotify");
  
        const data = await response.json();
        game.allSongs = data.tracks.items.map((track) => ({
          uri: track.uri,
          songName: track.name,
          artist: track.artists.map((artist) => artist.name).join(", "),
        }));
        loadGameRound();
      } catch (error) {
        console.error("Error fetching songs:", error.message);
      }
    }
  
    // Rest of the code remains the same...
  
    await authenticate();
  })();
  