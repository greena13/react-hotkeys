import SpecialKeysDictionary from '../const/SpecialKeysDictionary';

function isSpecialKey(key) {
  return !!SpecialKeysDictionary[key];
}

export default isSpecialKey;
