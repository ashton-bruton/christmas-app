(async function () {
    "use strict";
  
    const loginButton = document.getElementById("loginButton");
    const authMessage = document.getElementById("authMessage");
    const optionsContainer = document.getElementById("optionsContainer");
    const scoreElement = document.getElementById("score");
  
    let game = { score: 0, correctSong: null, allSongs: [] };
    let player = null;
  
    // Fetch token from server
    async function fetchToken() {
      try {
        const response = await fetch("/token");
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message);
        }
        return data.accessToken;
      } catch (error) {
        console.error("Error fetching token:", error.message);
        authMessage.textContent = "Failed to fetch token. Please log in.";
      }
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
  
      player.addListener("ready", ({ device_id }) => {
        console.log("Player Ready with Device ID:", device_id);
        authMessage.textContent = "Player Ready! Start Playing!";
        fetchSongs("soul");
      });
  
      player.addListener("not_ready", ({ device_id }) => {
        console.error("Player went offline:", device_id);
      });
  
      player.addListener("authentication_error", ({ message }) => {
        console.error("Authentication error:", message);
        authMessage.textContent = "Authentication error. Please log in again.";
      });
  
      player.connect();
    }
  
    // Fetch Songs from Backend
    async function fetchSongs(genre) {
      try {
        const response = await fetch(`/fetch-songs?genre=${genre}`);
        const data = await response.json();
  
        if (!data.success) {
          throw new Error("Failed to fetch songs.");
        }
  
        game.allSongs = data.songs;
        loadGameRound();
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
      const token = await fetchToken();
      if (!token) return;
  
      try {
        await fetch("https://api.spotify.com/v1/me/player/play", {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({ uris: [uri] }),
        });
      } catch (error) {
        console.error("Error playing song:", error.message);
      }
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
  
    // Start Process
    const token = await fetchToken();
    if (token) {
      await loadSpotifySDK(token);
    } else {
      loginButton.style.display = "block";
      loginButton.addEventListener("click", () => {
        window.location.href = "/login";
      });
    }
  })();
  