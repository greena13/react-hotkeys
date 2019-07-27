/**
 * Returns a normalized KeyCombinationString (with the key names in the combination
 * sorted in alphabetical order)
 * @param {Object.<ReactKeyName, Boolean>} keyDictionary Dictionary of key names
 * @returns {NormalizedKeyCombinationString} Normalized KeyCombinationString
 */
function normalizedCombinationId(keyDictionary) {
  return Object.keys(keyDictionary).sort((a, b) =>{
    if (a.length !== b.length) {
      return b.length - a.length;
    }

    if (a < b) {return -1;}
    if (a > b) {return 1;}
    return 0;
  }).join('+');
}

export default normalizedCombinationId;
