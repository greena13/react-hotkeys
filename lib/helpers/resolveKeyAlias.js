import KeyAliasesDictionary from '../const/KeyAliasesDictionary';

function resolveKeyAlias(keyName) {
  return KeyAliasesDictionary[keyName] || [ keyName ];
}

export default resolveKeyAlias;
