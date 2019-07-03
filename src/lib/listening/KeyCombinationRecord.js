import KeyEventSequenceIndex from '../../const/KeyEventSequenceIndex';
import KeyEventRecordIndex from '../../const/KeyEventRecordIndex';
import KeyCombinationSerializer from '../shared/KeyCombinationSerializer';
import resolveKeyAlias from '../../helpers/resolving-handlers/resolveKeyAlias';
import applicableAliasFunctions from '../../helpers/resolving-handlers/applicableAliasFunctions';
import KeyEventRecordManager from '../shared/KeyEventRecordManager';
import isEmpty from '../../utils/collection/isEmpty';
import Configuration from '../config/Configuration';
import size from '../../utils/collection/size';

class KeyCombinationRecord {
  constructor(keys = {}) {
    this._keys = keys;
    this._includesKeyup = false;
    this._update();
  }

  _update() {
    this._ids = KeyCombinationSerializer.serialize(this._keys);
    this._keyAliases = buildKeyAliases(this._keys);
  }

  getKeyStates() {
    return this._keys;
  }

  getIds() {
    return this._ids;
  }

  getKeyAliases() {
    return this._keyAliases;
  }

  getKeyState(keyName) {
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

  /**
   * Adds a key event to the current key combination (as opposed to starting a new
   * keyboard combination).
   * @param {ReactKeyName} keyName - Name of the key to add to the current combination
   * @param {KeyEventRecordIndex} recordIndex - Index in record to set to true
   * @param {KeyEventRecordState} keyEventState The state to set the key event to
   */
  setKeyState(keyName, recordIndex, keyEventState) {
    const existingRecord = this.getKeyState(keyName);

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

  _setKeyState(keyName, keyState) {
    const keyAlias = this.getNormalizedKeyName(keyName);

    this._keys[keyAlias] = keyState;

    this._update();
  }

  forEachKey(iterator){
    return Object.keys(this._keys).forEach(iterator);
  }

  isKeyReleased(keyName) {
    const keyState = this.getKeyState(keyName);
    return keyState && keyState[KeyEventSequenceIndex.current][KeyEventRecordIndex.keyup]
  }

  isKeyStillPressed(keyName) {
    return !this.isKeyReleased(keyName);
  }

  isKeyIncluded(keyName) {
    return !!this.getKeyState(keyName);
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
        memo[keyName] = this.getKeyState(keyName);
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
