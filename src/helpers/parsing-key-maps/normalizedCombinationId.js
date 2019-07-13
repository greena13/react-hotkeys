/**
 * Returns a normalized KeyCombinationString (with the key names in the combination
 * sorted in alphabetical order)
 * @param {KeyName[]} keys List of key names to sort and reconstitute as a
 *        KeyCombinationString
 * @returns {NormalizedKeyCombinationString} Normalized KeyCombinationString
 */
function normalizedCombinationId(keys) {
  return keys.sort().join('+');
}

export default normalizedCombinationId;
