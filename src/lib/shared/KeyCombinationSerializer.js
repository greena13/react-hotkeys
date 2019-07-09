import resolveShiftedAlias from '../../helpers/resolving-handlers/resolveShiftedAlias';
import resolveUnshiftedAlias from '../../helpers/resolving-handlers/resolveUnshiftedAlias';
import KeyOSAndLayoutAliasesDictionary from '../../const/KeyOSAndLayoutAliasesDictionary';
import KeySequenceParser from './KeySequenceParser';
import resolveUnaltedAlias from '../../helpers/resolving-handlers/resolveUnaltedAlias';
import resolveAltedAlias from '../../helpers/resolving-handlers/resolveAltedAlias';
import resolveUnaltShiftedAlias from '../../helpers/resolving-handlers/resolveUnaltShiftedAlias';
import resolveAltShiftedAlias from '../../helpers/resolving-handlers/resolveAltShiftedAlias';

/**
 * Serializes instances of KeyCombination to KeyCombinationString.
 *
 * Used primarily to serialize string representations of key events as they happen.
 * @class
 */
class KeyCombinationSerializer {
  /**
   * Returns a string representation of a single KeyCombination
   * @param {KeyCombination} keyCombination KeyCombination to serialize
   * @returns {string[]} Serialization of KeyCombination
   */
  static serialize(keyCombination) {
    const combinationIncludesShift = keyCombination['Shift'];
    const combinationIncludesAlt = keyCombination['Alt'];
    const keyCombinationIdDict = {};

    /**
     * List of key names in alphabetical order
     * @type {string[]}
     */
    const sortedKeys = Object.keys(keyCombination).sort();

    sortedKeys.forEach((keyName) => {
      let keyAliases = [];

      if (combinationIncludesShift) {
        if (combinationIncludesAlt) {
          const unaltShiftedKeyNames = resolveUnaltShiftedAlias(keyName);
          const altShiftedKeyNames = resolveAltShiftedAlias(keyName);

          keyAliases = [
            ...keyAliases,
            keyName,
            ...unaltShiftedKeyNames,
            ...altShiftedKeyNames
          ];
        } else {
          const unshiftedKeyNames = resolveUnshiftedAlias(keyName);
          const shiftedKeyNames = resolveShiftedAlias(keyName);

          keyAliases = [
            ...keyAliases,
            keyName,
            ...unshiftedKeyNames,
            ...shiftedKeyNames
          ];
        }
      } else if (combinationIncludesAlt) {
        const unaltedKeyNames = resolveUnaltedAlias(keyName);
        const altedKeyNames = resolveAltedAlias(keyName);

        keyAliases = [
          ...keyAliases,
          keyName,
          ...unaltedKeyNames,
          ...altedKeyNames
        ];
      } else {
        keyAliases.push(keyName);

        const keyAlias = KeyOSAndLayoutAliasesDictionary[keyName];

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
