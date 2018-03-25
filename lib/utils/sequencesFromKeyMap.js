function sequencesFromKeyMap(hotKeyMap, hotKeyName) {
  const sequences = hotKeyMap[hotKeyName];

  // If no sequence is found with this name we assume
  // the user is passing a hard-coded sequence as a key
  if (!sequences) {
    return [hotKeyName];
  }

  if (Array.isArray(sequences)) {
    return sequences;
  }

  return [sequences];
}

export default sequencesFromKeyMap;
