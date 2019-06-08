import KeyEventSequenceIndex from '../../const/KeyEventSequenceIndex';

/**
 * Whether the a key is in a particular state. i.e. whether the specified key state
 * currently has the bit at eventRecordIndex set to true.
 * @param {KeyCombinationRecord} keyState The key state to examine
 * @param {KeyEventRecordIndex} eventRecordIndex The index of the bit to examine
 * @returns {Boolean} True when the bit at the eventRecordIndex is currently flipped
 *        or set to true
 */
function keyIsCurrentlyTriggeringEvent(keyState, eventRecordIndex) {
  return keyState && keyState[KeyEventSequenceIndex.current][eventRecordIndex];
}

export default keyIsCurrentlyTriggeringEvent;
