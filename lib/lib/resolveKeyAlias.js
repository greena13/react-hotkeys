import KeyAliasMap from '../const/KeyAliasMap';

function resolveKeyAlias(keyName) {
  return KeyAliasMap[keyName.toLowerCase()] || (keyName.match(/^f\d+$/) ? keyName.toUpperCase() : keyName);
}

export default resolveKeyAlias;
