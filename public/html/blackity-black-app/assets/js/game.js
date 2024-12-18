// Load the JSON file and dynamically populate the HTML
fetch('https://christmas-app-e9bf7.web.app/html/blackity-black-app/assets/json/questions.json')
  .then(response => response.json())
  .then(data => {
    const questionData = data[0]; // Get the first question

    // Populate the question text
    const questionElement = document.getElementById('question');
    questionElement.textContent = questionData.question;

    // Prepare answers
    const allAnswers = [...questionData.incorrect_answers, questionData.answer];
    shuffleArray(allAnswers);

    // Populate answer choices
    const answerChoices = document.querySelectorAll('#answer-choices li');
    const submitButton = document.getElementById('submit');
    submitButton.classList.remove('active');
    submitButton.disabled = true;

    answerChoices.forEach((choice, index) => {
      choice.textContent = allAnswers[index];
      choice.dataset.answer = allAnswers[index];

      // Add click event listener to each choice
      choice.addEventListener('click', () => {
        answerChoices.forEach(c => c.classList.remove('selected'));
        choice.classList.add('selected');

        // Enable and show the submit button
        submitButton.disabled = false;
        submitButton.classList.add('active');
      });
    });

    // Submit button logic
    submitButton.addEventListener('click', () => {
      const selectedChoice = document.querySelector('.selected');
      if (!selectedChoice) return;

      const feedback = document.createElement('p');
      feedback.classList.add('feedback');
      if (selectedChoice.dataset.answer === questionData.answer) {
        feedback.textContent = 'Correct';
        feedback.classList.add('correct');
      } else {
        feedback.textContent = 'Incorrect';
        feedback.classList.add('incorrect');
      }

      // Replace content with the YouTube iframe
      const questionBlock = document.getElementById('question-block');
      questionBlock.innerHTML = `
        <div class="content color0 span-3-75" style="margin:0 auto;">
          <p class="feedback ${feedback.classList.contains('correct') ? 'correct' : 'incorrect'}">
            ${feedback.textContent}
          </p>
          <iframe width="560" height="315" 
            src="${questionData.content}&autoplay=1" 
            title="YouTube video player" frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            referrerpolicy="strict-origin-when-cross-origin" allowfullscreen>
          </iframe>
          <button id="next">Next</button>
        </div>
      `;

      // Add event listener to the next button
      document.getElementById('next').addEventListener('click', () => {
        location.reload(); // Reload the page for simplicity
      });
    });
  })
  .catch(error => console.error('Error loading questions:', error));

// Helper function to shuffle an array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Helper to set and get localStorage with expiration
function setStorageWithExpiration(key, value, hours) {
  const now = new Date();
  const expiration = now.getTime() + hours * 60 * 60 * 1000;
  const data = { value, expiration };
  localStorage.setItem(key, JSON.stringify(data));
}

function getStorageWithExpiration(key) {
  const data = JSON.parse(localStorage.getItem(key));
  if (!data) return null;
  const now = new Date();
  if (now.getTime() > data.expiration) {
    localStorage.removeItem(key);
    return null;
  }
  return data.value;
}

// Initialize settings
document.addEventListener("DOMContentLoaded", () => {
  const configForm = document.getElementById("config-form");
  const popover = document.getElementById("game-configuration");
  const scoreboard = document.getElementById("scoreboard");

  // Check if a game is ongoing
  const gameState = getStorageWithExpiration("gameState");

  if (gameState) {
    updateScoreboard(gameState);
    scoreboard.classList.remove("hidden");
  } else {
    popover.classList.remove("hidden");
  }

  // Handle form submission
  configForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const teamRedName = document.getElementById("team-red").value || "Red";
    const teamBlueName = document.getElementById("team-blue").value || "Blue";
    const playTo = parseInt(document.getElementById("game-score").value, 10);

    const initialGameState = {
      teamRed: { name: teamRedName, score: 0 },
      teamBlue: { name: teamBlueName, score: 0 },
      playTo,
    };

    setStorageWithExpiration("gameState", initialGameState, 12);
    updateScoreboard(initialGameState);
    popover.classList.add("hidden");
    scoreboard.classList.remove("hidden");
  });
});

// Update scoreboard dynamically
function updateScoreboard(state) {
  document.getElementById("team-red-name").textContent = state.teamRed.name;
  document.getElementById("team-red-score").textContent = state.teamRed.score;
  document.getElementById("team-blue-name").textContent = state.teamBlue.name;
  document.getElementById("team-blue-score").textContent = state.teamBlue.score;
}

// Example of updating scores
function addPointToTeam(team) {
  const gameState = getStorageWithExpiration("gameState");
  if (!gameState) return;

  gameState[team].score += 1;

  if (gameState[team].score >= gameState.playTo) {
    document.body.innerHTML = `<h1>${gameState[team].name} Wins!</h1>`;
    localStorage.removeItem("gameState");
    return;
  }

  setStorageWithExpiration("gameState", gameState, 12);
  updateScoreboard(gameState);
}
