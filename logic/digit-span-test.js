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
