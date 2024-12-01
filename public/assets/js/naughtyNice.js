// function getNaughtyNice() {
//     return Math.random() < 0.5 ? "nice" : "naughty";
//   }
  
//   // Example usage
//   console.log(getNaughtyNice()); // Randomly returns "nice" or "naughty"
  
  // Function to fetch data from a JSON file
async function fetchJSON(filePath) {
    try {
      const response = await fetch(`../../assets/json/${filePath}`);
      console.log("Response:", response);

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
  
  // Function to decide between heroes and villains
  async function getRandomCharacter() {
    const result = getNaughtyNice(); // "nice" or "naughty"
  
    if (result === "nice") {
      const heroes = await fetchJSON("heroes.json");
      return getRandomValue(heroes); // Random hero
    } else {
      const villains = await fetchJSON("villains.json");
      return getRandomValue(villains); // Random villain
    }
  }
  
  // Helper function to randomly return "nice" or "naughty"
  function getNaughtyNice() {
    return Math.random() < 0.5 ? "nice" : "naughty";
  }
  
  // Example usage:
  getRandomCharacter().then((character) => console.log("Random character:", character));
  