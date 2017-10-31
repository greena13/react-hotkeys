import isArray from './isArray';

export default (iterable, callback) => {
  if (isArray(iterable)) {
    iterable.forEach(callback);
  } else { // object
    Object.keys(iterable).forEach(key => {
      callback(iterable[key], key);
    });
  }
};
