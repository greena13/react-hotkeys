import arrayFrom from '../utils/array/arrayFrom';
import stripSuperfluousWhitespace from '../utils/string/stripSuperfluousWhitespace';
import standardizeKeyName from './standardizeKeyName';
import resolveShiftedAlias from './resolveShiftedAlias';
import isSpecialKey from './isSpecialKey';
import resolveUnshiftedAlias from './resolveUnshiftedAlias';
import KeyAliasesDictionary from '../const/KeyAliasesDictionary';

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
    });
  }

  /**
   * Returns a string representation of a single KeyCombinationRecord
   * @param {KeyCombinationRecord} keyCombination KeyCombinationRecord to serialize
   * @returns {string[]} Serialization of KeyCombinationRecord
   */
  static combination(keyCombination) {
    const combinationIncludesShift = keyCombination['Shift'];
    const keyCombinationIdDict = {};

    const sortedKeys = Object.keys(keyCombination).sort();

    sortedKeys.forEach((keyName) => {
      let keyAliases = [];

      if (combinationIncludesShift) {
        const unshiftedKeyNames = resolveUnshiftedAlias(keyName);
        const shiftedKeyNames = resolveShiftedAlias(keyName);

        keyAliases = [
          ...keyAliases,
          keyName,
          ...unshiftedKeyNames,
          ...shiftedKeyNames
        ];
      } else {
        keyAliases.push(keyName);

        const keyAlias = KeyAliasesDictionary[keyName];

        if (keyAlias) {
          keyAliases = [
            ...keyAliases,
            ...keyAlias,
          ];
        }
      }

      const keyCombinationIds = Object.keys(keyCombinationIdDict);

      if (keyCombinationIds.length > 0) {

        keyCombinationIds.forEach((keyCombinationId) => {

          keyAliases.forEach((keyAlias) => {
            keyCombinationIdDict[keyCombinationId + `+${keyAlias}`] = {
              ...keyCombinationIdDict[keyCombinationId],
              [keyAlias]: true
            };
          });

          delete keyCombinationIdDict[keyCombinationId];
        });

      } else {
        keyAliases.forEach((keyAlias) => {
          keyCombinationIdDict[keyAlias] = { [keyAlias]: true };
        });
      }
    });

    return Object.values(keyCombinationIdDict).map((keysInCombo) => {
      return Object.keys(keysInCombo).sort().join('+');
    });
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
      }).join(' ');

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
    return string.replace(/^\+|(?<= )\+|(?<=[^+]\+)\+/, 'plus').split('+').reduce((keyDictionary, keyName) => {
      let finalKeyName = standardizeKeyName(keyName);

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
