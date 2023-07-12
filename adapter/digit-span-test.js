// ui elements
const currentDigit = document.getElementById("current-digit");
const lengthDiv = document.getElementById("sequence-length");
const userInput = document.getElementById("primary-input");
const primaryButton = document.getElementById("primary-btn");
const repeatButton = document.getElementById("repeat-btn");
const infoDiv = document.getElementById("info-output");
const progress = document.getElementById("primary-progress-bar");
const speedInput = document.getElementById("speed-millis");
const startingLengthInput = document.getElementById("starting-length");
const audioEnabledCheckbox = document.getElementById("audio-enabled");
const visualEnabledCheckbox = document.getElementById("visual-enabled");
const testModeSelect = document.getElementById("test-mode");

// digit test object
let test = null;
let digitIndex = 0;
let speed = 1000; // milliseconds between digits
let defaultStartingLength = 4;
let lastLength = 0;
let audioEnabled = true;
let visualEnabled = true;
let testMode = DigitSpanTest.modes.DEFAULT;

let state = "loaded"; // possible states: ["loaded", "started", "success"]

const audio = {};

for (let i = 0; i < 10; i++) {
  audio[`${i}`] = new Audio(`../audio/${i}.mp3`);
}

function nextLength(startingLength) {
  state = "started";

  if (test === null) {
    test = new DigitSpanTest({ startingLength });
    infoDiv.classList.replace("alert-secondary", "alert-primary");
    infoDiv.innerHTML =
      "Test started. Type the digits in at the end of the sequence.";
  } else {
    test.next();
  }

  lastLength = test.getSequence().length;
  updateSequenceLength();
  setDisabled(userInput, true);
  setDisabled(primaryButton, true);
  setDisabled(repeatButton, true);
  primaryButton.innerHTML = "Next";
  digitIndex = 0;
  showNextDigit();
}

// called after the entire sequence was shown
function sequenceShown() {
  currentDigit.innerHTML = "...";
  digitIndex = 0;
  setDisabled(userInput, false);
  setDisabled(repeatButton, false);
  userInput.focus();
  progress.style.setProperty("width", "0");
}

function showNextDigit() {
  const digit = test.getSequence()[digitIndex];

  // The following if statement is a trick that makes the audio playback work on Chrome on Android.
  // Only after a user interaction (click) can sound be played. Therefore all required sound objects are being created, started and paused right away.
  // That way they can be used at later callbacks and playback is not blocked.
  if (digitIndex === 0 && audioEnabled) {
    for (let i = 0; i < test.getSequence().length; i++) {
      const loopDigit = test.getSequence()[i];
      if (typeof audio[loopDigit] !== "undefined") {
        audio[loopDigit].volume = 0;
        audio[loopDigit].play();
      }
    }
  }

  // show visual information, if enabled
  currentDigit.innerHTML = visualEnabled ? digit : " ";

  // play corresponding sound
  if (audioEnabled && typeof audio[digit] !== "undefined") {
    audio[digit].volume = 1;
    audio[digit].currentTime = 0;
    audio[digit].play();
  }

  digitIndex++;

  // update progress bar
  progress.style.setProperty(
    "width",
    `${(digitIndex / test.getSequence().length) * 100}%`
  );

  if (digitIndex >= test.getSequence().length) {
    setTimeout(sequenceShown, speed);
  } else {
    setTimeout(showNextDigit.bind(this), speed);
  }
}

function failed() {
  let addendum = ".";
  const currentSequence = test.getSequence();

  if (currentSequence.length !== startingLengthInput) {
    addendum = `, or, press "q" to try ${currentSequence.length} digits again.`;
  }

  infoDiv.classList.replace("alert-primary", "alert-secondary");
  infoDiv.innerHTML = `Not quite right. The sequence shown was ${currentSequence}, and you should have entered "${test.getTargetSequence(
    testMode
  )}". Press enter to start over${addendum}`;

  setDisabled(userInput, true);
  setDisabled(primaryButton, false);
  setDisabled(repeatButton, false);

  primaryButton.focus();
  state = "loaded";
  test = null;
  primaryButton.innerHTML = "Restart";
  setDisabled(repeatButton, false);
}

function checkUserInput(input) {
  const targetChar = test.getTargetSequence(testMode)[digitIndex];
  if (input === targetChar) {
    digitIndex++;

    // update progress bar
    progress.style.setProperty(
      "width",
      `${(digitIndex / test.getSequence().length) * 100}%`
    );
    if (digitIndex >= test.getSequence().length) {
      state = "success";
      setDisabled(primaryButton, false);
      setDisabled(repeatButton, false);
      primaryButton.focus();
      setDisabled(userInput, true);
    }
  } else {
    failed();
  }
}

// ui events
primaryButton.addEventListener("click", () => {
  switch (state) {
    case "loaded":
      nextLength(defaultStartingLength);
      break;
    case "success":
      nextLength(defaultStartingLength);
      break;
  }
});

repeatButton.addEventListener("click", () => {
  test = null;
  nextLength(lastLength);
});

userInput.addEventListener("keydown", (event) => {
  if (test === null) return;

  checkUserInput(event.key);
  clearInput();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "q") {
    repeatButton.click();
  }
});

testModeSelect.addEventListener("change", () => {
  const newModeInput = testModeSelect.value;
  const val2mode = {
    default: DigitSpanTest.modes.DEFAULT,
    reversed: DigitSpanTest.modes.REVERSED,
    ordered: DigitSpanTest.modes.ORDERED,
  };

  if (!newModeInput in val2mode) {
    throw new Error(`Invalid test mode selected '${newModeInput}`);
  }

  testMode = val2mode[newModeInput];
});

// settings
// audio enabled or disabled
audioEnabledCheckbox.addEventListener("change", () => {
  audioEnabled = audioEnabledCheckbox.checked;
});

visualEnabledCheckbox.addEventListener("change", () => {
  visualEnabled = visualEnabledCheckbox.checked;
});

// input speed, i.e. time between two digits in milliseconds
speedInput.addEventListener("change", () => {
  const newVal = parseInt(speedInput.value);

  if (newVal > 0) {
    speed = newVal;
  }
});

// sequence length after restart
startingLengthInput.addEventListener("change", () => {
  const newVal = parseInt(startingLengthInput.value);
  if (newVal > 0) {
    defaultStartingLength = newVal;
  }
});

setDisabled(primaryButton, false);

// helper functions

function setDisabled(element, disabled) {
  if (disabled) {
    return element.setAttribute("disabled", "disabled");
  }
  element.removeAttribute("disabled");
}

function updateSequenceLength() {
  if (test === null) {
    return (lengthDiv.innerHTML = " ");
  }
  lengthDiv.innerHTML = `Current challenge: ${
    test.getSequence().length
  } digits`;
}

function clearInput() {
  userInput.value = "";
}
