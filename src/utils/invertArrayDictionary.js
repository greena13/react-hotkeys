import hasKey from './object/hasKey';

function invertArrayDictionary(dictionary, options = {}) {
  return Object.keys(dictionary).reduce((memo, key) => {
    const arrayValue = dictionary[key];

    arrayValue.forEach((shiftedKey) => {
      if (!hasKey(memo, shiftedKey)) {
        memo[shiftedKey] = [];
      }

      memo[shiftedKey].push(key)
    });

    if (options.includeOriginal) {
      if (!hasKey(memo, key)) {
        memo[key] = [];
      }

      memo[key] = [ ...memo[key], ...arrayValue ];
    }

    return memo;
  }, {});
}

export default invertArrayDictionary;
