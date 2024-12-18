(async function () {
    "use strict";
  
    const CLIENT_ID = "17e06f98389c4e1daed074f8142138f0";
    const REDIRECT_URI = "https://christmas-app-e9bf7.web.app/html/redirect.html";
    const SCOPES = [
      "streaming",
      "user-read-playback-state",
      "user-modify-playback-state",
      "user-read-currently-playing",
    ].join(" ");
  
    const AUTH_URL = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(
      REDIRECT_URI
    )}&scope=${encodeURIComponent(SCOPES)}`;
  
    const loginButton = document.getElementById("loginButton");
    const authMessage = document.getElementById("authMessage");
    const optionsContainer = document.getElementById("optionsContainer");
    const scoreElement = document.getElementById("score");
  
    let game = { score: 0, correctSong: null, allSongs: [] };
    let player = null;
  
    // Spotify Authentication
    async function authenticate() {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const token = params.get("access_token");
  
      if (token) {
        localStorage.setItem("spotify_access_token", token);
        window.history.pushState("", document.title, window.location.pathname);
  
        try {
          await verifyScopes(token);
          authMessage.textContent = "Authenticated! Loading player...";
          loginButton.style.display = "none";
          await loadSpotifySDK(token);
        } catch (error) {
          console.error("Authentication error:", error.message);
          authMessage.textContent = "Authentication failed. Please try again.";
          loginButton.style.display = "block";
        }
      } else {
        loginButton.style.display = "block";
        loginButton.addEventListener("click", () => {
          window.location.href = AUTH_URL;
        });
      }
    }
  
    // Verify Token Scopes
    async function verifyScopes(token) {
      const response = await fetch("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      if (!response.ok) {
        throw new Error("Token validation failed. Please re-authenticate.");
      }
  
      const data = await response.json();
      console.log("Token validated. User Info:", data);
    }
  
    // Load Spotify SDK
    async function loadSpotifySDK(token) {
      return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://sdk.scdn.co/spotify-player.js";
        script.async = true;
  
        window.onSpotifyWebPlaybackSDKReady = () => {
          initializePlayer(token);
          resolve();
        };
  
        script.onerror = () => reject(new Error("Failed to load Spotify SDK"));
        document.body.appendChild(script);
      });
    }
  
    // Initialize Spotify Player
    function initializePlayer(token) {
      player = new Spotify.Player({
        name: "Beat Shazam Game",
        getOAuthToken: (cb) => cb(token),
        volume: 0.5,
      });
  
      player.addListener("ready", async ({ device_id }) => {
        console.log("Player Ready with Device ID:", device_id);
        authMessage.textContent = "Player Ready! Start Playing!";
        try {
          await transferPlayback(device_id, token);
          fetchSongs("soul");
        } catch (error) {
          console.error("Error transferring playback:", error.message);
          authMessage.textContent = "Playback transfer failed.";
        }
      });
  
      player.addListener("not_ready", ({ device_id }) => {
        console.error("Player went offline:", device_id);
      });
  
      player.addListener("authentication_error", ({ message }) => {
        console.error("Authentication error:", message);
        authMessage.textContent = "Authentication error. Please log in again.";
        loginButton.style.display = "block";
      });
  
      player.connect();
    }
  
    // Transfer Playback
    async function transferPlayback(deviceId, token) {
      const response = await fetch("https://api.spotify.com/v1/me/player", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ device_ids: [deviceId], play: false }),
      });
  
      if (!response.ok) {
        throw new Error("Failed to transfer playback to Web Player.");
      }
      console.log("Playback transferred successfully.");
    }
  
    // Fetch Songs
    async function fetchSongs(genre) {
      try {
        const response = await fetch(`/fetch-songs?genre=${genre}`);
        const data = await response.json();
  
        if (data.success) {
          game.allSongs = data.songs;
          loadGameRound();
        } else {
          throw new Error("Failed to fetch songs.");
        }
      } catch (error) {
        console.error("Error fetching songs:", error.message);
        authMessage.textContent = "Error fetching songs.";
      }
    }
  
    // Load a Game Round
    function loadGameRound() {
      const correctSong = game.allSongs[Math.floor(Math.random() * game.allSongs.length)];
      game.correctSong = correctSong;
  
      optionsContainer.innerHTML = "";
      game.allSongs.slice(0, 4).forEach((song) => {
        const button = document.createElement("button");
        button.textContent = `${song.songName} - ${song.artist}`;
        button.addEventListener("click", () => checkAnswer(song.uri));
        optionsContainer.appendChild(button);
      });
  
      playSong(correctSong.uri);
    }
  
    // Play a Song
    async function playSong(uri) {
      const token = localStorage.getItem("spotify_access_token");
      await fetch("https://api.spotify.com/v1/me/player/play", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ uris: [uri] }),
      });
    }
  
    // Check Answer
    function checkAnswer(uri) {
      if (uri === game.correctSong.uri) {
        game.score++;
        alert("Correct!");
      } else {
        alert("Wrong!");
      }
      scoreElement.textContent = `Score: ${game.score}`;
      loadGameRound();
    }
  
    // Start Authentication Process
    await authenticate();
  })();
  