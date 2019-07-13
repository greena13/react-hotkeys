/**
 * Returns a normalized KeyCombinationString (with the key names in the combination
 * sorted in alphabetical order)
 * @param {Object.<ReactKeyName, Boolean>} keyDictionary Dictionary of key names
 * @returns {NormalizedKeyCombinationString} Normalized KeyCombinationString
 */
function normalizedCombinationId(keyDictionary) {
  return Object.keys(keyDictionary).sort().join('+');
}

export default normalizedCombinationId;
