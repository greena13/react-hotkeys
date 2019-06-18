import KeyEventSequenceIndex from '../const/KeyEventSequenceIndex';
import KeyEventRecordIndex from '../const/KeyEventRecordIndex';
import KeyCombinationSerializer from './KeyCombinationSerializer';
import resolveKeyAlias from '../helpers/resolving-handlers/resolveKeyAlias';
import applicableAliasFunctions from '../helpers/resolving-handlers/applicableAliasFunctions';
import KeyEventRecordManager from './KeyEventRecordManager';
import keyIsCurrentlyTriggeringEvent from '../helpers/parsing-key-maps/keyIsCurrentlyTriggeringEvent';
import isMatchPossibleBasedOnNumberOfKeys from '../helpers/resolving-handlers/isMatchPossibleBasedOnNumberOfKeys';

class KeyCombinationHistory {
  static newFrom(otherHistory) {
    const currentKeyCombination = otherHistory.getCurrentCombination();

    const keysStillPressed =
      Object.keys(currentKeyCombination.keys).reduce((memo, keyName) => {
        const keyState = currentKeyCombination.keys[keyName];
        const currentKeyState = keyState[KeyEventSequenceIndex.current];

        if (currentKeyState[KeyEventRecordIndex.keydown] && !currentKeyState[KeyEventRecordIndex.keyup]) {
          memo[keyName] = keyState;
        }

        return memo;
      }, {});

    const newHistory = new KeyCombinationHistory({
      maxLength: currentKeyCombination.maxLength
    });

    newHistory.push(
      {
        keys: keysStillPressed,
        ids: KeyCombinationSerializer.serialize(keysStillPressed),
        keyAliases: this._buildCombinationKeyAliases(keysStillPressed)
      }
    );

    return newHistory;
  }

  constructor({ maxLength }) {
    /**
     * Whether the current key combination includes at least one keyup event - indicating
     * that the current combination is ending (and keys are being released)
     */
    this.includesKeyup = false;

    this.records = [];

    this.maxLength = maxLength;
  }

  init() {
    if (this.isEmpty()) {
      this.push(emptyKeyCombination())
    }
  }

  push(record) {
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
    return this.length() === 0;
  }

  length() {
    return this.records.length;
  }

  getCurrentCombination() {
    if (this.any()) {
      return this.records[this.length() - 1];
    } else {
      return emptyKeyCombination();
    }
  }

  setKeyState(keyName, keyState) {
    const keyAlias = this.getCurrentCombinationKeyAlias(keyName);
    const keyCombination = this.getCurrentCombination();

    keyCombination.keys[keyAlias] = keyState;

    keyCombination.ids = KeyCombinationSerializer.serialize(keyCombination.keys);

    keyCombination.keyAliases = this.constructor._buildCombinationKeyAliases(keyCombination.keys);
  }

  currentCombinationIncludesKey(keyName) {
    return !!this.getCurrentCombinationKeyState(keyName);
  }

  toJSON() {
    return this.records;
  }

  getCurrentCombinationKeyAlias(keyName) {
    const keyCombination = this.getCurrentCombination();
    const keyState = keyCombination.keys[keyName];

    if (keyState) {
      return keyName;
    } else {
      const keyAlias = keyCombination.keyAliases[keyName];

      if (keyAlias) {
        return keyAlias;
      } else {
        return keyName;
      }
    }
  }

  getCurrentCombinationKeyState(keyName) {
    const keyCombination = this.getCurrentCombination();
    const keyState = keyCombination.keys[keyName];

    if (keyState) {
      return keyState;
    } else {
      const keyAlias = keyCombination.keyAliases[keyName];

      if (keyAlias) {
        return keyCombination.keys[keyAlias];
      }
    }
  }

  /**
   * Adds a key event to the current key combination (as opposed to starting a new
   * keyboard combination).
   * @param {ReactKeyName} keyName - Name of the key to add to the current combination
   * @param {KeyEventRecordIndex} recordIndex - Index in record to set to true
   * @param {KeyEventRecordState} keyEventState The state to set the key event to
   */
  addKeyToCurrentCombination(keyName, recordIndex, keyEventState) {
    this.init();

    const existingRecord = this.getCurrentCombinationKeyState(keyName);

    if (this.currentCombinationIncludesKey(keyName)) {
      const previous = KeyEventRecordManager.clone(existingRecord[1]);
      const current = KeyEventRecordManager.clone(previous);

      KeyEventRecordManager.setBit(current, recordIndex, keyEventState);

      this.setKeyState(keyName, [previous, current]);
    } else {
      this.setKeyState(keyName, [
        KeyEventRecordManager.newRecord(),
        KeyEventRecordManager.newRecord(recordIndex, keyEventState)
      ]);
    }

    if (recordIndex === KeyEventRecordIndex.keyup) {
      this.includesKeyup = true;
    }
  }

