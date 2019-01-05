import ShiftedKeysDictionary from '../ShiftedKeysDictionary';
import invertArrayDictionary from '../../utils/invertArrayDictionary';

const UnshiftedKeysDictionary = invertArrayDictionary(ShiftedKeysDictionary);

export default UnshiftedKeysDictionary;
