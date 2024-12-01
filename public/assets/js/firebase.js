// import { initializeApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyDSxcdKZxf4U1hI49hRPRd-jFOLADRO-EQ",
  authDomain: "christmas-app-e9bf7.firebaseapp.com",
  databaseURL: "https://christmas-app-e9bf7-default-rtdb.firebaseio.com",
  projectId: "christmas-app-e9bf7",
  storageBucket: "christmas-app-e9bf7.firebasestorage.app",
  messagingSenderId: "897073151487",
  appId: "1:897073151487:web:aa0b74bc46ba9cce167bca",
  measurementId: "G-MC7796V71Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const analytics = getAnalytics(app);

function addUser(userId, firstName, lastName, email, status, character) {
    const userRef = ref(database, 'users/' + userId);
    set(userRef, {
      firstName: firstName,
      lastName: lastName,
      email: email,
      status: status,
      character: character
    })
    .then(() => {
      console.log("User added successfully!");
    })
    .catch((error) => {
      console.error("Error adding user:", error);
    });
  }
  
  // Example usage
//   addUser("userId1", "John", "Doe", "john.doe@example.com");

import { get, ref } from "firebase/database";

function getUser(userId) {
  const userRef = ref(database, 'users/' + userId);
  get(userRef)
    .then((snapshot) => {
      if (snapshot.exists()) {
        console.log("User data:", snapshot.val());
      } else {
        console.log("No user data available");
      }
    })
    .catch((error) => {
      console.error("Error reading user data:", error);
    });
}

// Example usage
// getUser("userId1");

  