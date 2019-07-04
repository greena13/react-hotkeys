import KeyCombinationRecord from './KeyCombinationRecord';

/**
 * List of key combinations seen by hot key components
 * @class
 */
class KeyCombinationHistory {
  /**
   * Creates a new KeyCombinationHistory instance
   * @param {Number} maxLength Maximum length of the list.
   * @returns {KeyCombinationHistory}
   */
  constructor({ maxLength }) {
    this.records = [];

    this.maxLength = maxLength;
  }

  init(record = null) {
    if (record) {
      this.push(record);
    } else if (this.isEmpty()) {
      this.push(new KeyCombinationRecord())
    }
  }

  push(record) {
    if (this.getLength() > this.maxLength) {
      /**
       * We know the longest key sequence registered for the currently focused
       * components, so we don't need to keep a record of history longer than
       * that
       */
      this.shift();
    }

    this.records.push(record);
  }

  shift() {
    this.records.shift();
  }

  slice(start, end) {
    return this.records.slice(start, end);
  }

  any() {
    return !this.isEmpty();
  }

  isEmpty() {
    return this.getLength() === 0;
  }

  getLength() {
    return this.records.length;
  }

  getCurrentCombination() {
    return this.records[this.getLength() - 1];
  }

  toJSON() {
    return this.records.map((keyCombination) => keyCombination.toJSON() );
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

  setMaxLength(length) {
    this.maxLength = length;
  }

  /**
   * Adds a new KeyCombinationRecord to the event history and resets the includesKeyup
   * flag to false.
   * @param {ReactKeyName} keyName - Name of the keyboard key to add to the new
   *        KeyCombinationRecord
   * @param {KeyEventRecordState} keyEventState The state to set the key event to
   */
  startNewKeyCombination(keyName, keyEventState) {
    this._ensureInitialKeyCombination();

    const newCombinationRecord =
      new KeyCombinationRecord(this.getCurrentCombination().keysStillPressedDict());

    newCombinationRecord.addKey(keyName, keyEventState);

    this.push(newCombinationRecord);
  }

  _ensureInitialKeyCombination() {
    if (this.isEmpty()) {
      this.push(new KeyCombinationRecord())
    }
  }
}

export default KeyCombinationHistory;
