import MousetrapToReactKeyNamesDictionary from '../../const/MousetrapToReactKeyNamesDictionary';

/**
 * @typedef {String} KeyName Name of the keyboard key
 */

/**
 * @typedef {String} ReactKeyName Name used by React to refer to key
 */

/**
 * Returns the name for the specified key used by React. Supports translating key aliases
 * used by mousetrap to their counterparts in React
 * @param {KeyName} keyName Name of the key to resolve to the React equivalent
 * @returns {ReactKeyName} Name used by React to refer to the key
 */
function standardizeKeyName(keyName) {
  return MousetrapToReactKeyNamesDictionary[keyName.toLowerCase()] || (keyName.match(/^f\d+$/) ? keyName.toUpperCase() : keyName);
}

export default standardizeKeyName;
