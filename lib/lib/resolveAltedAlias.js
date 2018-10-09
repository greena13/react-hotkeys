import AltedKeysDictionary from '../const/AltedKeysDictionary';

function resolveAltedAlias(keyName) {
  return AltedKeysDictionary[keyName] || [ keyName ];
}

export default resolveAltedAlias;
