import UnshiftedKeysDictionary from '../const/UnshiftedKeysDictionary';

function resolveUnshiftedAlias(keyName) {
  return UnshiftedKeysDictionary[keyName] || [ keyName.length === 1 ? keyName.toLowerCase(): keyName ];
}

export default resolveUnshiftedAlias;
