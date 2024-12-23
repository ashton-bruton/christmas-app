// Load the JSON file and dynamically populate the HTML
fetch('https://christmas-app-e9bf7.web.app/html/blackity-black-app/assets/json/questions.json')
  .then(response => response.json())
  .then(data => {
    // Filter out questions that have already been asked
    const askedQuestions = getAskedQuestions();
    const remainingQuestions = data.filter(question => !askedQuestions.includes(question.id));

    if (remainingQuestions.length === 0) {
      alert("All questions have been used!");
      return;
    }

    // Select a random question from the remaining ones
    const questionData = remainingQuestions[Math.floor(Math.random() * remainingQuestions.length)];
    storeAskedQuestion(questionData.id); // Store the asked question ID

    // Populate the question text
    const questionElement = document.getElementById('question');
    questionElement.textContent = questionData.question;

    // Prepare answers
    const allAnswers = [...questionData.incorrect_answers, questionData.answer];
    shuffleArray(allAnswers); // Randomize the order of answers

    // Populate answer choices
    const answerChoices = document.querySelectorAll('#answer-choices li');
    const submitButton = document.getElementById('submit');
    submitButton.classList.remove('active'); // Ensure button is hidden initially
    submitButton.disabled = true; // Initially disabled

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

    let currentTimer;
    startCountdown(15, () => {
      switchToSteal(questionData);
    });

    // Submit button logic
    submitButton.addEventListener('click', () => {
      clearInterval(currentTimer);
      const selectedChoice = document.querySelector('.selected');
      if (!selectedChoice) return; // Prevent submission without a selection

      const feedback = document.createElement('p');
      feedback.classList.add('feedback'); // Add feedback styling class

      const gameState = getStorageWithExpiration("gameState");
      const currentTeam = gameState.currentTeam;

      if (selectedChoice.dataset.answer === questionData.answer) {
        feedback.textContent = 'Correct';
        feedback.classList.add('correct');
        gameState[currentTeam].score += 1; // Increment score for current team
      } else {
        feedback.textContent = 'Incorrect';
        feedback.classList.add('incorrect');
      }

      // Check if the current team has reached the target score
      if (gameState[currentTeam].score >= gameState.playTo) {
        endGame(gameState, currentTeam);
        return; // Exit to prevent reloading the page
      }

      // Switch turns to the other team
      gameState.currentTeam = currentTeam === "teamRed" ? "teamBlue" : "teamRed";
      setStorageWithExpiration("gameState", gameState, 12); // Update game state

      updateScoreboard(gameState); // Update the scoreboard
      highlightActiveTeam(gameState.currentTeam); // Highlight the active team

      const questionBlock = document.getElementById('question-block');

      if (questionData.content) {
        // Replace content with the YouTube iframe

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
      } else {
        // Replace content with the fallback image
        questionBlock.innerHTML = `
          <div class="content color0 span-3-75" style="margin:0 auto;">
            <p class="feedback ${feedback.classList.contains('correct') ? 'correct' : 'incorrect'}">
              ${feedback.textContent}
            </p>
            <img src="https://christmas-app-e9bf7.web.app/html/blackity-black-app/images/coming-soon.jpg" alt="Coming Soon" width="500" height="600">
            <button id="next">Next</button>
          </div>
        `;
      }

      // Add event listener to the next button
      document.getElementById('next').addEventListener('click', () => {
        location.reload(); // Reload the page for simplicity (modify if needed for multi-question support)
      });
    });
  })
  .catch(error => console.error('Error loading questions:', error));

// Function to end the game
function endGame(gameState, winningTeam) {
  const questionBlock = document.getElementById('question-block');
  questionBlock.innerHTML = `
    <div class="content color0 span-3-75" style="margin:0 auto; text-align: center;">
      <h2>Game Over</h2>
      <p>${gameState[winningTeam].name} wins with a score of ${gameState[winningTeam].score}!</p>
      <button id="restart">Restart Game</button>
    </div>
  `;

  // Clear game state and reload
  document.getElementById('restart').addEventListener('click', () => {
    localStorage.removeItem("gameState");
    localStorage.removeItem("askedQuestions"); // Clear asked questions
    location.reload();
  });
}

// Timer management
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

function switchToSteal(questionData) {
  const gameState = getStorageWithExpiration("gameState");
  const currentTeam = gameState.currentTeam;
  gameState.currentTeam = currentTeam === "teamRed" ? "teamBlue" : "teamRed";
  updateScoreboard(gameState);
  highlightActiveTeam(gameState.currentTeam);
  setStorageWithExpiration("gameState", gameState, 12);

  const message = document.getElementById('message');
  message.textContent = "It's your chance to steal the point!";

  startCountdown(10, () => {
    const submitButton = document.getElementById('submit');
    submitButton.textContent = "Time's up";
    submitButton.disabled = true;
    setTimeout(() => {
      const feedback = document.createElement('p');
      feedback.textContent = "Time's up";
      feedback.classList.add('feedback', 'incorrect');
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

// Helper functions
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function storeAskedQuestion(id) {
  const askedQuestions = getAskedQuestions();
  askedQuestions.push(id);
  localStorage.setItem("askedQuestions", JSON.stringify(askedQuestions));
}

function getAskedQuestions() {
  return JSON.parse(localStorage.getItem("askedQuestions")) || [];
}

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
  const scoreboard = document.getElementById("scoreboard-container");
  const contentSection = document.querySelector(".content");

  popover.style.color = "black";

  const gameState = getStorageWithExpiration("gameState");

  if (gameState) {
    updateScoreboard(gameState);
    highlightActiveTeam(gameState.currentTeam);
    scoreboard.classList.remove("hidden");
    popover.style.display = "none";
    contentSection.style.visibility = "visible";
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

  teamRedName.classList.remove("active");
  teamBlueName.classList.remove("active");

  if (team === "teamRed") {
    teamRedName.classList.add("active");
  } else {
    teamBlueName.classList.add("active");
  }
}
