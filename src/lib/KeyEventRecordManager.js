/**
 * @typedef {boolean[]} KeyEventRecord A record indicating which of the key events
 * have been registered to a particular key. The first bit is for the keydown event,
 * the second keypress and the third is for keyup.
 *
 * @example: A record for an key that has seen the keydown and keypress event, but not
 * the keyup event
 *
 * [true,true,false]
 */

import isUndefined from '../utils/isUndefined';

/**
 * Creates and modifies KeyEventRecords
 * @class
 */
class KeyEventRecordManager {
  /**
   * Makes a new KeyEventRecord with one of the bits set to true
   * @param {KeyEventRecordIndex=} eventRecordIndex Index of bit to set to true
   * @returns {KeyEventRecord} New key event record with bit set to true
   */
  static newRecord(eventRecordIndex) {
    const record = [ false, false, false ];

    if (!isUndefined(eventRecordIndex)) {
      for(let i = 0; i <= eventRecordIndex; i++) {
        record[i] = true;
      }
    }

    return record;
  }

  /**
   * Sets a bit in the map to true
   * @param {KeyEventRecord} record Map to set a bit to true
   * @param {KeyEventRecordIndex} index Index of bit to set
   */
  static setBit(record, index) {
    record[index] = true;

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

  static and(record1, record2) {
    const newRecord = [];

    for(let i = 0; i < record1.length; i++) {
      newRecord[i] = record1[i] & record2[i];
    }

    return newRecord;
  }
}

export default KeyEventRecordManager;
