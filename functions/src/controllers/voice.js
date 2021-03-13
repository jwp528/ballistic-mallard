const { twilio, timeout, VoiceResponse } = require("../helpers/twilio");
const firebase = require("firebase-functions");

const welcome = (request, response) => {
    const twiml = new VoiceResponse();

    twiml.say("Hello! You have reached the digital secretary for Josh Parsons. You are calling from an unrecognized number.");
    twiml.redirect("/webApi/getCallerInfo");

    response.type("text/xml");
    response.send(twiml.toString());
}

const getCallerInfo = (request, response) => {
    const twiml = new VoiceResponse();

    let attempt = request.query.attempt || 0;

    if (attempt == 3) {
        twiml.say("Sorry, we didn't get a valid response. Please try again later.");
        twiml.hangup();
        response.type("text/xml");
        response.send(twiml.toString());
    }

    const gather = twiml.gather({
        input: "speech",
        action: "/webApi/notify",
        method: "POST",
        timeout
    });

    gather.say("Please state your name and reason for calling.");

    // if gather doesn't detect anything. we need to loop this message
    // increment the attempt and send it in with the next call
    twiml.say("Sorry, I didn't catch that.");
    twiml.redirect(`/webApi/getCallerInfo?attempt=${++attempt}`);

    response.type("text/xml");
    response.send(twiml.toString());
}


const notify = (request, response) => {
    try {
        const twiml = new VoiceResponse();
        console.log(firebase.config());
        const accountSid = firebase.config().config.twilio_account_sid;
        const authToken = firebase.config().config.twilio_auth_token;
        const client = require("twilio")(accountSid, authToken);
        const params = request.body;
        client.messages
            .create({
                body: `
Hi Josh, Kim here. Incoming call alert.
Number: ${params.From}
Reason:
  ${params.SpeechResult}
          
Location Information: (${(parseFloat(params.Confidence) * 100.0).toFixed(0)}% Confidence)
Country: ${params.CallerCountry}
Prov/State: ${params.CallerState}
City: ${params.CallerCity}
Caller ZIP: ${params.CallerZip}
          `,
                from: "+12262109772",
                to: "+12262387448"
            })
            .done();

        twiml.say("Thank you. Please wait while I attempt to connect your call. This call will be recorded for records keeping purposes.")
        const dial = twiml.dial({
            record: "record-from-answer-dual",
            answerOnBridge: true,
            trim: "trim-silence",
            action: "/webApi/complete"
        });
        dial.number({
            url: "/webApi/promptForConnection",
        }, "+12262387448");

        response.type("text/xml");
        response.send(twiml.toString());
    } catch (ex) {
        response.send(ex.message);
    }
}

const promptForConnection = (request, response) => {
    const twiml = new VoiceResponse();
    const gather = twiml.gather({
        numDigits: 1,
        action: "/webApi/checkResponse",
        method: "POST",
        timeout
    });

    gather.say("Sir, if you would like to accept the call, press 1. to hang up, press literally fucking anything else.");

    response.type("text/xml");
    response.send(twiml.toString());
}

const checkResponse = (request, response) => {
    const twiml = new VoiceResponse();
    const answer = request.body.Digits;

    if (answer != 1) {
        twiml.say("Understood Sir. Have a nice day.");
        twiml.hangup();
    } else {
        twiml.say("Understood. Connecting your call now.");
    }

    response.type("text/xml");
    response.send(twiml.toString());
}

const complete = (request, response) => {
    const twiml = new VoiceResponse();
    const status = request.body.DialCallStatus;

    if (status === "no-answer") {
        twiml.say("I'm sorry. Mr. Parsons is unavailable at the moment. Please try your call again later. Have a nice day.");
    }

    twiml.hangup();

    response.type("text/xml");
    response.send(twiml.toString());
}

module.exports = {
    welcome,
    getCallerInfo,
    notify,
    promptForConnection,
    checkResponse,
    complete
}