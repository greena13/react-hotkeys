import isSpecialKey from './isSpecialKey';

function isValidKey(keyName) {
  return isSpecialKey(keyName) || String.fromCharCode(keyName.charCodeAt(0)) === keyName;
}

export class InvalidKeyNameError extends Error {}

export default isValidKey;
