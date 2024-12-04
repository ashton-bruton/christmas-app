import {
  getDatabase,
  ref,
  set,
  get,
  child,
  onValue,
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
  return set(userRef, {
    firstName,
    lastName,
    email,
    status,
    character,
    assignedName,
  })
    .then(() => {
      console.log("User added successfully!");
    })
    .catch((error) => {
      console.error("Error adding user:", error);
    });
}

// Retrieve a user from the database
export async function getUserFromDatabase(userId) {
  try {
    const userRef = ref(database, "users/" + userId);
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

// Fetch all assigned characters to ensure uniqueness
export async function getAllAssignedCharacters() {
  try {
    const usersRef = ref(database, "users");
    const snapshot = await get(usersRef);

    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.values(data).map((user) => user.character); // Assuming 'character' is stored in user records
    }

    return [];
  } catch (error) {
    console.error("Error fetching assigned characters from database:", error);
    return [];
  }
}

// Real-time listener for changes in the database (optional, for real-time updates)
export function onUserDataChange(callback) {
  const usersRef = ref(database, "users");
  onValue(usersRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      callback(data);
    } else {
      callback({});
    }
  });
}

export { functions };
