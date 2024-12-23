// Load the JSON file and dynamically populate the HTML
function loadQuestion() {
  fetch('https://christmas-app-e9bf7.web.app/html/blackity-black-app/assets/json/questions.json')
    .then(response => response.json())
    .then(data => {
      const askedQuestions = getAskedQuestions();
      const remainingQuestions = data.filter(question => !askedQuestions.includes(question.id));

      if (remainingQuestions.length === 0) {
        alert("All questions have been used!");
        return;
      }

      const questionData = remainingQuestions[Math.floor(Math.random() * remainingQuestions.length)];
      storeAskedQuestion(questionData.id);

      const questionElement = document.getElementById('question');
      questionElement.textContent = questionData.question;

      const allAnswers = [...questionData.incorrect_answers, questionData.answer];
      shuffleArray(allAnswers);

      const answerChoices = document.querySelectorAll('#answer-choices li');
      const submitButton = document.getElementById('submit');
      submitButton.classList.remove('active');
      submitButton.disabled = true;

      answerChoices.forEach((choice, index) => {
        choice.textContent = allAnswers[index];
        choice.dataset.answer = allAnswers[index];
        choice.classList.remove('selected');

        choice.addEventListener('click', () => {
          answerChoices.forEach(c => c.classList.remove('selected'));
          choice.classList.add('selected');
          submitButton.disabled = false;
          submitButton.classList.add('active');
        });
      });

      // Start the timer for the new question
      startCountdown(15, () => {
        switchToSteal(questionData);
      });

      submitButton.addEventListener('click', () => {
        clearInterval(currentTimer);
        handleAnswerSubmission(questionData);
      });
    })
    .catch(error => console.error('Error loading questions:', error));
}

// Function to end the game
function endGame(gameState, winningTeam, questionData) {
  const questionBlock = document.getElementById('question-block');

  // Check if questionData contains content to display
  const iframeContent = questionData?.content
    ? `<iframe width="560" height="315" 
          src="${questionData.content}&autoplay=1" 
          title="YouTube video player" frameborder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
          referrerpolicy="strict-origin-when-cross-origin" allowfullscreen>
       </iframe>` 
    : `<p>No content available for this question.</p>`;

  // Render the game-over screen
  questionBlock.innerHTML = `
    <div class="content color0 span-3-75" style="margin:0 auto; text-align: center;">
      <h2>Game Over</h2>
      <p>${gameState[winningTeam].name} wins with a score of ${gameState[winningTeam].score}!</p>
      ${iframeContent}
      <button id="restart">Restart Game</button>
    </div>
  `;

  updateScoreboard(gameState); // Update scoreboard with final scores

  // Clear game state and restart
  document.getElementById('restart').addEventListener('click', () => {
    localStorage.removeItem("gameState");
    localStorage.removeItem("askedQuestions");
    location.reload();
  });
}

// Function to handle answer submission
function handleAnswerSubmission(questionData) {
  const selectedChoice = document.querySelector('.selected');
  if (!selectedChoice) return;

  const feedback = document.createElement('p');
  feedback.classList.add('feedback');

  const gameState = getStorageWithExpiration("gameState");
  const currentTeam = gameState.currentTeam;

  if (selectedChoice.dataset.answer === questionData.answer) {
    feedback.textContent = 'Correct';
    feedback.classList.add('correct');
    gameState[currentTeam].score += 1;
  } else {
    feedback.textContent = 'Incorrect';
    feedback.classList.add('incorrect');
  }

  if (gameState[currentTeam].score >= gameState.playTo) {
    endGame(gameState, currentTeam, questionData);
    return;
  }

  gameState.currentTeam = currentTeam === "teamRed" ? "teamBlue" : "teamRed";
  setStorageWithExpiration("gameState", gameState, 12);
  updateScoreboard(gameState);
  highlightActiveTeam(gameState.currentTeam);

  loadQuestion();
}

// Function to start the countdown timer
function startCountdown(seconds, callback) {
  const timerElement = document.getElementById('timer');
  if (!timerElement) return;

  clearInterval(currentTimer); // Clear any existing timer

  timerElement.textContent = seconds; // Display the initial seconds
  timerElement.style.visibility = "visible"; // Ensure the timer is visible

  currentTimer = setInterval(() => {
    seconds--;
    timerElement.textContent = seconds; // Update the clock display

    if (seconds <= 0) {
      clearInterval(currentTimer);
      callback(); // Trigger the callback when the timer hits 0
    }
  }, 1000);
}

