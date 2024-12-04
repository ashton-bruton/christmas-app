import {
  getDatabase,
  ref,
  set,
  get,
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getFunctions } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-functions.js";

const firebaseConfig = {
  apiKey: "AIzaSyDSxcdKZxf4U1hI49hRPRd-jFOLADRO-EQ",
  authDomain: "christmas-app-e9bf7.firebaseapp.com",
  databaseURL: "https://christmas-app-e9bf7-default-rtdb.firebaseio.com",
  projectId: "christmas-app-e9bf7",
  storageBucket: "christmas-app-e9bf7.firebasestorage.app",
  messagingSenderId: "897073151487",
  appId: "1:897073151487:web:aa0b74bc46ba9cce167bca",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const functions = getFunctions(app);

// Add a user to the database
export function addUser(
  userId,
  firstName,
  lastName,
  email,
  status,
  character,
  assignedName
) {
  const userRef = ref(database, "users/" + userId);
  set(userRef, {
    firstName,
    lastName,
    email,
    status,
    character,
    assignedName,
  })
    .then(() => console.log("User added successfully!"))
    .catch((error) => console.error("Error adding user:", error));
}

// Retrieve a user from the database
export function getUser(userId) {
  const userRef = ref(database, "users/" + userId);
  get(userRef)
    .then((snapshot) => {
      if (snapshot.exists()) {
        console.log("User data:", snapshot.val());
      } else {
        console.log("No user data available");
      }
    })
    .catch((error) => console.error("Error reading user data:", error));
}

/**
 * Fetch user data from the database based on user ID.
 * @param {string} userId - The ID of the user to fetch.
 * @returns {Promise<Object|null>} - The user data or null if not found.
 */
export async function getUserFromDatabase(userId) {
  try {
    const db = getDatabase();
    const userRef = ref(db, `users/${userId}`);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      return null; // User does not exist
    }
  } catch (error) {
    console.error("Error fetching user from database:", error);
    throw error;
  }
}

export { functions };
