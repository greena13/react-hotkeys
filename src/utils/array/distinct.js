import dictionaryFrom from '../object/dictionaryFrom';

function distinct(array) {
  return Object.keys(dictionaryFrom(array));
}

export default distinct;
