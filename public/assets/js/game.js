(async function () {
    "use strict";
  
    const CLIENT_ID = "17e06f98389c4e1daed074f8142138f0";
    const REDIRECT_URI = "https://christmas-app-e9bf7.web.app/html/redirect.html";
    const SCOPES = [
      "streaming",
      "user-read-playback-state",
      "user-modify-playback-state",
      "user-read-currently-playing",
      "app-remote-control",
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
          loginButton.style.display = "none"; // Hide login button
          await loadSpotifySDK(token);
        } catch (error) {
          authMessage.textContent = "Authentication error. Please log in again.";
          console.error("Authentication error:", error.message);
          loginButton.style.display = "block";
        }
      } else {
        loginButton.style.display = "block";
        loginButton.addEventListener("click", () => {
          window.location.href = AUTH_URL;
        });
      }
    }
  
    async function verifyScopes(token) {
      const response = await fetch("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      if (!response.ok) {
        throw new Error("Token validation failed. Please re-authenticate.");
      }
      console.log("Token is valid.");
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
          await transferPlayback(device_id);
          fetchSongs("soul");
        } catch (error) {
          console.error("Error transferring playback:", error.message);
          authMessage.textContent = "Failed to transfer playback.";
        }
      });
  
      player.addListener("not_ready", ({ device_id }) => {
        console.error("Player went offline with Device ID:", device_id);
        authMessage.textContent = "Player offline. Please reconnect.";
      });
  
      player.addListener("authentication_error", ({ message }) => {
        console.error("Authentication error:", message);
        authMessage.textContent = "Authentication error. Please log in again.";
        loginButton.style.display = "block";
      });
  
      player.connect();
    }
  
    // Transfer Playback to Spotify Player
    async function transferPlayback(deviceId) {
      const token = localStorage.getItem("spotify_access_token");
      const response = await fetch("https://api.spotify.com/v1/me/player", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ device_ids: [deviceId], play: false }),
      });
  
      if (!response.ok) {
        throw new Error("Failed to transfer playback to Spotify Web Player.");
      }
    }
  
    // Fetch Songs from Backend
    async function fetchSongs(genre) {
      try {
        const response = await fetch(`/fetch-songs?genre=${genre}`);
        const data = await response.json();
  
        if (data.success) {
          game.allSongs = data.songs;
          loadGameRound();
        } else {
          throw new Error(data.message);
        }
      } catch (error) {
        console.error("Error fetching songs:", error.message);
        authMessage.textContent = "Failed to fetch songs.";
      }
    }
  
    // Load a Game Round
    function loadGameRound() {
      const correctSong = getRandomSong();
      const options = generateOptions(correctSong);
      game.correctSong = correctSong;
  
      playSong(correctSong.uri);
  
      optionsContainer.innerHTML = "";
      options.forEach((option) => {
        const button = document.createElement("button");
        button.textContent = `${option.songName} - ${option.artist}`;
        button.addEventListener("click", () => checkAnswer(option.uri));
        optionsContainer.appendChild(button);
      });
    }
  
    // Play a Song
    async function playSong(uri) {
      try {
        const token = localStorage.getItem("spotify_access_token");
        await fetch("https://api.spotify.com/v1/me/player/play", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ uris: [uri] }),
        });
      } catch (error) {
        console.error("Error playing song:", error.message);
      }
    }
  
    function getRandomSong() {
      const randomIndex = Math.floor(Math.random() * game.allSongs.length);
      return game.allSongs[randomIndex];
    }
  
    function generateOptions(correctSong) {
      const otherOptions = game.allSongs.filter((song) => song.uri !== correctSong.uri);
      const randomOptions = otherOptions.sort(() => Math.random() - 0.5).slice(0, 3);
      randomOptions.push(correctSong);
      return randomOptions.sort(() => Math.random() - 0.5);
    }
  
    function checkAnswer(selectedUri) {
      if (selectedUri === game.correctSong.uri) {
        alert("🎉 Correct! Great job!");
        game.score++;
      } else {
        alert(`❌ Wrong! The correct answer was: ${game.correctSong.songName}`);
      }
      scoreElement.textContent = `Score: ${game.score}`;
      loadGameRound();
    }
  
    // Start Authentication Process
    await authenticate();
  })();
  