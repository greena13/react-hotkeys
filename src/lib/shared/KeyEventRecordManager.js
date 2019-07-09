/**
 * @typedef {KeyEventRecordState[]} KeyEventRecord A record indicating which of the key events
 * have been registered to a particular key. The first bit is for the keydown event,
 * the second keypress and the third is for keyup.
 *
 * @example: A record for an key that has seen the keydown and keypress event, but not
 * the keyup event
 *
 * [1,1,0]
 */

import isUndefined from '../../utils/isUndefined';
import KeyEventRecordState from '../../const/KeyEventRecordState';

/**
 * Creates and modifies KeyEventRecords
 * @class
 */
class KeyEventRecordManager {
  /**
   * Makes a new KeyEventRecord with one of the bits set to true
   * @param {KeyEventType=} keyEventType Index of bit to set to true
   * @param {KeyEventRecordState} keyEventState The state to set the key event to
   * @returns {KeyEventRecord} New key event record with bit set to true
   */
  static newRecord(keyEventType, keyEventState) {
    const record = [
      KeyEventRecordState.unseen,
      KeyEventRecordState.unseen,
      KeyEventRecordState.unseen
    ];

    if (!isUndefined(keyEventType)) {
      for(let i = 0; i <= keyEventType; i++) {
        record[i] = keyEventState;
      }
    }

    return record;
  }

  /**
   * Sets a bit in the map to true
   * @param {KeyEventRecord} record Map to set a bit to true
   * @param {KeyEventType} index Index of bit to set
   * @param {KeyEventRecordState} keyEventState The state to set the key event to
   */
  static setBit(record, index, keyEventState) {
    record[index] = keyEventState;

    return record;
  }

  /**
   * Returns a new record with the same values as the one passed to it
   * @param {KeyEventRecord} original Record to copy
   * @returns {KeyEventRecord} Record with the same values as the original
   */
  static clone(original) {
    const record = this.newRecord();

    for(let i = 0; i < original.length; i++) {
      record[i] = original[i];
    }

    return record;
  }
}

export default KeyEventRecordManager;
