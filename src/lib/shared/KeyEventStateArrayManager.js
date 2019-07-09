/**
 * @typedef {KeyEventState[]} KeyEvent A record indicating which of the key events
 * have been registered to a particular key. The first bit is for the keydown event,
 * the second keypress and the third is for keyup.
 *
 * @example: A record for an key that has seen the keydown and keypress event, but not
 * the keyup event
 *
 * [1,1,0]
 */

import isUndefined from '../../utils/isUndefined';
import KeyEventState from '../../const/KeyEventState';

/**
 * Creates and modifies KeyEvents
 * @class
 */
class KeyEventStateArrayManager {
  /**
   * Makes a new KeyEvent with one of the bits set to true
   * @param {KeyEventType=} keyEventType Index of bit to set to true
   * @param {KeyEventState} keyEventState The state to set the key event to
   * @returns {KeyEvent} New key event record with bit set to true
   */
  static newRecord(keyEventType, keyEventState) {
    const record = [
      KeyEventState.unseen,
      KeyEventState.unseen,
      KeyEventState.unseen
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
   * @param {KeyEvent} record Map to set a bit to true
   * @param {KeyEventType} index Index of bit to set
   * @param {KeyEventState} keyEventState The state to set the key event to
   */
  static setBit(record, index, keyEventState) {
    record[index] = keyEventState;

    return record;
  }

  /**
   * Returns a new record with the same values as the one passed to it
   * @param {KeyEvent} original Record to copy
   * @returns {KeyEvent} Record with the same values as the original
   */
  static clone(original) {
    const record = this.newRecord();

    for(let i = 0; i < original.length; i++) {
      record[i] = original[i];
    }

    return record;
  }
}

export default KeyEventStateArrayManager;
