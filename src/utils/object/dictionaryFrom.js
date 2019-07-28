/**
 * @callback DictionaryKeyAdaptor
 * Adapts values to be used as keys in a dictionary
 * @param {*} value to adapt
 * @returns {*} The adapted value to use as a dictionary key
 */

import arrayFrom from '../array/arrayFrom';
import nop from '../function/nop';

/**
 * Create a dictionary (map) from an array of values
 * @param {*[]} array Array of values
 * @param {function|*} valueOrAdaptor Function to call on each element in the array to
 *        set the value in the dictionary, or a constant value that all keys in the
 *        dictionary should have
 * @param {DictionaryKeyAdaptor} keyAdaptor Function to call on each element
 * @param {Object} initValue Initial value of the dictionary to add the new entries to
 * @returns {Object.<*,*>} Dictionary created from array elements
 */
function dictionaryFrom(array, valueOrAdaptor = true, keyAdaptor = nop, initValue = {}) {
  const _valueAdaptor = (() => {
    if (typeof valueOrAdaptor === 'function') {
      return valueOrAdaptor;
    }

    return () => { return valueOrAdaptor };
  })();

  return arrayFrom(array).reduce((memo, element) => {
    memo[keyAdaptor(element)] = _valueAdaptor(element);

    return memo;
  }, initValue);
}

export default dictionaryFrom;
