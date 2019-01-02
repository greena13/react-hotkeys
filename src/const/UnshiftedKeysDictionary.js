import hasKey from '../utils/object/hasKey';
import ShiftedKeysDictionary from './ShiftedKeysDictionary';

/**
 * A dictionary of symbols to the keys that produce them, when pressed with the shift
 * key
 */
const UnshiftedKeysDictionary = Object.keys(ShiftedKeysDictionary).reduce((memo, unshiftedKey) => {
  const shiftedKeys = ShiftedKeysDictionary[unshiftedKey];

  shiftedKeys.forEach((shiftedKey) => {
    if (!hasKey(memo, shiftedKey)) {
      memo[shiftedKey] = [];
    }

    memo[shiftedKey].push(unshiftedKey)
  });

  return memo;
}, {});

export default UnshiftedKeysDictionary;
