import size from '../../utils/collection/size';

class KeyCombinationIterator {
  constructor(keyCombination) {
    this._keyCombination = keyCombination;
  }

  /**
   * Whether there are any keys in the combination
   * @returns {boolean} true if there is 1 or more keys involved in the combination,
   *          else false.
   */
  any() {
    return this._getKeys().length > 0;
  }

  /**
   * Number of keys involved in the combination
   * @returns {number} Number of keys
   */
  getNumberOfKeys() {
    return size(this._getKeys());
  }

  /**
   * @callback forEachHandler
   * @param {ReactKeyName} keyName Name of a key in the combination
   * @returns {void}
   */

  /**
   * Iterates over every key in the combination, calling an function with each
   * key name
   * @param {forEachHandler} handler Function to call with the name of each key
   *        in the combination
   * @returns {void}
   */
  forEachKey(handler){
    return this._getKeys().forEach(handler);
  }

  /**
   * @callback evaluator
   * @param {ReactKeyName} keyName Name of a key in the combination
   * @returns {boolean}
   */

  /**
   * Whether at least one of the keys causes a evaluator function to return true
   * @callback {evaluator} evaluator Function to evaluate each key
   * @returns {boolean} Whether at least one key satisfies the evaluator
   */
  some(evaluator) {
    return this._getKeys().some(evaluator);
  }

  _getKeys() {
    return this._keyCombination.getKeys();
  }
}

export default KeyCombinationIterator;