  updateMaxLength(length) {
    this.maxLength = length;
  }

  /**
   * Adds a new KeyCombinationRecord to the event history and resets the includesKeyup
   * flag to false.
   * @param {ReactKeyName} keyName - Name of the keyboard key to add to the new
   *        KeyCombinationRecord
   * @param {KeyEventRecordIndex} eventRecordIndex - Index of bit to set to true in new
   *        KeyEventRecord
   * @param {KeyEventRecordState} keyEventState The state to set the key event to
   */
  startNewKeyCombination(keyName, eventRecordIndex, keyEventState) {
    if (this.length() > this.maxLength) {
      /**
       * We know the longest key sequence registered for the currently focused
       * components, so we don't need to keep a record of history longer than
       * that
       */
      this.shift();
    }

    const keys = {
      ...this.keysStillDown(),
      [keyName]: [
        KeyEventRecordManager.newRecord(),
        KeyEventRecordManager.newRecord(eventRecordIndex, keyEventState)
      ]
    };

    this.push({
      keys,
      ids: KeyCombinationSerializer.serialize(keys),
      keyAliases: this.constructor._buildCombinationKeyAliases(keys)
    });

    this.includesKeyup = false;
  }

  static _buildCombinationKeyAliases(keyDictionary) {
    return Object.keys(keyDictionary).reduce((memo, keyName) => {
      resolveKeyAlias(keyName).forEach((normalizedKey) => {
        applicableAliasFunctions(keyDictionary).forEach((aliasFunction) => {
          aliasFunction(normalizedKey).forEach((keyAlias) => {
            if (keyAlias !== keyName || keyName !== normalizedKey) {
              memo[keyAlias] = keyName;
            }
          });
        })
      });

      return memo;
    }, {});
  }

  /**
   * Returns a new KeyCombinationRecord without the keys that have been
   * released (had the keyup event recorded). Essentially, the keys that are
   * currently still pressed down at the time a key event is being handled.
   * @returns {KeyCombinationRecord} New KeyCombinationRecord with all of the
   *        keys with keyup events omitted
   * @private
   */
  keysStillDown() {
    const keyCombination = this.getCurrentCombination();

    return Object.keys(keyCombination.keys).reduce((memo, keyName) => {
      const keyState = keyCombination.keys[keyName];

      if (!keyState[KeyEventSequenceIndex.current][KeyEventRecordIndex.keyup]) {
        memo[keyName] = keyState;
      }

      return memo;
    }, {});
  }

  /**
   * Whether there are any keys in the current combination still being pressed
   * @return {Boolean} True if all keys in the current combination are released
   */
  allKeysAreReleased() {
    return Object.keys(this.getCurrentCombination().keys).every((keyName) => {
      return !this._keyIsCurrentlyDown(keyName);
    });
  }

  _keyIsCurrentlyDown(keyName) {
    const keyState = this.getCurrentCombinationKeyState(keyName);

    const keyIsDown = keyIsCurrentlyTriggeringEvent(keyState, KeyEventRecordIndex.keypress) &&
      !keyIsCurrentlyTriggeringEvent(keyState, KeyEventRecordIndex.keyup);

    return !!keyIsDown;
  }

  canBeMatchedBasedOnNumberOfKeys(combinationMatcher) {
    return isMatchPossibleBasedOnNumberOfKeys(this.getCurrentCombination(), combinationMatcher)
  }

  describeCurrentKeyCombination() {
    return this.getCurrentCombination().ids[0];
  }

  forEachCurrentKey(iterator) {
    Object.keys(this.getCurrentCombination().keys).forEach(iterator);
  }
}

/**
 * Returns a new, empty key combination
 * @returns {KeyCombinationRecord} A new, empty key combination
 */
function emptyKeyCombination() {
  return {
    keys: {},
    ids: [ '' ],
    keyAliases: {}
  };
}

export default KeyCombinationHistory;
