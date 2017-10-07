export default (obj1, obj2) => {
  if (typeof obj1 !== typeof obj2) {
    return false;
  }
  if (obj1 && !obj2) {
    return false;
  }
  if (!obj1 && obj2) {
    return false;
  }
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) {
    return false;
  }
  for (let i = 0; i < keys1.length; i++) {
    let key1 = keys1[i];
    if (!(key1 in obj2) || obj2[key1] !== obj1[key1]) {
      return false;
    }
  }
  return true;
};
