import isUndefined from '../../utils/isUndefined';

/**
 * Manages the incrementing of a globally unique event id
 * @class
 */
class KeyEventCounter {
  /**
   * Globally unique event id
   * @typedef {number} EventId
   */

  /**
   * Get the current event id
   * @returns {EventId} The current event ID
   */
  static getId() {
    if (isUndefined(this._id)){
      this._id = 0;
    }

    return this._id;
  }

  /**
   * Increment the current event id
   */
  static incrementId(){
    this._id = this.getId() + 1;
  }
}

export default KeyEventCounter;
