import KeyAliasesDictionary from '../../const/KeyAliasesDictionary';

/**
 * Returns a list of accepted aliases for the specified key
 * @param {NormalizedKeyName} keyName Name of the key
 * @returns {ReactKeyName[]} List of key aliases
 */
function resolveKeyAlias(keyName) {
  return KeyAliasesDictionary[keyName] || [ keyName ];
}

export default resolveKeyAlias;
