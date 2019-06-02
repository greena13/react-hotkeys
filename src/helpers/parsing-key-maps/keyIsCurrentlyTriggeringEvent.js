import KeyEventSequenceIndex from '../../const/KeyEventSequenceIndex';

/**
 * Whether the a key is in a particular state. i.e. whether the specified key state
 * currently has the bit at eventBitmapIndex set to true.
 * @param {KeyCombinationRecord} keyState The key state to examine
 * @param {KeyEventBitmapIndex} eventBitmapIndex The index of the bit to examine
 * @returns {Boolean} True when the bit at the eventBitmapIndex is currently flipped
 *        or set to true
 */
function keyIsCurrentlyTriggeringEvent(keyState, eventBitmapIndex) {
  return keyState && keyState[KeyEventSequenceIndex.current][eventBitmapIndex];
}

export default keyIsCurrentlyTriggeringEvent;
