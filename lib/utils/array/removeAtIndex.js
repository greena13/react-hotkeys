function removeAtIndex(array, index) {
  return [
    ...array.slice(0,index),
    ...array.slice(index+1),
  ]
}

export default removeAtIndex;
