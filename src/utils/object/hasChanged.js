function hasChanged(source, target) {
  if (!source) {
    return !!target;
  } else if (!target) {
    return !!source;
  }

  const sourceKeys = Object.keys(source);
  const targetKeys = Object.keys(target);

  if (sourceKeys.length !== targetKeys.length) {
    return true;
  } else {
    return sourceKeys.some((sourceKey) => {
      return source[sourceKey] !== target[sourceKey];
    })
  }
}

export default hasChanged;
