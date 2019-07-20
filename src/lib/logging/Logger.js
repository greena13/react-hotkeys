/**
 * Encapsulates all logging behaviour and provides the ability to specify the level
 * of logging desired.
 * @class
 */
class Logger {
  /**
   * Icons prefixed to the start of logging statements that cycled through each
   * time a focus tree changes, making it easier to quickly spot events related
   * to the same focus tree.
   */
  static logIcons = ['📕', '📗', '📘', '📙'];

  /**
   * Icons prefixed to the start of logging statements that cycled through each
   * time a component ID changes, making it easier to quickly spot events related
   * to the same component.
   */
  static componentIcons = ['🔺', '⭐️', '🔷', '🔶', '⬛️'];

  /**
   * Icons prefixed to the start of logging statements that cycled through each
   * time an event ID changes, making it easier to quickly trace the path of KeyEvent
   * objects as they propagate through multiple components.
   */
  static eventIcons = ['❤️', '💚', '💙', '💛', '💜', '🧡'];

  /**
   * The level of logging to perform
   * @typedef {'none'|'error'|'warn'|'info'|'debug'|'verbose'} LogLevel
   */

  /**
   * Levels of log severity - the higher the log level, the greater the amount (and
   * lesser the importance) of information logged to the console about React HotKey's
   * behaviour
   * @enum {number} LogLevel
   */
  static levels = {
    none: 0,
    error: 1,
    warn:  2,
    info: 3,
    debug: 4,
    verbose: 5
  };

  noop() {}

  /**
   * By default, calls to all log severities are a no-operation. It's only when the
   * user specifies a log level, are they replaced with logging statements
   * @type {Logger.noop}
   */
  verbose = this.noop;
  debug = this.noop;
  info = this.noop;
  warn = this.noop;
  error = this.noop;

  constructor(logLevel = 'warn') {
    this.logLevel = this.constructor.levels[logLevel];

    for (const level of ['error', 'warn', 'info', 'debug', 'verbose']) {
      if (this.logLevel < this.constructor.levels[level]) {
        return;
      }

      this[level] = ['debug', 'verbose'].indexOf(level) === -1 ? console[level] : console.log;
    }
  }
}

export default Logger;
