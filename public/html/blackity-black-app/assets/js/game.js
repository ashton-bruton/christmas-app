// Load the JSON file and dynamically populate the HTML
fetch('https://christmas-app-e9bf7.web.app/html/blackity-black-app/assets/json/questions.json')
  .then(response => response.json())
  .then(data => initializeGame(data))
  .catch(error => console.error('Error loading questions:', error));

// Initialize the game
function initializeGame(data) {
  const remainingQuestions = filterRemainingQuestions(data);
  if (remainingQuestions.length === 0) {
    alert("All questions have been used!");
    return;
  }

  const questionData = selectRandomQuestion(remainingQuestions);
  renderQuestion(questionData);

  let currentTimer;
  startCountdown(15, () => switchToSteal(questionData));

  const submitButton = document.getElementById('submit');
  submitButton.addEventListener('click', () => {
    clearInterval(currentTimer);
    processAnswer(questionData);
  });
}

// Filter out questions that have already been asked
function filterRemainingQuestions(data) {
  const askedQuestions = getAskedQuestions();
  return data.filter(question => !askedQuestions.includes(question.id));
}

// Select a random question from the remaining ones
function selectRandomQuestion(questions) {
  const question = questions[Math.floor(Math.random() * questions.length)];
  storeAskedQuestion(question.id);
  return question;
}

// Render question and answers
function renderQuestion(questionData) {
  const questionElement = document.getElementById('question');
  questionElement.textContent = questionData.question;

  const allAnswers = shuffleArray([...questionData.incorrect_answers, questionData.answer]);
  const answerChoices = document.querySelectorAll('#answer-choices li');
  const submitButton = document.getElementById('submit');

  answerChoices.forEach((choice, index) => {
    choice.textContent = allAnswers[index];
    choice.dataset.answer = allAnswers[index];
    choice.addEventListener('click', () => {
      answerChoices.forEach(c => c.classList.remove('selected'));
      choice.classList.add('selected');
      submitButton.disabled = false;
      submitButton.classList.add('active');
    });
  });

  submitButton.disabled = true;
  submitButton.classList.remove('active');
}

// Process submitted answer
function processAnswer(questionData) {
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

  switchTurns(gameState);
  updateScoreboard(gameState);
  displayContent(questionData, feedback.textContent);
}

// Switch turns between teams
function switchTurns(gameState) {
  const currentTeam = gameState.currentTeam;
  gameState.currentTeam = currentTeam === "teamRed" ? "teamBlue" : "teamRed";
  setStorageWithExpiration("gameState", gameState, 12);
  highlightActiveTeam(gameState.currentTeam);
}

// End the game and display results
function endGame(gameState, winningTeam, questionData) {
  const questionBlock = document.getElementById('question-block');
  const iframeContent = questionData.content
    ? `<iframe width="560" height="315" src="${questionData.content}&autoplay=1" frameborder="0" allowfullscreen></iframe>`
    : `<p>No content available for this question.</p>`;

  questionBlock.innerHTML = `
    <div class="content color0 span-3-75" style="margin:0 auto; text-align: center;">
      <h2>Game Over</h2>
      <p>${gameState[winningTeam].name} wins with a score of ${gameState[winningTeam].score}!</p>
      ${iframeContent}
      <button id="restart">Restart Game</button>
    </div>
  `;

  document.getElementById('restart').addEventListener('click', () => {
    localStorage.clear();
    location.reload();
  });
}

// Start a countdown timer
function startCountdown(seconds, callback) {
  const timerElement = document.getElementById('timer');
  timerElement.textContent = seconds;

  currentTimer = setInterval(() => {
    seconds--;
    timerElement.textContent = seconds;

    if (seconds <= 0) {
      clearInterval(currentTimer);
      callback();
    }
  }, 1000);
}

// Switch to the steal phase
function switchToSteal(questionData) {
  const gameState = getStorageWithExpiration("gameState");
  switchTurns(gameState);
  displayMessage("It's your chance to steal the point!");

  startCountdown(10, () => {
    displayMessage("Time's up");
    setTimeout(() => {
      renderTimeoutScreen();
    }, 2000);
  });
}

// Display message for stealing phase or timeout
function displayMessage(message) {
  let messageElement = document.getElementById('message');
  if (!messageElement) {
    messageElement = document.createElement('div');
    messageElement.id = 'message';
    document.getElementById('scoreboard-container').appendChild(messageElement);
  }
  messageElement.textContent = message;
}

// Render timeout screen
function renderTimeoutScreen() {
  const questionBlock = document.getElementById('question-block');
  questionBlock.innerHTML = `
    <div class="content color0 span-3-75" style="margin:0 auto;">
      <p class="feedback incorrect">Time's up</p>
      <button id="next">Next</button>
    </div>
  `;
  document.getElementById('next').addEventListener('click', () => location.reload());
}

// Shuffle an array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Store and retrieve local data with expiration
function storeAskedQuestion(id) {
  const askedQuestions = getAskedQuestions();
  askedQuestions.push(id);
  localStorage.setItem("askedQuestions", JSON.stringify(askedQuestions));
}

function getAskedQuestions() {
  return JSON.parse(localStorage.getItem("askedQuestions")) || [];
}

function setStorageWithExpiration(key, value, hours) {
  const expiration = Date.now() + hours * 60 * 60 * 1000;
  localStorage.setItem(key, JSON.stringify({ value, expiration }));
}

function getStorageWithExpiration(key) {
  const data = JSON.parse(localStorage.getItem(key));
  if (!data || Date.now() > data.expiration) {
    localStorage.removeItem(key);
    return null;
  }
  return data.value;
}

// Initialize the game on page load
document.addEventListener("DOMContentLoaded", () => {
  const configForm = document.getElementById("config-form");
  const scoreboard = document.getElementById("scoreboard-container");
  const gameState = getStorageWithExpiration("gameState");

  if (gameState) {
    updateScoreboard(gameState);
    highlightActiveTeam(gameState.currentTeam);
    scoreboard.classList.remove("hidden");
  }

  configForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const initialGameState = {
      teamRed: { name: document.getElementById("team-red").value || "Red", score: 0 },
      teamBlue: { name: document.getElementById("team-blue").value || "Blue", score: 0 },
      currentTeam: "teamRed",
      playTo: parseInt(document.getElementById("game-score").value, 10),
    };
    setStorageWithExpiration("gameState", initialGameState, 12);
    updateScoreboard(initialGameState);
    location.reload();
  });
});

function updateScoreboard(state) {
  document.getElementById("team-red-name").textContent = state.teamRed.name;
  document.getElementById("team-red-score").textContent = state.teamRed.score;
  document.getElementById("team-blue-name").textContent = state.teamBlue.name;
  document.getElementById("team-blue-score").textContent = state.teamBlue.score;
}

function highlightActiveTeam(team) {
  const teamRedName = document.getElementById("team-red-name");
  const teamBlueName = document.getElementById("team-blue-name");
  teamRedName.classList.toggle("active", team === "teamRed");
  teamBlueName.classList.toggle("active", team === "teamBlue");
}
