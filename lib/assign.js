// Object.assign polyfill from
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
export default function (target, varArgs) { // .length of function is 2
  let to = Object(target);

  for (let index = 1; index < arguments.length; index++) {
    let nextSource = arguments[index];

    if (nextSource !== null) { // Skip over if undefined or null
      for (let nextKey in nextSource) {
        // Avoid bugs when hasOwnProperty is shadowed
        if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
          to[nextKey] = nextSource[nextKey];
        }
      }
    }
  }
  return to;
}
