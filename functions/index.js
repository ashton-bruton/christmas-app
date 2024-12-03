/* eslint-disable */
const functions = require("firebase-functions");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const cors = require("cors");
const express = require("express");
const app = express();
const admin = require("firebase-admin");
admin.initializeApp();
require("dotenv").config();

const CLIENT_ID = process.env.CLIENT_ID || functions.config().google.client_id;
const CLIENT_SECRET = process.env.CLIENT_SECRET || functions.config().google.client_secret;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN || functions.config().google.refresh_token;

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, "https://developers.google.com/oauthplayground");
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
    res.set("Access-Control-Allow-Origin", "https://christmas-app-e9bf7.web.app");
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.status(204).send("");
    return;
  }

  res.set("Access-Control-Allow-Origin", "https://christmas-app-e9bf7.web.app");

  const { email, character, status } = req.body;

  if (!email || !character || !status) {
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

    const mailOptions = {
      from: "Naughty Or Nice Game <ashton.bruton@gmail.com>",
      to: email,
      subject: "Your Christmas Character",
      html: `
        <h1>Congratulations!</h1>
        <p>You are on the <strong>${status.toUpperCase()}</strong> list!</p>
        <p>Your character is: <strong>${character}</strong></p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ success: true, message: "Email sent successfully." });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});
