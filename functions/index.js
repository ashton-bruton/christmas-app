/* eslint-disable */
const functions = require("firebase-functions");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const cors = require("cors");
const express = require("express");
const fetch = require("node-fetch");
const app = express();
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
const CLIENT_SECRET =
  process.env.CLIENT_SECRET || functions.config().google.client_secret;
const REFRESH_TOKEN =
  process.env.REFRESH_TOKEN || functions.config().google.refresh_token;

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

// Middleware to parse JSON and handle CORS
app.use(express.json());
app.use(cors({ origin: "https://christmas-app-e9bf7.web.app" }));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(5001, () => {
  console.log("Server is running on port 5001");
});

// Firebase Function to send email
exports.sendCharacterEmail = functions.https.onRequest(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.set(
      "Access-Control-Allow-Origin",
      "https://christmas-app-e9bf7.web.app"
    );
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.status(204).send("");
    return;
  }

  res.set("Access-Control-Allow-Origin", "https://christmas-app-e9bf7.web.app");

  const { email, character, status, firstName } = req.body;

  if (!email || !character || !status || !firstName) {
    res
      .status(400)
      .json({ success: false, message: "Missing required fields." });
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
      from: "Naughty Or Nice Game <ashton.bruton@gmail.com>",
      to: email,
      subject: "Your Christmas Character",
      html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
                color: #333;
              }
              .email-wrapper {
                max-width: 600px;
                margin: 20px auto;
                background-color: #fff;
                border-radius: 10px;
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
                overflow: hidden;
              }
              .email-header {
                background: linear-gradient(135deg, #1cb495, #ff2361);
                color: #fff;
                padding: 20px;
                text-align: center;
              }
              .email-header h1 {
                margin: 0;
                font-size: 24px;
              }
              .email-header .icon {
                font-size: 50px;
                margin: 10px 0;
              }
              .email-body {
                padding: 20px;
              }
              .email-body h2 {
                margin: 0 0 10px;
                font-size: 20px;
                color: #ff2361;
              }
              .email-body p {
                font-size: 16px;
                line-height: 1.5;
                margin: 10px 0;
              }
              .email-body .character-card {
                display: flex;
                align-items: center;
                margin-top: 20px;
                background-color: #f9f9f9;
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 15px;
              }
              .character-card img {
                border-radius: 8px;
                width: 80px;
                height: 80px;
                object-fit: cover;
                margin-right: 15px;
              }
              .character-card .character-info {
                font-size: 16px;
              }
              .merch-section {
                background-color: #f9f9f9;
                padding: 20px;
                border-top: 1px solid #ddd;
                text-align: center;
              }
              .merch-section h3 {
                margin: 0 0 10px;
                font-size: 18px;
                color: #333;
              }
              .merch-section p {
                font-size: 14px;
                margin: 10px 0;
              }
              .merch-section a {
                color: #1cb495;
                text-decoration: none;
              }
              .merch-section a:hover {
                text-decoration: underline;
              }
              .email-footer {
                background-color: #f4f4f4;
                padding: 10px;
                text-align: center;
                font-size: 14px;
                color: #888;
              }
              .email-footer a {
                color: #1cb495;
                text-decoration: none;
              }
              .email-footer a:hover {
                text-decoration: underline;
              }
              .secretSanta-body {
                padding: 20px;
              }
            </style>
          </head>
          <body>
            <div class="email-wrapper">
              <div class="email-header">
                <div class="icon">🎅</div>
                <h1>Your Naughty or Nice Results Are In!</h1>
              </div>
              <div class="email-body">
                <h2>Congratulations!</h2>
                <p>Dear <strong>${firstName}</strong>,</p>
                <p>You’ve been assessed and placed on the <strong style="color: ${statusColor};">${status.toUpperCase()}</strong> list this year!</p>
                <p>Your character is:</p>
                <div class="character-card">
                  <img src="https://christmas-app-e9bf7.web.app/images/characters/${character
                    .toLowerCase()
                    .replace(/ /g, "_")}.jpg" alt="${character}">
                  <div class="character-info">
                    <strong>${character}</strong>
                    <p>A fitting companion for someone on the <strong style="color: ${statusColor};">${status.toUpperCase()}</strong> list!</p>
                  </div>
                </div>
                <p>We wish you a joyous holiday season filled with laughter, love, and maybe a bit of magic. 🎄✨</p>
              </div>
              ${secretSantaMessage}
              <div class="merch-section">
                <h3>Shop Merchandise for Your Character!</h3>
                <p>Explore apparel and more related to <strong>${character}</strong> on:</p>
                <p>
                    <a href="https://www.amazon.com" target="_blank">Amazon</a> |
                    <a href="https://www.redbubble.com" target="_blank">Redbubble</a> |
                    <a href="https://www.teepublic.com" target="_blank">TeePublic</a>
                </p>
              </div>
              <div class="email-footer">
                <p>Thank you for playing <strong>Naughty or Nice</strong>.</p>
                <p><a href="https://christmas-app-e9bf7.web.app">Visit our site in the future</a> for more fun holiday games!</p>
              </div>
            </div>
          </body>
          </html>
        `,
    };

    await transporter.sendMail(mailOptions);

    res
      .status(200)
      .json({ success: true, message: "Email sent successfully." });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});
