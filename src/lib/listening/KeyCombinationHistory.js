import KeyCombinationRecord from './KeyCombinationRecord';

/**
 * List of key combinations seen by hot key components
 * @class
 */
class KeyCombinationHistory {
  /**
   * Creates a new KeyCombinationHistory instance
   * @param {Number} maxLength Maximum length of the list.
   * @param {KeyCombinationRecord} startingPoint Initial state of first combination
   * @returns {KeyCombinationHistory}
   */
  constructor({ maxLength }, startingPoint = null) {
    this._records = [];

    this._maxLength = maxLength;

    if (startingPoint) {
      this._push(startingPoint);
    } else {
      this._push(new KeyCombinationRecord());
    }
  }

  /**
   * A subset of the most recently press key combinations
   * @param {Number} numberOfCombinations The number of most recent key combinations
   * @returns {KeyCombinationRecord[]} List of key combinations
   */
  getMostRecentCombinations(numberOfCombinations) {
    return this._records.slice(-numberOfCombinations, -1);
  }

  /**
   * Whether any keys have been stored in the key history
   * @returns {boolean} true if there is at least one key combination, else false
   */
  any() {
    return this._records.some((keyCombination) => keyCombination.any());
  }

  /**
   * The number of key combinations in the history (limited by the max length)
   * @returns {number} Number of key combinations
   */
  getLength() {
    return this._records.length;
  }

  /**
   * Most recent or current key combination
   * @returns {KeyCombinationRecord} Key combination record
   */
  getCurrentCombination() {
    return this._records[this.getLength() - 1];
  }

  /**
   * Adds a key event to the current key combination (as opposed to starting a new
   * keyboard combination).
   * @param {ReactKeyName} keyName - Name of the key to add to the current combination
   * @param {KeyEventRecordIndex} recordIndex - Index in record to set to true
   * @param {KeyEventRecordState} keyEventState The state to set the key event to
   */
  addKeyToCurrentCombination(keyName, recordIndex, keyEventState) {
    this._ensureInitialKeyCombination();

    this.getCurrentCombination().setKeyState(keyName, recordIndex, keyEventState);
  }

  /**
   * Sets a new maximum length for the key combination history. Once the number of
   * key combinations exceeds this length, the oldest is dropped.
   * @param {Number} length New maximum length of the key history
   */
  setMaxLength(length) {
    this._maxLength = length;
    this._trimHistory();
  }

  /**
   * Adds a new KeyCombinationRecord to the event history.
   * @param {ReactKeyName} keyName - Name of the keyboard key to add to the new
   *        KeyCombinationRecord
   * @param {KeyEventRecordState} keyEventState The state to set the key event to
   */
  startNewKeyCombination(keyName, keyEventState) {
    this._ensureInitialKeyCombination();

    const newCombinationRecord =
      new KeyCombinationRecord(this.getCurrentCombination().keysStillPressedDict());

    newCombinationRecord.addKey(keyName, keyEventState);

    this._push(newCombinationRecord);
  }

  /**
   * A plain JavaScript representation of the key combination history, useful for
   * serialization or debugging
   * @returns {Object[]} Serialized representation of the registry
   */
  toJSON() {
    return this._records.map((keyCombination) => keyCombination.toJSON() );
  }

  /********************************************************************************
   * Private methods
   ********************************************************************************/

  _ensureInitialKeyCombination() {
    if (this.getLength() === 0) {
      this._push(new KeyCombinationRecord())
    }
  }

  _push(record) {
    this._trimHistory();

    this._records.push(record);
  }

  _trimHistory() {
    while (this.getLength() > this._maxLength) {
      /**
       * We know the longest key sequence registered for the currently focused
       * components, so we don't need to keep a record of history longer than
       * that
       */
      this._shift();
    }
  }

  _shift() {
    this._records.shift();
  }
}

export default KeyCombinationHistory;
