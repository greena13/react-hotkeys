import KeyAliasMap from '../const/KeyAliasMap';

function resolveKeyAlias(keyName) {
  return KeyAliasMap[keyName.toLowerCase()] || keyName;
}

export default resolveKeyAlias;
