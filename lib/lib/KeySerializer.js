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

    try {
      const nonTerminalCombinations = keyCombinationsArray.slice(0, keyCombinationsArray.length-1);
      const terminalCombination = keyCombinationsArray[keyCombinationsArray.length-1];

      const prefix = nonTerminalCombinations.map((keyCombination) => {
        const keysInComboDict = this.parseCombination(keyCombination, options);

        return this.normalizedCombinationId(Object.keys(keysInComboDict));
      });

      const keysInComboDict = this.parseCombination(terminalCombination, options);

      const normalizedComboString = this.normalizedCombinationId(Object.keys(keysInComboDict));

      const combination = {
        id: normalizedComboString,
        keyDictionary: keysInComboDict,
        eventBitmapIndex: options.eventBitmapIndex,
        size: Object.keys(keysInComboDict).length
      };

      return { sequence: { prefix, size: nonTerminalCombinations.length + 1 }, combination };
    } catch (InvalidKeyNameError) {
      return { sequence: null, combination: null }
    }
  }

  static normalizedCombinationId(keys) {
    return keys.sort().join('+');
  }

  static parseCombination(string, options = {}) {
    const comboIncludesShift = string.match(/shift/i);

    return string.split('+').reduce((keyDictionary, keyName) => {
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

      return keyDictionary;
    }, {});
  }

  static isValidKeySerialization(keySequence) {
    if (keySequence.length > 0) {
      return !!this.parseString(keySequence, { ensureValidKeys: true }).combination;
    } else {
      return false;
    }
  }

}

export default KeySerializer;
