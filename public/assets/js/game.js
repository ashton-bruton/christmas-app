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
    let player = null;
    let game = { score: 0, correctSong: null, allSongs: [] };
  
    // Authentication Flow
    async function authenticate() {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get("access_token");
  
      if (accessToken) {
        token = accessToken;
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
  
    // Spotify Web Playback SDK Initialization
    window.onSpotifyWebPlaybackSDKReady = () => {
      authMessage.textContent = "Initializing Spotify Player...";
      loginButton.style.display = "none";
  
      player = new Spotify.Player({
        name: "Beat Shazam Game",
        getOAuthToken: (cb) => cb(token),
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
  
    // Load Game Round
    function loadGameRound() {
      const correctSong = getRandomSong();
      const options = generateOptions(correctSong);
      game.correctSong = correctSong;
  
      // Play Song
      playTrack(correctSong.uri);
  
      // Display Options
      optionsContainer.innerHTML = "";
      options.forEach((option) => {
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
      const allOptions = game.allSongs.filter((song) => song.uri !== correctSong.uri);
      const randomOptions = allOptions.sort(() => 0.5 - Math.random()).slice(0, 3);
      randomOptions.push(correctSong); // Include the correct answer
      return randomOptions.sort(() => 0.5 - Math.random()); // Shuffle options
    }
  
    // Play Track
    function playTrack(trackUri) {
      fetch("https://api.spotify.com/v1/me/player/play", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          uris: [trackUri],
        }),
      }).catch((error) => console.error("Error playing track:", error));
    }
  
    // Check Answer
    function checkAnswer(selectedUri) {
      if (selectedUri === game.correctSong.uri) {
        alert("🎉 Correct! Great job!");
        game.score++;
      } else {
        alert(
          `❌ Wrong! The correct answer was: ${game.correctSong.songName} by ${game.correctSong.artist}`
        );
      }
      scoreElement.textContent = `Score: ${game.score}`;
      loadGameRound();
    }
  
    // Start the authentication process
    await authenticate();
  })();
  