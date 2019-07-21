function lazyLoadAttribute(target, attributeName, definition) {
  if (!target[attributeName]) {
    target[attributeName] = typeof definition === 'function' ? definition() : definition;
  }

  return target[attributeName];
}

export default lazyLoadAttribute;
