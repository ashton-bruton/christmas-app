const CLIENT_ID = "17e06f98389c4e1daed074f8142138f0";
const CLIENT_SECRET = "03f58379bd854c468edbeead30dd61c4";

const game = {
  score: 0,
  correctSong: null,
  token: null,
};

// Authenticate and get access token
async function authenticateSpotify() {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + btoa(CLIENT_ID + ":" + CLIENT_SECRET),
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();
  game.token = data.access_token;
}

// Fetch random songs
async function fetchRandomSongs() {
  const genres = ["pop", "rock", "hip-hop", "jazz", "classical"];
  const randomGenre = genres[Math.floor(Math.random() * genres.length)];

  const response = await fetch(
    `https://api.spotify.com/v1/search?q=genre:${randomGenre}&type=track&limit=5`,
    {
      headers: {
        Authorization: `Bearer ${game.token}`,
      },
    }
  );

  const data = await response.json();
  return data.tracks.items;
}

// Display the game with options
async function loadGame() {
  const songs = await fetchRandomSongs();
  game.correctSong = songs[Math.floor(Math.random() * songs.length)];

  // Load the song preview
  const audioElement = document.getElementById("songPreview");
  audioElement.src = game.correctSong.preview_url;

  // Populate answer options
  const optionsContainer = document.getElementById("optionsContainer");
  optionsContainer.innerHTML = "";

  songs.forEach((song) => {
    const button = document.createElement("button");
    button.textContent = song.name;
    button.addEventListener("click", () => checkAnswer(song.name));
    optionsContainer.appendChild(button);
  });
}

// Check if the answer is correct
function checkAnswer(selectedName) {
  if (selectedName === game.correctSong.name) {
    alert("🎉 Correct! You guessed it!");
    game.score++;
  } else {
    alert(`❌ Wrong! The correct answer was: ${game.correctSong.name}`);
  }
  document.getElementById("score").textContent = `Score: ${game.score}`;
  loadGame();
}

// Initialize the game
(async function () {
  await authenticateSpotify();
  await loadGame();
})();
