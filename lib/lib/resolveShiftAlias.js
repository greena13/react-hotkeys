import ShiftKeysDictionary from '../const/ShiftKeysDictionary';

function resolveShiftAlias(keyName) {
  return ShiftKeysDictionary[keyName] || [ keyName.length === 1 ? keyName.toUpperCase(): keyName ];
}

export default resolveShiftAlias;
