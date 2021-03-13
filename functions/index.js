// const baseURL = "https://us-central1-ballistic-mallard.cloudfunctions.net/webApi";
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const express = require("express");
const twilio = require("twilio");
const VoiceResponse = twilio.twiml.VoiceResponse;

// get the route controllers
const voice = require("./src/controllers/voice");

const timeout = 5;
const beep = "https://firebasestorage.googleapis.com/v0/b/ballistic-mallard.appspot.com/o/beep.mp3?alt=media&token=ed17ff9f-c4bd-43a2-a7e6-b4b0ac052ff5";

admin.initializeApp({
    credential: admin.credential.applicationDefault()
});

require("dotenv").config();

const main = express();
const debug = true;

const middleware = debug ? twilio.webhook({ validate: false }) : twilio.webhook();

main.use("/api/v1", express());
main.use(express.json());
main.use(express.urlencoded({ extended: false }));

main.post("/welcome", middleware, voice.welcome);
main.post("/getCallerInfo", middleware, voice.getCallerInfo);
main.post("/notify", middleware, voice.notify);
main.post("/promptForConnection", middleware, voice.promptForConnection);
main.post("/checkResponse", middleware, voice.checkResponse);
main.post("/complete", middleware, voice.complete);

exports.webApi = functions.https.onRequest(main);