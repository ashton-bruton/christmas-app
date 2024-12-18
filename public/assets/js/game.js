(async function () {
    "use strict";
  
    const CLIENT_ID = "17e06f98389c4e1daed074f8142138f0";
    const REDIRECT_URI = "https://christmas-app-e9bf7.web.app/html/failure.html";
    const AUTH_URL = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(
      REDIRECT_URI
    )}&scope=streaming`;
  
    const loginButton = document.getElementById("loginButton");
    const authMessage = document.getElementById("authMessage");
    const optionsContainer = document.getElementById("optionsContainer");
    const scoreElement = document.getElementById("score");
    let game = { score: 0, correctSong: null, allSongs: [] };
    let token = null;
  
    // Spotify Authorization Flow
    async function authenticate() {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      token = params.get("access_token");
  
      if (token) {
        window.history.pushState("", document.title, window.location.pathname);
        authMessage.textContent = "Authenticated! Loading player...";
        initializePlayer();
      } else {
        loginButton.style.display = "block";
        loginButton.addEventListener("click", () => {
          window.location.href = AUTH_URL;
        });
      }
    }
  
    // Initialize Spotify Player
    function initializePlayer() {
      const player = new Spotify.Player({
        name: "Beat Shazam Game",
        getOAuthToken: cb => cb(token),
        volume: 0.5,
      });
  
      player.addListener("ready", ({ device_id }) => {
        console.log("Player Ready with Device ID:", device_id);
        authMessage.textContent = "Player ready! Fetching songs...";
        fetchSongs("soul"); // Load "soul" genre songs
      });
  
      player.addListener("not_ready", ({ device_id }) => {
        console.error("Player went offline with Device ID:", device_id);
      });
  
      player.connect();
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
  
    // Load Game Round
    function loadGameRound() {
      const correctSong = getRandomSong();
      const options = generateOptions(correctSong);
      game.correctSong = correctSong;
  
      playSong(correctSong.uri);
  
      optionsContainer.innerHTML = "";
      options.forEach(option => {
        const button = document.createElement("button");
        button.textContent = `${option.songName} - ${option.artist}`;
        button.addEventListener("click", () => checkAnswer(option.uri));
        optionsContainer.appendChild(button);
      });
    }
  
    // Get Random Song
    function getRandomSong() {
      const randomIndex = Math.floor(Math.random() * game.allSongs.length);
      return game.allSongs[randomIndex];
    }
  
    // Generate Answer Options
    function generateOptions(correctSong) {
      const otherOptions = game.allSongs.filter(song => song.uri !== correctSong.uri);
      const randomOptions = otherOptions.sort(() => Math.random() - 0.5).slice(0, 3);
      randomOptions.push(correctSong);
      return randomOptions.sort(() => Math.random() - 0.5);
    }
  
    // Play Song
    async function playSong(uri) {
      try {
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
  
    // Check Answer
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
  
    await authenticate();
  })();
  