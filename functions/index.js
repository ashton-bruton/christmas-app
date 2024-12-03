/* eslint-disable */
const functions = require("firebase-functions");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const express = require('express');
const admin = require('firebase-admin');
admin.initializeApp();
require("dotenv").config();

// Gmail API Configuration
const CLIENT_ID = process.env.CLIENT_ID || functions.config().google.client_id;
const CLIENT_SECRET = process.env.CLIENT_SECRET || functions.config().google.client_secret;
const REDIRECT_URI = "https://christmas-app-e9bf7.web.app";
const REFRESH_TOKEN = process.env.REFRESH_TOKEN || functions.config().google.refresh_token;
const API_KEY = process.env.API_KEY || functions.config().google.api_key;

console.log("Client ID:", CLIENT_ID);

// Initialize Google OAuth2 Client
const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const app = express();

app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Export the Express app as a Firebase Function
exports.api = functions.https.onRequest(app);

// Cloud Function for Sending Emails
exports.sendCharacterEmail = functions.https.onCall(async (data, context) => {
  const { email, character, status } = data;

  try {
    // Generate Access Token
    const accessToken = await oAuth2Client.getAccessToken();

    // Nodemailer Transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: "ashton.bruton@gmail.com", // Sender's Gmail
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken.token,
      },
    });

    // Email Content
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

    // Send Email
    await transporter.sendMail(mailOptions);
    return { success: true, message: "Email sent successfully." };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, message: error.message };
  }
});
