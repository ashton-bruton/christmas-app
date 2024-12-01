async function fetchJSON(filePath) {
    try {
      const response = await fetch(`../../assets/json/${filePath}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.characters; // Return the "characters" array
    } catch (error) {
      console.error("Error fetching JSON:", error);
      return [];
    }
  }
  
  // Function to get a random value from an array
  function getRandomValue(array) {
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
  }
  
  // Function to randomly return "nice" or "naughty"
  function getNaughtyNice() {
    return Math.random() < 0.5 ? "nice" : "naughty";
  }
  
  // Function to decide between heroes and villains
  async function getRandomCharacter() {
    const result = getNaughtyNice(); // Randomly get "nice" or "naughty"
  
    let character;
    if (result === "nice") {
      const heroes = await fetchJSON("heroes.json");
      character = getRandomValue(heroes); // Random hero
    } else {
      const villains = await fetchJSON("villains.json");
      character = getRandomValue(villains); // Random villain
    }
  
    // Return both status and character
    return { status: result, character };
  }
  
  // Add event listener to handle form submission
  document.getElementById("signup-form").addEventListener("submit", async (event) => {
    event.preventDefault(); // Prevent the form from submitting normally
  
    // Get naughty/nice and character
    const { status, character } = await getRandomCharacter();
  
    // Update hidden input fields with values
    document.getElementById("status").value = status;
    document.getElementById("character").value = character;
  
    // Submit the form
    event.target.submit(); // Submit the form programmatically
  });
  