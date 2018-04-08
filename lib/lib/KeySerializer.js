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

  static parseString(sequenceString, options = {}) {
    const trimmedSequenceString = stripSuperfluousWhitespace(sequenceString);

    const keyCombinationsArray = trimmedSequenceString.split(' ');

    const keyCombinationIDs = [];

    let score = 0;

    try {
      const sequence = keyCombinationsArray.reduce((memo, keyCombination) => {
        let keysInComboNum = 0;

        const comboIncludesShift = keyCombination.match(/shift/i);

        const keysInComboDict = keyCombination.split('+').reduce((keyDictionary, keyName) => {
          let finalKeyName = keyName.toLowerCase();

          finalKeyName = resolveKeyAlias(finalKeyName);

          if (comboIncludesShift) {
            finalKeyName = resolveShiftAlias(finalKeyName);
          }

          if (options.ensureValidKeys) {
            if (!isValidKey(finalKeyName)) {
              throw new InvalidKeyNameError();
            }
          }

          keyDictionary[finalKeyName] = true;

          keysInComboNum += 1;

          return keyDictionary;
        }, {});

        const normalizedComboString = Object.keys(keysInComboDict).sort().join('+');

        keyCombinationIDs.push(normalizedComboString);

        score += 10 + keysInComboNum;

        memo.push({
          id: normalizedComboString,
          size: keysInComboNum,
          keyDictionary: keysInComboDict,
          eventBitmapIndex: options.eventBitmapIndex
        });

        return memo;
      }, []);

      return { score, sequence, id: keyCombinationIDs.join(' ') }
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
