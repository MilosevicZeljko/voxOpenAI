require(Modules.Player);
require(Modules.ASR);
let call, asr;
const baseURL = 'https://voxopenai.onrender.com/ask';

// Inbound call arrives
VoxEngine.addEventListener(AppEvents.CallAlerting, function (e) {
  call = e.call;
  call.addEventListener(CallEvents.Connected, handleCallConnected);
  call.addEventListener(CallEvents.Disconnected, VoxEngine.terminate);
  call.answer();
});

// Play intro after the call connected
function handleCallConnected(e) {
  setTimeout(function (e) {
    call.say(
      'Hi! Im here to take your reservation, please, state day and time for your reservation',
      Language.US_ENGLISH_FEMALE
    );
    call.addEventListener(CallEvents.PlaybackFinished, handleIntroPlayed);
  }, 500);
}

// Setup and enable real-time speech recognition
function handleIntroPlayed(e) {
  call.removeEventListener(CallEvents.PlaybackFinished);
  // Freeform recognition, language - US English
  asr = VoxEngine.createASR({
    lang: ASRLanguage.ENGLISH_US,
  });

  // Add events handlers
  asr.addEventListener(ASREvents.Result, handleResult);
  asr.addEventListener(ASREvents.CaptureStarted, function (asrevent) {
    call.stopPlayback();
  });
  // Send call audio to recognition engine
  call.sendMediaTo(asr);
}

// Handle recognition result
function handleResult(e) {
  asr.stop();
  Logger.write('RESULT: ' + e.text);
  Logger.write('CONFIDENCE: ' + e.confidence);
  // Send question to node backend
  const opts = {
    headers: ['Content-Type: application/json'],
    method: 'POST',
    postData: JSON.stringify({ message: e.text }),
  };
  // Net.httpRequest(baseURL, handleHttp, opts);
  Net.httpRequest(baseURL, handleHttp, opts);
}

function handleHttp(e) {
  Logger.write(e.code);
  Logger.write(JSON.stringify(e.text));

  if (e.code == 200) {
    const res = JSON.parse(e.text);
    call.say(res.text, Language.US_ENGLISH_FEMALE);
    call.say('Thanks for making reservation!', Language.US_ENGLISH_FEMALE);
    call.terminate();
  } else {
    // HTTP error - play Oops message
    playOops();
  }
}

function playOops() {
  call.say(
    "Oops! Sorry, I couldn't handle the request, please try again",
    Language.US_ENGLISH_FEMALE
  );
  call.addEventListener(CallEvents.PlaybackFinished, function (e) {
    call.removeEventListener(CallEvents.PlaybackFinished);
    handleIntroPlayed();
  });
}
