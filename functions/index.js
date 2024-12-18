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

// Spotify credentials
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || functions.config().spotify.spotify_client_id;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || functions.config().spotify.spotify_client_secret;
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || "https://christmas-app-e9bf7.web.app/html/redirect.html";
const SPOTIFY_SCOPES = [
  "streaming",
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
  "app-remote-control",
  "playlist-read-private",
  "playlist-read-collaborative",
  "playlist-modify-public",
  "playlist-modify-private",
  "user-library-read",
  "user-library-modify",
  "user-top-read",
  "user-read-recently-played",
  "user-follow-read",
  "user-follow-modify",
  "user-read-email",
  "user-read-private",
  "user-read-playback-position"
].join(" ");

let spotifyAccessToken = null;
let spotifyRefreshToken = null;

const app = express();
app.use(express.json());
app.use(cors({ origin: "https://christmas-app-e9bf7.web.app" }));

// Generate Spotify authorization URL
app.get("/spotify-auth-url", (req, res) => {
  const authUrl = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
    SPOTIFY_REDIRECT_URI
  )}&scope=${encodeURIComponent(SPOTIFY_SCOPES)}`;

  res.status(200).json({ url: authUrl });
});

// Exchange authorization code for tokens
app.get("/spotify-callback", async (req, res) => {
  const code = req.query.code;

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
        grant_type: "authorization_code",
        code,
        redirect_uri: SPOTIFY_REDIRECT_URI,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to exchange code for token: ${response.statusText}`);
    }

    const data = await response.json();
    spotifyAccessToken = data.access_token;
    spotifyRefreshToken = data.refresh_token;

    console.log("Spotify tokens acquired successfully.");
    res.status(200).json({ success: true, message: "Spotify tokens acquired." });
  } catch (error) {
    console.error("Error during Spotify callback:", error.message);
    res.status(500).json({ success: false, message: "Failed to handle Spotify callback." });
  }
});

// Refresh Spotify Token
app.get("/refresh-spotify-token", async (req, res) => {
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
        grant_type: "refresh_token",
        refresh_token: spotifyRefreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh Spotify token: ${response.statusText}`);
    }

    const data = await response.json();
    spotifyAccessToken = data.access_token;
    console.log("Spotify token refreshed successfully.");

    res.status(200).json({ success: true, accessToken: spotifyAccessToken });
  } catch (error) {
    console.error("Error refreshing Spotify token:", error);
    res.status(500).json({ success: false, message: "Failed to refresh Spotify token." });
  }
});

// Endpoint to get Spotify access token
app.get("/token", (req, res) => {
  if (spotifyAccessToken) {
    res.status(200).json({ success: true, accessToken: spotifyAccessToken });
  } else {
    res.status(401).json({ success: false, message: "No active Spotify token available." });
  }
});

// Fetch Spotify Songs
async function fetchSpotifySongs(genre) {
  try {
    if (!spotifyAccessToken) throw new Error("Spotify token not available.");

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
  const genre = req.query.genre || "soul";
  try {
    const songs = await fetchSpotifySongs(genre);
    res.status(200).json({ success: true, songs });
  } catch (error) {
    console.error("Error fetching songs:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch songs." });
  }
});

// Start Express Server
app.listen(5001, () => {
  console.log("Server is running on port 5001");
});
