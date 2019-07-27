/**
 * Dictionary of keys whose name is not a single symbol or character
 */
import dictionaryFrom from '../utils/object/dictionaryFrom';
import translateToKey from '../vendor/react-dom/translateToKey';

const NonPrintableKeysDictionary =
  dictionaryFrom(Object.values(translateToKey));

export default NonPrintableKeysDictionary;
