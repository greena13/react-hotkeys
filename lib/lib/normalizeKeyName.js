/**
 * Lowercased string representing a particular keyboard key
 * @typedef {String} NormalizedKeyName
 */

/**
 * Returns normalized name of key
 * @param {KeyboardEvent.key} keyName Name of key
 * @returns {NormalizedKeyName} Normalized name of the key
 */
function normalizeKeyName(keyName) {
  return keyName.toLowerCase()
}

export default normalizeKeyName;
