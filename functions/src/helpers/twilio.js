const twilio = require("twilio");
const timeout = 5;
const beep = "https://firebasestorage.googleapis.com/v0/b/ballistic-mallard.appspot.com/o/beep.mp3?alt=media&token=ed17ff9f-c4bd-43a2-a7e6-b4b0ac052ff5";
const VoiceResponse = twilio.twiml.VoiceResponse;

module.exports = {
    twilio,
    timeout,
    beep,
    VoiceResponse
}