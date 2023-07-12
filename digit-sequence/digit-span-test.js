const DEFAULTS = {
  startingLength: 4,
  symbols: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
};

class DigitSpanTest {
  constructor(props) {
    const options = {
      ...DEFAULTS,
      ...props,
    };

    // set current length to starting value
    this.length = options.startingLength;

    // set available digits that compose the sequences
    this.digits = options.symbols;

    this.sequence = [];

    // generate new sequence
    this.length--;
    this.next();
  }

  static modes = {
    DEFAULT: 0,
    REVERSED: 1,
    ORDERED: 2,
  };

  getSequence() {
    return [...this.sequence];
  }

  getTargetSequence(mode) {
    switch (mode) {
      case DigitSpanTest.modes.DEFAULT:
        return this.getSequence();
      case DigitSpanTest.modes.REVERSED:
        return this.getSequence().reverse();
      case DigitSpanTest.modes.ORDERED:
        return this.getSequence().sort();
      default:
        throw new Error(`Invalid mode '${mode}'.`);
    }
  }

  next() {
    this.length++;
    this.generateSequence();
  }

  // generates a new sequence using the available digits and returns it
  generateSequence() {
    this.sequence.splice(0, this.sequence.length);

    for (let i = 0; i < this.length; i++) {
      const index = Math.floor(Math.random() * this.digits.length);

      this.sequence.push(this.digits[index]);
    }
  }
}

// sound class from https://stackoverflow.com/questions/11330917/how-to-play-a-mp3-using-javascript
class Sound {
  constructor(source, volume, loop) {
    this.source = source;
    this.volume = volume;
    this.loop = loop;
    this.son = undefined;
    this.finish = false;
  }

  stop() {
    document.body.removeChild(this.son);
  }

  start() {
    if (this.finish) return false;
    this.son = document.createElement("embed");
    this.son.setAttribute("src", this.source);
    this.son.setAttribute("hidden", "true");
    this.son.setAttribute("volume", this.volume);
    this.son.setAttribute("autostart", "true");
    this.son.setAttribute("loop", this.loop);
    document.body.appendChild(this.son);
  }

  remove() {
    document.body.removeChild(this.son);
    this.finish = true;
  }

  init(volume, loop) {
    this.finish = false;
    this.volume = volume;
    this.loop = loop;
  }
}

// ui elements
const currentDigit = document.getElementById("current-digit");
const lengthDiv = document.getElementById("sequence-length");
const userInput = document.getElementById("primary-input");
const primaryButton = document.getElementById("start-button");
const repeatButton = document.getElementById("retry-button");
const infoDiv = document.getElementById("info-output");
const progress = document.getElementById("primary-progress-bar");
const speedInput = document.getElementById("speed-millis");
const startingLengthInput = document.getElementById("starting-length");
const audioEnabledCheckbox = document.getElementById("audio-enabled");
const visualEnabledCheckbox = document.getElementById("visual-enabled");
const testModeSelect = document.getElementById("test-mode");
const topScore = document.getElementById("top-digits");
const missed = document.getElementById("missed");

// digit test object
let test = null;
let digitIndex = 0;
let speed = 1000; // milliseconds between digits
let startingLength = startingLengthInput.value;
let currentLength = startingLength;
let audioEnabled = true;
let visualEnabled = true;
let testMode = DigitSpanTest.modes.DEFAULT;
let best = 0;
let misses = 0;

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

  currentLength = test.getSequence().length;
  lengthDiv.innerText = currentLength;
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
  const currentSequence = test.getSequence();
  let retry = "";

  misses++;

  if (currentLength > startingLengthInput.value) {
    retry = ` "+" or "-" to retry ${currentSequence.length} digits, or press`;

    currentLength = currentLength - 1;
    primaryButton.innerText = "Continue";
  } else {
    primaryButton.innerText = "Restart";
  }

  infoDiv.classList.replace("alert-primary", "alert-secondary");
  infoDiv.innerText = `The sequence was ${currentSequence.join(' ')}`;

  if (testMode !== 0) {
    infoDiv.innerText += `, you should have entered "${test.getTargetSequence(testMode)}"`
  }

  infoDiv.innerText += `. Press${retry} enter to continue with ${currentLength} digits.`
  missed.innerText = `${misses}`;

  setDisabled(userInput, true);
  setDisabled(primaryButton, false);
  setDisabled(repeatButton, false);

  primaryButton.focus();
  state = "loaded";
  test = null;
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
      updateSequenceLength()
    }
  } else {
    failed();
  }
}

// ui events
primaryButton.addEventListener("click", () => {
  switch (state) {
    case "loaded":
    case "success":
      nextLength(currentLength);
      break;
  }
});

repeatButton.addEventListener("click", () => {
  test = null;
  nextLength(currentLength++);
});

userInput.addEventListener("keydown", (event) => {
  if (test === null) return;

  checkUserInput(event.key);
  clearInput();
});

document.addEventListener("keydown", (event) => {
  console.log(event.key);

  const retryKeys = new Set(['+', '-', '*', '/', 'q'])

  if (retryKeys.has(event.key)) {
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
    startingLength = newVal;
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

function updateSequenceLength(completed = null) {
  if (test === null) {
    return (lengthDiv.innerText = "");
  }

  const current = test.getSequence().length;

  if (current > best) {
    best = current;
    topScore.innerText = `${best}`;
  }

  lengthDiv.innerText = current;
}

function clearInput() {
  userInput.value = "";
}

document.addEventListener('load', () => {
  startingLength = startingLengthInput.value;
  currentLength = startingLength;
})
