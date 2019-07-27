import resolveShiftedAlias from '../../helpers/resolving-handlers/resolveShiftedAlias';
import resolveUnshiftedAlias from '../../helpers/resolving-handlers/resolveUnshiftedAlias';
import KeyOSAndLayoutAliasesDictionary from '../../const/KeyOSAndLayoutAliasesDictionary';
import KeySequenceParser from './KeySequenceParser';
import resolveUnaltedAlias from '../../helpers/resolving-handlers/resolveUnaltedAlias';
import resolveAltedAlias from '../../helpers/resolving-handlers/resolveAltedAlias';
import resolveUnaltShiftedAlias from '../../helpers/resolving-handlers/resolveUnaltShiftedAlias';
import resolveAltShiftedAlias from '../../helpers/resolving-handlers/resolveAltShiftedAlias';
import normalizedCombinationId from '../../helpers/parsing-key-maps/normalizedCombinationId';
import size from '../../utils/collection/size';
import distinct from '../../utils/array/distinct';

function buildShiftedKeyAliases(combinationIncludesAlt, keyName) {
  if (combinationIncludesAlt) {
    return [
      keyName,
      ...resolveUnaltShiftedAlias(keyName),
      ...resolveAltShiftedAlias(keyName)
    ];
  } else {
    return [
      keyName,
      ...resolveUnshiftedAlias(keyName),
      ...resolveShiftedAlias(keyName)
    ];
  }
}

function buildAltKeyAliases(keyName) {
  return [
    keyName,
    ...resolveUnaltedAlias(keyName),
    ...resolveAltedAlias(keyName)
  ];
}

function buildOSAndKeyboardLayoutAliases(keyName) {
  const osAndLayoutAliases = KeyOSAndLayoutAliasesDictionary[keyName];

  if (osAndLayoutAliases) {
    return [
      keyName,
      ...osAndLayoutAliases,
    ];
  }

  return [keyName];
}

function buildKeyAliasList(keyCombination, keyName) {
  const combinationIncludesShift = keyCombination['Shift'];
  const combinationIncludesAlt = keyCombination['Alt'];

  const aliases = (()=> {
    if (combinationIncludesShift) {
      return buildShiftedKeyAliases(combinationIncludesAlt, keyName);
    } else if (combinationIncludesAlt) {
      return buildAltKeyAliases(keyName);
    } else {
      return buildOSAndKeyboardLayoutAliases(keyName);
    }
  })();

  return distinct(aliases);
}

function buildKeyCombinationPermutations(keyCombination) {
  return Object.keys(keyCombination).reduce((allCombinations, keyName) => {
    const keyAliasList = buildKeyAliasList(keyCombination, keyName);

    if (size(allCombinations) === 0) {
      return keyAliasList.map((keyAlias) => { return { [keyAlias]: true } });
    }

    return keyAliasList.reduce((keyAliasCombinations, keyAlias) => {
      return keyAliasCombinations.concat(
        allCombinations.map((keyDictionary) => {return { ...keyDictionary, [keyAlias]: true };})
      );
    }, []);
  }, []);
}

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
    /**
     * List of key names in alphabetical order
     * @type {string[]}
     */
    const combinationDictionary =
      buildKeyCombinationPermutations(keyCombination);

    return combinationDictionary.map(normalizedCombinationId).sort();
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
