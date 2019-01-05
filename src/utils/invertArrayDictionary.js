import hasKey from './object/hasKey';

function invertArrayDictionary(dictionary) {
  return Object.keys(dictionary).reduce((memo, unshiftedKey) => {
    const arrayValue = dictionary[unshiftedKey];

    arrayValue.forEach((shiftedKey) => {
      if (!hasKey(memo, shiftedKey)) {
        memo[shiftedKey] = [];
      }

      memo[shiftedKey].push(unshiftedKey)
    });

    return memo;
  }, {});
}

export default invertArrayDictionary;
