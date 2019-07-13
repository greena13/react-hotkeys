import MousetrapToReactKeyNamesDictionary from '../../const/MousetrapToReactKeyNamesDictionary';
import KeyShorthandDictionary from '../../const/KeyShorthandDictionary';
import resolveUnaltShiftedAlias from '../resolving-handlers/resolveUnaltShiftedAlias';
import resolveUnshiftedAlias from '../resolving-handlers/resolveUnshiftedAlias';

/**
 * @typedef {string} KeyName Name of the keyboard key
 */

/**
 * @typedef {string} ReactKeyName Name used by React to refer to key
 */

/**
 * Returns the name for the specified key used by React. Supports translating key aliases
 * used by mousetrap to their counterparts in React
 * @param {KeyName} keyName Name of the key to resolve to the React equivalent
 * @param {Object} modifierKeys Options of which modifier keys are also pressed
 * @returns {ReactKeyName} Name used by React to refer to the key
 */
function standardizeKeyName(keyName, modifierKeys = { shift: false, alt: false}) {
  const _keyName = keyName.toLowerCase();

  const keyAfterAliases = MousetrapToReactKeyNamesDictionary[_keyName] || KeyShorthandDictionary[_keyName] || (keyName.match(/^f\d+$/) ? keyName.toUpperCase() : keyName);

  if (modifierKeys.shift) {
    if (modifierKeys.alt) {
      return resolveUnaltShiftedAlias(keyAfterAliases);
    } else {
      return resolveUnshiftedAlias(keyAfterAliases)
    }
  }

  return keyAfterAliases;
}

export default standardizeKeyName;
