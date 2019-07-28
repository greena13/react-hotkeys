import isObject from '../object/isObject';
import hasKey from '../object/hasKey';
import isString from '../string/isString';
import isUndefined from '../isUndefined';

function findableCollectionContains(collection, item, options) {
  if (options.stringifyFirst) {

    return !isUndefined(
      collection.find((collectionItem) => collectionItem.toString() === item.toString())
    );

  } else {
    return collection.indexOf(item) !== -1;
  }
}

function nonCollectionContains(collection, item, options) {
  if (options.stringifyFirst) {
    return collection.toString() === item.toString();
  } else {
    return collection === item;
  }
}

/**
 * Whether a collection contains an item
 * @param {Object|Array} collection The collection query
 * @param {*} item The item to establish membership for
 * @param {Object} options Configuration options
 * @param {boolean} options.stringifyFirst Whether to stringify the elements of the
 *        collection before performing the equality check
 * @returns {boolean} true if the item is in the collection
 */
function contains(collection, item, options = {}) {
  if (Array.isArray(collection) || isString(collection)) {
    return findableCollectionContains(collection, item, options);
  }

  if (isObject(collection)) {
    return hasKey(collection, item);
  }

  return nonCollectionContains(collection, item, options);
}

export default contains;
