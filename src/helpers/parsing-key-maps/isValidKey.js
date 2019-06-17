import isNonPrintableKeyName from './isNonPrintableKeyName';
import Configuration from '../../lib/Configuration';

function isValidKey(keyName) {
  return isNonPrintableKeyName(keyName) ||
    String.fromCharCode(keyName.charCodeAt(0)) === keyName ||
    Configuration.option('customKeyCodes')[keyName];
}

export class InvalidKeyNameError extends Error {
  name = 'InvalidKeyNameError'
}

export default isValidKey;
