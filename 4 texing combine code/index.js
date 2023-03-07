const startRecordingEl = document.querySelector("#start-recording");
const stopRecordingEl = document.querySelector("#stop-recording");
const resultEl = document.querySelector("#result");
const Transcribedata = document.querySelector("#Transcribe");
const scoreresult = document.querySelector("#score");
const misspelled_result = document.querySelector("#misspelled_result");
const complex_phrases = document.querySelector("#complex_phrases");
const audioContainer = document.querySelector('.audio-container');
const buttonContainer = document.querySelector('.button-container');
const toggleButton = document.querySelector('#toggle-button');


disableContainer(audioContainer);
enableContainer(buttonContainer);

function convertAudio() {
  resultEl.innerHTML = "Processing audio...";
  var input = document.getElementById('audio-file');
  var file = input.files[0];
  var formData = new FormData();
  formData.append('audio-file', file);
  fetch('http://127.0.0.1:5000/convert-audio', {
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    Transcribedata.innerHTML = "Transcribe";
    var resultDiv = document.getElementById('result');
    resultDiv.innerText = data.text;
    console.log("complex function")
    complex_function();
    console.log("spelling function")
    spellingcheck();
  }).catch(error => {
    resultEl.innerHTML = "Error while uploading the file. Please upload the correct file.";
    console.error(error);
  });

}

const recognition = new webkitSpeechRecognition();
recognition.continuous = true;
recognition.interimResults = false;
recognition.lang = 'en-US'

let transcript = '';
let wordcount = '';

startRecordingEl.addEventListener("click", function() {
  recognition.start();
  transcript = '';
  resultEl.innerHTML = "Recording...";
});

stopRecordingEl.addEventListener("click", function() {
  recognition.stop();
  resultEl.innerHTML = "Processing...";
  if (!transcript) {
    resultEl.innerHTML = "Your audio was not recorded.";
    return;
  }

  fetch("http://127.0.0.1:5000/check_pronunciation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript })
  })
    .then(response => response.json())
    .then(result => {
      if (result.success) {
        resultEl.innerHTML = "Response is the same";
      } else {
        Transcribedata.innerHTML = "Transcribe";
        resultEl.innerHTML = transcript;
        spellingcheck();
        complex_function();
  }
    })
    .catch(error => {
      console.error(error);
    });
});


recognition.onresult = function(event) {
  const newTranscription = event.results[event.results.length - 1][0].transcript;
  transcript += newTranscription;
  if (!transcript) {
    resultEl.innerHTML = "Not Recording";
  }
};


function complex_function(){
  fetch("http://127.0.0.1:5000/sentencescore")
  .then(response => response.json())
  .then(data => {
    console.log(data);
    let sentencescore = "";
    if (data.complex_phrases.length > 0) {
      const complex_phr = data.misspelled_words.join(", ");
      complex_phrase_result = "<br>complex phrases in Transcribe are: " + complex_phr;
    } else {
      complex_phrase_result = "<br>No complex phrases in Transcribe";
    }
    if (data.complex_words.length > 0) {
      const complex_wor = data.complex_words.join(", ");
      complex_word_result = "<br>complex Words in Transcribe are: " + complex_wor;
    } else {
      complex_word_result = "<br>No complex words in Transcribe";
    }
    scoreresult.innerHTML =  "Readability score for Transcribe: "+data.grade_level;
    complex_phrases.innerHTML = complex_word_result + complex_phrase_result;
    wordcount = data.wordcount;
    console.log("now you see the length")
    console.log(data.wordcount)
  })
  .catch(error => {
    console.error(error);
  });
}

function spellingcheck(){
  fetch("http://127.0.0.1:5000/get_spelling")
  .then(response => response.json())
  .then(data => {
    // Display misspelled_words
    console.log(data)
    let misspelledWordsResult = "";
    if (data.misspelled_words.length > 0) {
      const misspelledWords = data.misspelled_words.join(", ");
      misspelledWordsResult = "<br>Misspelled words in Transcribe are: " + misspelledWords;
    } else {
      misspelledWordsResult = "<br>No misspelled words present for above Transcribe";
    }
    
    // Display other results
    let otherResults = "";
    Object.keys(data).forEach(key => {
      if (key !== "misspelled_words") {
        const value = data[key];
        otherResults += "<br>" + key + ": " + value + "%";
      }
    });
    
    // Display both results
    misspelled_result.innerHTML = misspelledWordsResult +"<hr>"+"Percentage of parts of speech for "+ wordcount+" words in Transcribe"+
    "<br>" +otherResults;
    
  })
  .catch(error => {
    console.error(error);
  });
}
toggleButton.addEventListener('change', function() {
  if (this.checked) {
    disableContainer(buttonContainer);
    enableContainer(audioContainer);
    emptyall();
    document.querySelector('#audio-file').value = '';
  } else {
    disableContainer(audioContainer);
    enableContainer(buttonContainer);
    emptyall();
    document.querySelector('#audio-file').value = '';

  }
});

function disableContainer(container) {
  const inputs = container.querySelectorAll('input, button');
  inputs.forEach(input => {
    input.disabled = true;
  });
}

function enableContainer(container) {
  const inputs = container.querySelectorAll('input, button');
  inputs.forEach(input => {
    input.disabled = false;
  });
}
function emptyall(){
  misspelled_result.innerHTML = "";
  Transcribedata.innerHTML = "";
  scoreresult.innerHTML = "";
  complex_phrases.innerHTML  = "";
  resultEl.innerHTML = "";
  Transcribedata.innerHTML = "";
}

