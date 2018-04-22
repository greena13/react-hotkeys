import ShiftedKeysDictionary from '../const/ShiftedKeysDictionary';

function resolveShiftedAlias(keyName) {
  return ShiftedKeysDictionary[keyName] || [ keyName.length === 1 ? keyName.toUpperCase(): keyName ];
}

export default resolveShiftedAlias;
