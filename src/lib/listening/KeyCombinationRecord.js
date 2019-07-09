import KeyEventSequenceIndex from '../../const/KeyEventSequenceIndex';
import KeyEventRecordIndex from '../../const/KeyEventRecordIndex';
import KeyCombinationSerializer from '../shared/KeyCombinationSerializer';
import resolveKeyAlias from '../../helpers/resolving-handlers/resolveKeyAlias';
import applicableAliasFunctions from '../../helpers/resolving-handlers/applicableAliasFunctions';
import KeyEventRecordManager from '../shared/KeyEventRecordManager';
import isEmpty from '../../utils/collection/isEmpty';
import size from '../../utils/collection/size';
import KeyEventRecordState from '../../const/KeyEventRecordState';

/**
 * Record of one or more keys pressed together, in a combination
 * @class
 */
class KeyCombinationRecord {
  /**
   * Creates a new KeyCombinationRecord instance
   * @param {Object.<ReactKeyName, Array.<KeyEventRecordState[]>>} keys Dictionary
   *        of keys
   * @returns {KeyCombinationRecord}
   */
  constructor(keys = {}) {
    this._keys = keys;
    this._includesKeyup = false;
    this._update();
  }

  /**
   * The dictionary of keys pressed and their current event state
   * @returns {Object<ReactKeyName, Array<KeyEventRecordState[]>>}
   */
  getKeyStates() {
    return this._keys;
  }

  /**
   * List of ids (serialized representations) for the keys involved in the combination
   * @returns {KeySequence[]} List of combination ids
   */
  getIds() {
    return this._ids;
  }

  /**
   * Whether there are any keys in the combination
   * @returns {boolean} true if there is 1 or more keys involved in the combination,
   *          else false.
   */
  any() {
    return Object.keys(this.getKeyStates()).length > 0;
  }

  /**
   * Dictionary mapping keys to their acceptable aliases. This includes "shifted" or
   * "alted" key characters.
   * @returns {Object.<ReactKeyName, ReactKeyName[]>}
   */
  getKeyAliases() {
    return this._keyAliases;
  }

  /**
   * Adds a key event to the current key combination (as opposed to starting a new
   * keyboard combination).
   * @param {ReactKeyName} keyName - Name of the key to add to the current combination
   * @param {KeyEventRecordIndex} recordIndex - Index in record to set to true
   * @param {KeyEventRecordState} keyEventState The state to set the key event to
   */
  setKeyState(keyName, recordIndex, keyEventState) {
    const existingRecord = this._getKeyState(keyName);

    if (this.isKeyIncluded(keyName)) {
      const previous = KeyEventRecordManager.clone(existingRecord[1]);
      const current = KeyEventRecordManager.clone(previous);

      KeyEventRecordManager.setBit(current, recordIndex, keyEventState);

      this._setKeyState(keyName, [previous, current]);
    } else {
      this.addKey(keyName, keyEventState);
    }

    if (recordIndex === KeyEventRecordIndex.keyup) {
      this._includesKeyup = true;
    }
  }

  addKey(keyName, keyEventState) {
    this._setKeyState(keyName, [
      KeyEventRecordManager.newRecord(),
      KeyEventRecordManager.newRecord(KeyEventRecordIndex.keydown, keyEventState)
    ]);
  }

  forEachKey(iterator){
    return Object.keys(this._keys).forEach(iterator);
  }

  isKeyStillPressed(keyName) {
    const keyState = this._getKeyState(keyName);
    const currentState = keyState && keyState[KeyEventSequenceIndex.current];

    return currentState && currentState[KeyEventRecordIndex.keypress] && !this.isKeyReleased(keyName);
  }

  isKeyReleased(keyName) {
    const keyState = this._getKeyState(keyName);
    return keyState && keyState[KeyEventSequenceIndex.current][KeyEventRecordIndex.keyup]
  }

  isKeyIncluded(keyName) {
    return !!this._getKeyState(keyName);
  }

  isEnding() {
    return this._includesKeyup;
  }

  /**
   * Whether there are any keys in the current combination still being pressed
   * @returns {boolean} True if all keys in the current combination are released
   */
  hasEnded() {
    return isEmpty(this.keysStillPressedDict());
  }

  /**
   * Returns a new KeyCombinationRecord without the keys that have been
   * released (had the keyup event recorded). Essentially, the keys that are
   * currently still pressed down at the time a key event is being handled.
   * @returns {KeyCombinationRecord} New KeyCombinationRecord with all of the
   *        keys with keyup events omitted
   */
  keysStillPressedDict() {
    return Object.keys(this._keys).reduce((memo, keyName) => {
      if (this.isKeyStillPressed(keyName)) {
        memo[keyName] = this._getKeyState(keyName);
      }

      return memo;
    }, {});
  }

  getNormalizedKeyName(keyName) {
    const keyState = this._keys[keyName];

    if (keyState) {
      return keyName;
    } else {
      const keyAlias = this._keyAliases[keyName];

      if (keyAlias) {
        return keyAlias;
      } else {
        return keyName;
      }
    }
  }

  getNumberOfKeys() {
    return size(this._keys);
  }

  /********************************************************************************
   * Presentation
   *********************************************************************************/

  describe() {
    return this.getIds()[0];
  }

  toJSON() {
    return {
      keys: this.getKeyStates(),
      ids: this.getIds(),
      keyAliases: this.getKeyAliases()
    };
  }

  isKeyUpTriggered(keyName) {
    return this.isKeyEventTriggered(keyName, KeyEventRecordIndex.keyup);
  }

  isKeyDownTriggered(keyName) {
    return this.isKeyEventTriggered(keyName, KeyEventRecordIndex.keydown);
  }

  isKeyEventTriggered(keyName, eventRecordIndex){
    const keyState = this._getKeyState(keyName);

    return keyState && keyState[KeyEventSequenceIndex.current][eventRecordIndex];
  }

  isKeyCurrentlyTriggeringEvent(keyName, eventRecordIndex) {
    return this.isKeyEventTriggered(keyName, eventRecordIndex) &&
      !this.wasEventPreviouslyTriggered(keyName, eventRecordIndex);
  }

  wasEventPreviouslyTriggered(keyName, eventRecordIndex){
    const keyState = this._getKeyState(keyName);

    return keyState && keyState[KeyEventSequenceIndex.previous][eventRecordIndex];
  }

  isKeyPressSimulated(keyName) {
    return this._isKeyEventSimulated(keyName, KeyEventRecordIndex.keypress);
  }

  isKeyUpSimulated(keyName) {
    return this._isKeyEventSimulated(keyName, KeyEventRecordIndex.keyup);
  }

  /********************************************************************************
   * Private methods
   *********************************************************************************/

  _update() {
    this._ids = KeyCombinationSerializer.serialize(this._keys);
    this._keyAliases = buildKeyAliases(this._keys);
  }

  _isKeyEventSimulated(keyName, eventRecordIndex){
    return this.isKeyEventTriggered(keyName, eventRecordIndex) === KeyEventRecordState.simulated;
  }

  _getKeyState(keyName) {
    const keyState = this._keys[keyName];

    if (keyState) {
      return keyState;
    } else {
      const keyAlias = this._keyAliases[keyName];

      if (keyAlias) {
        return this._keys[keyAlias];
      }
    }
  }

  _setKeyState(keyName, keyState) {
    const keyAlias = this.getNormalizedKeyName(keyName);

    this._keys[keyAlias] = keyState;

    this._update();
  }
}

function buildKeyAliases(keyDictionary) {
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

export default KeyCombinationRecord;
