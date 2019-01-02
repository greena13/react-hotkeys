import resolveShiftedAlias from '../helpers/resolving-handlers/resolveShiftedAlias';
import resolveUnshiftedAlias from '../helpers/resolving-handlers/resolveUnshiftedAlias';
import KeyAliasesDictionary from '../const/KeyAliasesDictionary';
import KeySequenceParser from './KeySequenceParser';

/**
 * Serializes instances of KeyCombinationRecord to KeyCombinationString
 * @class
 */
class KeyCombinationSerializer {
  /**
   * Returns a string representation of a single KeyCombinationRecord
   * @param {KeyCombinationRecord} keyCombination KeyCombinationRecord to serialize
   * @returns {string[]} Serialization of KeyCombinationRecord
   */
  static serialize(keyCombination) {
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

  /**
   * Whether the specified key sequence is valid (is of the correct format and contains
   * combinations consisting entirely of valid keys)
   * @param {KeySequenceString} keySequence Key sequence to validate
   * @returns {boolean} Whether the key sequence is valid
   */
  static isValidKeySerialization(keySequence) {
    if (keySequence.length > 0) {
      return !!KeySequenceParser.parse(keySequence, { ensureValidKeys: true }).combination;
    } else {
      return false;
    }
  }
}

export default KeyCombinationSerializer;
