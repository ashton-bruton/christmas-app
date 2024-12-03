// Function to fetch data from a JSON file
async function fetchJSON(filePath) {
    try {
      const response = await fetch(`../../assets/json/${filePath}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return data.characters;
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
  
  // Function to get a random character
  async function getRandomCharacter() {
    const status = getNaughtyNice();
    const filePath = status === "nice" ? "heroes.json" : "villains.json";
    const characters = await fetchJSON(filePath);
    const character = getRandomValue(characters);
    return { status, character };
  }
  
  export { getRandomCharacter };
  