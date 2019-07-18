/**
 * @callback DictionaryKeyAdaptor
 * Adapts values to be used as keys in a dictionary
 * @param {*} value to adapt
 * @returns {*} The adapted value to use as a dictionary key
 */

/**
 * Create a dictionary (map) from an array of values
 * @param {*[]} array Array of values
 * @param {*} value Value to use for each key in the dictionary
 * @param {Object} initValue Initial value of the dictionary to add the new entries to
 * @param {DictionaryKeyAdaptor} keyAdaptor Function to call on each element
 * @returns {Object.<*,*>} Dictionary created from array elements
 */
function dictionaryFrom(array, value = null, initValue = {}, keyAdaptor = nop) {
  return array.reduce((memo, element) => {
    memo[keyAdaptor(element)] = value || { value: element };

    return memo;
  }, initValue);
}

function nop(element) { return element; }

export default dictionaryFrom;
