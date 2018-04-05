import arrayFrom from '../utils/array/arrayFrom';
import stripSuperfluousWhitespace from '../utils/string/stripSuperfluousWhitespace';
import resolveKeyAlias from './resolveKeyAlias';
import resolveShiftAlias from './resolveShiftAlias';
import isSpecialKey from './isSpecialKey';

class InvalidKeyNameError extends Error {}

function isValidKey(keyName) {
  return isSpecialKey(keyName) || String.fromCharCode(keyName.charCodeAt(0)) === keyName;
}

/**
 * Serializes KeyCombinationRecord to strings
 * @class
 */
class KeySerializer {
  /**
   * Returns a string representation of a list of KeyCombinationRecords
   * @param {KeyCombinationRecord[]} keySequence List of KeyCombinationRecords
   * @returns {string} Representation of a KeyCombinationRecords
   */
  static sequence(keySequence) {
    const _keySequence = arrayFrom(keySequence);

    return _keySequence.map((keyCombination) => {
      return this.combination(keyCombination);
    }).join(' ');
  }

  /**
   * Returns a string representation of a single KeyCombinationRecord
   * @param {KeyCombinationRecord} keyCombination KeyCombinationRecord to serialize
   * @returns {string} Serialization of KeyCombinationRecord
   */
  static combination(keyCombination) {
    return Object.keys(keyCombination).sort().join('+')
  }

  static parseString(keySequence, options = {}) {
    const trimmedSequence = stripSuperfluousWhitespace(keySequence);

    const _keySequence = trimmedSequence.split(' ');

    const keyCombinationIDs = [];

    try {
      const sequence = _keySequence.reduce((memo, keyCombination) => {

        let combinationSize = 0;
        const keyCombinationInvolvesShift = keyCombination.match(/shift/i);

        const keysInCombinationMap = keyCombination.split('+').reduce((memo, keyName) => {
          let _keyName = keyName.toLowerCase();

          _keyName = resolveKeyAlias(_keyName);

          if (keyCombinationInvolvesShift) {
            _keyName = resolveShiftAlias(_keyName);
          }

          if (options.ensureValidKeys) {
            if (!isValidKey(_keyName)) {
              throw new InvalidKeyNameError();
            }
          }

          memo[_keyName] = true;

          combinationSize += 1;
          return memo;
        }, {});

        const combinationID = Object.keys(keysInCombinationMap).sort().join('+');

        keyCombinationIDs.push(combinationID);

        memo.push({
          id: combinationID,
          size: combinationSize,
          keyDictionary: keysInCombinationMap,
        });

        return memo;
      }, []);

      return { sequence, id: keyCombinationIDs.join(' ') }
    } catch (InvalidKeyNameError) {
      return { sequence: null, id: null }
    }
  }

  static isValidKeySerialization(keySequence) {
    if (keySequence.length > 0) {
      return !!this.parseString(keySequence, { ensureValidKeys: true }).sequence;
    } else {
      return false;
    }
  }

}

export default KeySerializer;
