import { addUser } from "./firebase.js";

// Function to fetch data from a JSON file
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
  event.preventDefault(); // Prevent the default form submission and page reload

  // Get form values
  const firstName = document.getElementById("firstName").value;
  const lastName = document.getElementById("lastName").value;
  const email = document.getElementById("email").value;

  // Get naughty/nice and character
  const { status, character } = await getRandomCharacter();

  // Update hidden input fields with values
  document.getElementById("status").value = status;
  document.getElementById("character").value = character;

  // Generate a unique user ID
  const userId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Save user data to Firebase
  addUser(userId, firstName, lastName, email, status, character);

  // Log the values to verify functionality (optional)
  console.log("Status:", status);
  console.log("Character:", character);
  console.log("User added to Firebase:", { userId, firstName, lastName, email, status, character });
});
