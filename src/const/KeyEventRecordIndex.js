/**
 * @typedef {number} KeyEventRecordIndex index (0-2) of which position in an event record
 * a particular event is located
 */

/**
 * Enum for index values for KeyEventRecords
 * @readonly
 * @enum {KeyEventRecordIndex}
 */
const KeyEventRecordIndex = {
  keydown: 0,
  keypress: 1,
  keyup: 2,
};

export default KeyEventRecordIndex;
