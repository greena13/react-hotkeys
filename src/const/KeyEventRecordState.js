/**
 * @typedef {Number} KeyEventRecordState
 */

/**
 * Enum for different states a key event can be recorded in
 * @readonly
 * @enum {KeyEventRecordState}
 */
const KeyEventRecordState = {
  unseen: 0,
  seen: 1,
  simulated: 2
};

export default KeyEventRecordState;
