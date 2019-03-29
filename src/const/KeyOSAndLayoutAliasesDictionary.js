/**
 * A dictionary of key aliases to make it easier to specify key maps that work
 * across different keyboard layouts and operating systems - this builds on top
 * of what React already does.
 */
import invertArrayDictionary from '../utils/invertArrayDictionary';

const KeyOSAndLayoutAliasesDictionary = {
};

export default invertArrayDictionary(KeyOSAndLayoutAliasesDictionary, { includeOriginal: true });
