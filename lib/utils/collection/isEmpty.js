import isObject from '../object/isObject';

function isEmpty(target) {
  if (isObject(target)) {
    return Object.keys(target).length === 0;
  } else {
    return target.length === 0;
  }
}

export default isEmpty;
