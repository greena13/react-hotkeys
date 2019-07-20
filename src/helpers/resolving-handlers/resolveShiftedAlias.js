import ShiftedKeysDictionary from '../../const/ShiftedKeysDictionary';
import fallbackToTransformedSelf from './fallbackToTransformedSelf';

/**
 * Returns the corresponding symbol or character for a particular key, when it is
 * pressed with the shift key also held down
 * @param {NormalizedKeyName} keyName Name of the key
 * @returns {ReactKeyName[]} Symbol or character for the key, when it is pressed with the
 *          shift key
 */
function resolveShiftedAlias(keyName) {
  return fallbackToTransformedSelf(ShiftedKeysDictionary, keyName, 'toUpperCase');
}

export default resolveShiftedAlias;
