import isNonPrintableKeyName from './isNonPrintableKeyName';
import isCustomKeyName from './isCustomKeyName';

function isValidKey(keyName) {
  return isNonPrintableKeyName(keyName) ||
    String.fromCharCode(keyName.charCodeAt(0)) === keyName ||
    isCustomKeyName(keyName)
}

export class InvalidKeyNameError extends Error {
  name = 'InvalidKeyNameError'
}

export default isValidKey;
