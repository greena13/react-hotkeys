import dictionaryFrom from '../object/dictionaryFrom';
import arrayFrom from '../array/arrayFrom';
import isObject from '../object/isObject';

/**
 * Return a new collection, with the same elements as another, with the specified
 * exceptions
 * @param {Object|Array} target The collection to duplicate
 * @param {*} exclusions The attributes to omit when the collection is an object, or
 *        the elements to exclude if the collection is an array
 * @param {Object} options Configuration options
 * @param {boolean} options.stringifyFirst Whether to stringify the elements of the
 *        arrays before comparing them to the exclusion list
 * @returns {Object|Array} Copied collection without the specified elements
 */
function without(target, exclusions = [], options = {}) {
  const omitDict = dictionaryFrom(arrayFrom(exclusions));

  if (Array.isArray(target)) {
    return target.reduce((memo, element) => {
      if (!(omitDict[element] && (options.stringifyFirst || omitDict[element].value === element))) {
        memo.push(element);
      }

      return memo;
    }, []);

  } else if (isObject(target)) {
    return Object.keys(target).reduce((memo, key) => {
      if (!omitDict[key]) {
        memo[key] = target[key];
      }

      return memo;
    }, {});

  } else {
    return target;
  }
}

export default without;
