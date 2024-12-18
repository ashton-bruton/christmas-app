// Load the JSON file and dynamically populate the HTML
fetch('../../assets/json/questions.json')
  .then(response => response.json())
  .then(data => {
    // Get the first question (modify if you want to use more questions)
    const questionData = data[0];

    // Populate the question text
    const questionElement = document.getElementById('question');
    questionElement.textContent = questionData.question;

    // Prepare answers
    const allAnswers = [...questionData.incorrect_answers, questionData.answer];
    shuffleArray(allAnswers); // Randomize the order of answers

    // Populate answer choices
    const answerChoices = document.querySelectorAll('#answer-choices li');
    answerChoices.forEach((choice, index) => {
      choice.textContent = allAnswers[index];
      choice.dataset.answer = allAnswers[index];

      // Add click event listener to each choice
      choice.addEventListener('click', () => {
        answerChoices.forEach(c => c.classList.remove('selected'));
        choice.classList.add('selected');

        // Enable the submit button
        document.getElementById('submit').disabled = false;
      });
    });

    // Submit button logic
    const submitButton = document.getElementById('submit');
    submitButton.disabled = true; // Initially disabled
    submitButton.addEventListener('click', () => {
      const selectedChoice = document.querySelector('.selected');

      if (!selectedChoice) return; // Prevent submission without a selection

      const feedback = document.createElement('p');
      if (selectedChoice.dataset.answer === questionData.answer) {
        feedback.textContent = 'Correct';
        feedback.style.color = 'green';
      } else {
        feedback.textContent = 'Incorrect';
        feedback.style.color = 'red';
      }

      // Replace content with the YouTube iframe
      const questionBlock = document.getElementById('question-block');
      questionBlock.innerHTML = `
        <p>${feedback.textContent}</p>
        <iframe width="560" height="315" 
          src="${questionData.content}" 
          title="YouTube video player" frameborder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
          referrerpolicy="strict-origin-when-cross-origin" allowfullscreen>
        </iframe>
        <button id="next">Next</button>
      `;

      // Add event listener to the next button
      document.getElementById('next').addEventListener('click', () => {
        location.reload(); // Reload the page for simplicity (modify if needed for multi-question support)
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
