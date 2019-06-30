import isUndefined from '../../utils/isUndefined';

/**
 * Manages the incrementing of a globally unique event id
 * @class
 */
class KeyEventCounter {
  /**
   * Globally unique event id
   * @typedef {Number} EventId
   */

  /**
   * Get the current event id
   * @returns {EventId} The current event ID
   */
  static getId() {
    if (isUndefined(this.id)){
      this.id = 0;
    }

    return this.id;
  }

  /**
   * Increment the current event id
   */
  static incrementId(){
    this.id = this.getId() + 1;
  }
}

export default KeyEventCounter;
