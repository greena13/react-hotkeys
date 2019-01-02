import hasKey from '../utils/object/hasKey';

const ShiftedKeysDictionary = {
  '`': [ '~' ],
  '1': [ '!' ],
  '2': [ '@', /** UK Keyboard: **/ '"' ],
  '3': [ '#', /** UK Keyboard: **/ '£' ],
  '4': [ '$' ],
  '5': [ '%' ],
  '6': [ '^' ],
  '7': [ '&' ],
  '8': [ '*' ],
  '9': [ '(' ],
  '0': [ ')' ],
  '-': [ '_' ],
  '=': [ 'plus' ],
  ';': [ ':' ],
  "'": [ '"', /** UK Keyboard: **/ '@' ],
  ',': [ '<' ],
  '.': [ '>' ],
  '/': [ '?' ],
  '\\':[  '|' ],
  '[': [ '{' ],
  ']': [ '}' ],

  /**
   * UK Keyboard:
   */
  '#': [ '~' ],
};

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
