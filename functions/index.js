/* eslint-disable */
const functions = require("firebase-functions");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const cors = require("cors");
const express = require("express");
const fetch = require("node-fetch");
const admin = require("firebase-admin");
admin.initializeApp();
require("dotenv").config();

const SECRET_SANTA_URL = "https://christmas-app-e9bf7.web.app/assets/json/secret_santa.json";

// Fetch and cache Secret Santa map
let secretSantaMap = {};
async function loadSecretSantaMap() {
  try {
    const response = await fetch(SECRET_SANTA_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch secret_santa.json: ${response.statusText}`);
    }
    secretSantaMap = await response.json();
    console.log("Secret Santa map loaded successfully.");
  } catch (error) {
    console.error("Error loading secret_santa.json:", error);
    secretSantaMap = {}; // Fallback to empty map
  }
}
loadSecretSantaMap(); // Load data on initialization

const CLIENT_ID = process.env.CLIENT_ID || functions.config().google.client_id;
const CLIENT_SECRET = process.env.CLIENT_SECRET || functions.config().google.client_secret;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN || functions.config().google.refresh_token;

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

// Middleware to parse JSON and handle CORS
const app = express();
app.use(express.json());
app.use(cors({ origin: "https://christmas-app-e9bf7.web.app" }));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Spotify Authorization
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || functions.config().spotify.spotify_client_id;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || functions.config().spotify.spotify_client_secret;
let spotifyAccessToken = null;

// Refresh Spotify Token
async function refreshSpotifyToken() {
  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Spotify token: ${response.statusText}`);
    }

    const data = await response.json();
    spotifyAccessToken = data.access_token;
    console.log("Spotify token refreshed successfully.");
  } catch (error) {
    console.error("Error refreshing Spotify token:", error);
  }
}

// Fetch Spotify Songs
async function fetchSpotifySongs(genre) {
  try {
    if (!spotifyAccessToken) await refreshSpotifyToken();

    const response = await fetch(
      `https://api.spotify.com/v1/search?q=genre:${genre}&type=track&limit=10`,
      {
        headers: {
          Authorization: `Bearer ${spotifyAccessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch Spotify songs: ${response.statusText}`);
    }

    const data = await response.json();
    return data.tracks.items.map((track) => ({
      uri: track.uri,
      songName: track.name,
      artist: track.artists.map((artist) => artist.name).join(", "),
    }));
  } catch (error) {
    console.error("Error fetching Spotify songs:", error);
    return [];
  }
}

// Endpoint for fetching songs
app.get("/fetch-songs", async (req, res) => {
  const genre = req.query.genre || "soul"; // Default to "soul" genre if not provided
  try {
    const songs = await fetchSpotifySongs(genre);
    res.status(200).json({ success: true, songs });
  } catch (error) {
    console.error("Error fetching songs:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch songs." });
  }
});

// Endpoint to get Spotify token
app.get("/spotify-token", async (req, res) => {
  try {
    if (!spotifyAccessToken) await refreshSpotifyToken();
    res.status(200).json({ accessToken: spotifyAccessToken });
  } catch (error) {
    console.error("Error fetching Spotify token:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch Spotify token." });
  }
});

// Spotify Token Refresh Scheduler (Every Hour)
setInterval(refreshSpotifyToken, 3600 * 1000); // Refresh every hour

// Start Express Server
app.listen(5001, () => {
  console.log("Server is running on port 5001");
});

// Firebase Functions
exports.sendCharacterEmail = functions.https.onRequest(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Origin", "https://christmas-app-e9bf7.web.app");
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.status(204).send("");
    return;
  }

  res.set("Access-Control-Allow-Origin", "https://christmas-app-e9bf7.web.app");

  const { email, character, status, firstName } = req.body;

  if (!email || !character || !status || !firstName) {
    res.status(400).json({ success: false, message: "Missing required fields." });
    return;
  }

  try {
    const accessToken = await oAuth2Client.getAccessToken();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: "ashton.bruton@gmail.com",
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken.token,
      },
    });

    const statusColor = status.toLowerCase() === "naughty" ? "red" : "green";
    const secretSantaMessage = secretSantaMap[email]
      ? `<p class="secretSanta-body"><strong>Shhhh....</strong> you have been assigned <strong>${secretSantaMap[email]}</strong> for this year's Secret Santa.</p>`
      : "";

    const mailOptions = {
      from: "Naughty Or Nice Game <projectblvckjvck@gmail.com>",
      to: email,
      bcc: "projectblvckjvck@gmail.com",
      subject: "Your Christmas Character",
      html: `
        <div>${secretSantaMessage}</div>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: "Email sent successfully." });
  } catch (error) {
    console.error("Error sending email:", error.message);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});
