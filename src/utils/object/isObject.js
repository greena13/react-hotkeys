function isObject(target) {
  return !Array.isArray(target) && typeof target === 'object' && target !== null;
}

export default isObject;