// Function to switch to the steal phase
function switchToSteal(questionData) {
  const gameState = getStorageWithExpiration("gameState");
  const currentTeam = gameState.currentTeam;
  gameState.currentTeam = currentTeam === "teamRed" ? "teamBlue" : "teamRed";
  updateScoreboard(gameState);
  highlightActiveTeam(gameState.currentTeam);
  setStorageWithExpiration("gameState", gameState, 12);

  let messageElement = document.getElementById('message');
  if (!messageElement) {
      messageElement = document.createElement('div');
      messageElement.id = 'message';
      document.getElementById('scoreboard-container').appendChild(messageElement);
  }
  messageElement.textContent = "It's your chance to steal the point!";

  startCountdown(10, () => {
      const submitButton = document.getElementById('submit');
      submitButton.textContent = "Time's up";
      submitButton.disabled = true;
      setTimeout(() => {
          const questionBlock = document.getElementById('question-block');
          questionBlock.innerHTML = `
              <div class="content color0 span-3-75" style="margin:0 auto;">
                  <p class="feedback incorrect">Time's up</p>
                  <button id="next">Next</button>
              </div>
          `;
          document.getElementById('next').addEventListener('click', () => {
              location.reload();
          });
      }, 2000);
  });
}

// Helper function to shuffle an array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Helper function to store asked question IDs
function storeAskedQuestion(id) {
  const askedQuestions = getAskedQuestions();
  askedQuestions.push(id);
  localStorage.setItem("askedQuestions", JSON.stringify(askedQuestions));
}

// Helper function to retrieve asked question IDs
function getAskedQuestions() {
  return JSON.parse(localStorage.getItem("askedQuestions")) || [];
}

// Helper function to set localStorage with expiration
function setStorageWithExpiration(key, value, hours) {
  const now = new Date();
  const expiration = now.getTime() + hours * 60 * 60 * 1000;
  const data = { value, expiration };
  localStorage.setItem(key, JSON.stringify(data));
}

// Helper function to get localStorage with expiration
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

// Initialize game settings and DOM interactions
document.addEventListener("DOMContentLoaded", () => {
  const configForm = document.getElementById("config-form");
  const popover = document.getElementById("game-configuration");
  const scoreboard = document.getElementById("scoreboard-container");
  const contentSection = document.querySelector(".content");

  const gameState = getStorageWithExpiration("gameState");

  if (gameState) {
    updateScoreboard(gameState);
    highlightActiveTeam(gameState.currentTeam);
    scoreboard.classList.remove("hidden");
    popover.style.display = "none";
    contentSection.style.visibility = "visible";
    loadQuestion(); // Load the first question if the game state exists
  } else {
    popover.style.display = "block";
    contentSection.style.visibility = "hidden";
  }

  configForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const teamRedName = document.getElementById("team-red").value || "Red";
    const teamBlueName = document.getElementById("team-blue").value || "Blue";
    const playTo = parseInt(document.getElementById("game-score").value, 10);

    const initialGameState = {
      teamRed: { name: teamRedName, score: 0 },
      teamBlue: { name: teamBlueName, score: 0 },
      currentTeam: "teamRed",
      playTo,
    };

    setStorageWithExpiration("gameState", initialGameState, 12);
    updateScoreboard(initialGameState);
    popover.style.display = "none";
    contentSection.style.visibility = "visible";
    scoreboard.classList.remove("hidden");
    highlightActiveTeam("teamRed");

    // Start the game by loading the first question
    loadQuestion();
  });
});

// Function to update the scoreboard dynamically
function updateScoreboard(state) {
  document.getElementById("team-red-name").textContent = state.teamRed.name;
  document.getElementById("team-red-score").textContent = state.teamRed.score;
  document.getElementById("team-blue-name").textContent = state.teamBlue.name;
  document.getElementById("team-blue-score").textContent = state.teamBlue.score;
}

// Function to highlight the active team on the scoreboard
function highlightActiveTeam(team) {
  const teamRedName = document.getElementById("team-red-name");
  const teamBlueName = document.getElementById("team-blue-name");

  teamRedName.classList.remove("active");
  teamBlueName.classList.remove("active");

  if (team === "teamRed") {
    teamRedName.classList.add("active");
  } else {
    teamBlueName.classList.add("active");
  }
}
