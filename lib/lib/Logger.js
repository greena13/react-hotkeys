

class Logger {
  static levels = {
    none: 0,
    error: 1,
    warn:  2,
    info: 3,
    debug: 4,
    verbose: 5
  };

  noop() {}

  verbose = this.noop;
  debug = this.noop;
  info = this.noop;
  warn = this.noop;
  error = this.noop;

  constructor(logLevel = 'warn') {
    this.logLevel = this.constructor.levels[logLevel];

    if (this.logLevel >= this.constructor.levels.error) {
      this.error = console.error;
    } else {
      return;
    }

    if (this.logLevel >= this.constructor.levels.warn) {
      this.warn = console.warn;
    } else {
      return;
    }

    ['info', 'debug', 'verbose'].some((logLevel) => {
      if (this.logLevel >= this.constructor.levels[logLevel]) {
        this[logLevel] = console.log;
        return false;
      }

      return true;
    });
  }
}

export default Logger;
