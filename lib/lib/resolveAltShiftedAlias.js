import AltShiftedKeysDictionary from '../const/AltShiftedKeysDictionary';

function resolveAltShiftedAlias(keyName) {
  return AltShiftedKeysDictionary[keyName] || [ keyName ];
}

export default resolveAltShiftedAlias;
