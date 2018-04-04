import isEqual from 'lodash.isequal';

function hasChanged(newValue, previousValue) {
  return !isEqual(newValue, previousValue);
}

export default hasChanged;
