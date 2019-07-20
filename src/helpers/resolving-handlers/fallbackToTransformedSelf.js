function fallbackToTransformedSelf(dictionary, keyName, transformMethod) {
  return dictionary[keyName] || [ keyName.length === 1 ? keyName[transformMethod](): keyName ];
}

export default fallbackToTransformedSelf;
