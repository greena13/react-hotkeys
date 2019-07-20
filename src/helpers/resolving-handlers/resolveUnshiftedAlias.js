import UnshiftedKeysDictionary from '../../const/reverse-dictionaries/UnshiftedKeysDictionary';
import fallbackToTransformedSelf from './fallbackToTransformedSelf';

/**
 * Returns the name of the key that must be pressed with the shift key, to yield the
 * specified symbol
 * @param {NormalizedKeyName} keyName Name of the key
 * @returns {ReactKeyName[]} Name of the key that must be pressed with the shift key, to
 *          yield the specified symbol
 */
function resolveUnshiftedAlias(keyName) {
  return fallbackToTransformedSelf(UnshiftedKeysDictionary, keyName, 'toLowerCase');
}

export default resolveUnshiftedAlias;
