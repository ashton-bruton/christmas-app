(async function () {
    "use strict";
  
    const $body = document.querySelector("body");
    const audioElement = document.getElementById("songPreview");
    const optionsContainer = document.getElementById("optionsContainer");
    let game = { score: 0, correctSong: null, allSongs: [] };
  
    // Your Spotify Client ID and Secret
    const CLIENT_ID = "17e06f98389c4e1daed074f8142138f0";
    const CLIENT_SECRET = "03f58379bd854c468edbeead30dd61c4";
  
    // Fetch Spotify OAuth Token
    async function getSpotifyToken() {
      try {
        const response = await fetch("https://accounts.spotify.com/api/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization:
              "Basic " + btoa(`${CLIENT_ID}:${CLIENT_SECRET}`),
          },
          body: "grant_type=client_credentials",
        });
  
        if (!response.ok) {
          throw new Error("Failed to fetch Spotify token");
        }
  
        const data = await response.json();
        return data.access_token;
      } catch (error) {
        console.error("Error fetching Spotify token:", error.message);
        return null;
      }
    }
  
    // Fetch Songs from Spotify
    async function fetchSongs(genre) {
      try {
        const token = await getSpotifyToken();
        if (!token) throw new Error("Unable to get Spotify token");
  
        const response = await fetch(
          `https://api.spotify.com/v1/search?q=genre:"${genre}"&type=track&limit=10`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
  
        if (!response.ok) throw new Error("Failed to fetch songs from Spotify");
  
        const data = await response.json();
        game.allSongs = data.tracks.items.map((track) => ({
          id: track.id,
          songName: track.name,
          artist: track.artists.map((artist) => artist.name).join(", "),
          previewUrl: track.preview_url,
          album: track.album.name,
        }));
      } catch (error) {
        console.error("Error fetching songs:", error.message);
      }
    }
  
    // Select Random Song
    function getRandomSong() {
      const randomIndex = Math.floor(Math.random() * game.allSongs.length);
      return game.allSongs[randomIndex];
    }
  
    // Generate Options (Including Correct Answer)
    function generateOptions(correctSong) {
      const allOptions = game.allSongs.filter((song) => song.id !== correctSong.id);
      const randomOptions = allOptions.sort(() => 0.5 - Math.random()).slice(0, 3);
      randomOptions.push(correctSong); // Add the correct answer
      return randomOptions.sort(() => 0.5 - Math.random()); // Shuffle options
    }
  
    // Load Game Round
    function loadGameRound() {
      const correctSong = getRandomSong();
      const options = generateOptions(correctSong);
      game.correctSong = correctSong;
  
      // Play Song Preview
      audioElement.src = correctSong.previewUrl;
      audioElement.play();
  
      // Display Options
      optionsContainer.innerHTML = "";
      options.forEach((option) => {
        const button = document.createElement("button");
        button.textContent = `${option.songName} - ${option.artist}`;
        button.addEventListener("click", () => checkAnswer(option.id));
        optionsContainer.appendChild(button);
      });
    }
  
    // Check Answer
    function checkAnswer(selectedId) {
      if (selectedId === game.correctSong.id) {
        alert("🎉 Correct! Great job!");
        game.score++;
      } else {
        alert(
          `❌ Wrong! The correct answer was: ${game.correctSong.songName} by ${game.correctSong.artist}`
        );
      }
      document.getElementById("score").textContent = `Score: ${game.score}`;
      loadGameRound();
    }
  
    // Initialize Game
    async function initGame() {
      await fetchSongs("soul"); // Fetch songs in the "Soul" genre
      loadGameRound();
    }
  
    await initGame();
  })();
  
