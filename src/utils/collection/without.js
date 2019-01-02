import dictionaryFrom from '../object/dictionaryFrom';
import arrayFrom from '../array/arrayFrom';
import isObject from '../object/isObject';

function without(target, attributesToOmit = [], options = {}) {
  const omitDict = dictionaryFrom(arrayFrom(attributesToOmit));

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
