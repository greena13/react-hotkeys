import ShiftMap from '../const/ShiftMap';
import capitalize from '../utils/string/capitalize';

function resolveShiftAlias(keyName) {
  return ShiftMap[keyName] || capitalize(keyName);
}

export default resolveShiftAlias;
