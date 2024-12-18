(async function () {
    "use strict";
  
    const CLIENT_ID = "17e06f98389c4e1daed074f8142138f0";
    const REDIRECT_URI = "https://christmas-app-e9bf7.web.app/html/failure.html";
    const SCOPES = "streaming user-read-playback-state user-modify-playback-state";
  
    const AUTH_URL = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(
      REDIRECT_URI
    )}&scope=${encodeURIComponent(SCOPES)}`;
  
    const loginButton = document.getElementById("loginButton");
    const authMessage = document.getElementById("authMessage");
    const optionsContainer = document.getElementById("optionsContainer");
    const scoreElement = document.getElementById("score");
  
    let game = { score: 0, correctSong: null, allSongs: [] };
  
    // Spotify Authentication
    async function authenticate() {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const token = params.get("access_token");
  
      if (token) {
        localStorage.setItem("spotify_access_token", token);
        window.history.pushState("", document.title, window.location.pathname);
        authMessage.textContent = "Authenticated! Loading player...";
      } else {
        loginButton.style.display = "block";
        loginButton.addEventListener("click", () => {
          window.location.href = AUTH_URL;
        });
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
  
    // Start Authentication Process
    await authenticate();
  })();
  