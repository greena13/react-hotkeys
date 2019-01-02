function dictionaryFrom(array, value = null) {
  return array.reduce((memo, element) => {
    memo[element] = value || { value: element };

    return memo;
  }, {});
}

export default dictionaryFrom;
