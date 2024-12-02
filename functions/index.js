const functions = require("firebase-functions");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");

// Gmail API Configuration
const CLIENT_ID = "897073151487-1h29qb4looigntofs4onufchr3dnj2a0.apps.googleusercontent.com";
const CLIENT_SECRET = "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";
const REDIRECT_URI = "https://christmas-app-e9bf7.web.app";
const REFRESH_TOKEN = "1//04Ant9intZV1MCgYIARAAGAQSNwF-L9Irj6HQUSkCrn9hvIkPl8jsbt7SMP76X4PxFXBes1jfKV8H_eQVDcsUCoyb-gUCMWSuBgw";

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

// Firebase Function
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
