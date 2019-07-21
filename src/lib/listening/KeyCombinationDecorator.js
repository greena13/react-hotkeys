import dictionaryFrom from '../../utils/object/dictionaryFrom';

class KeyCombinationDecorator {
  constructor(keyCombination) {
    this._keyCombination = keyCombination;
  }

  /**
   * Return a serialized description of the keys in the combination
   * @returns {KeySequence}
   */
  describe() {
    return this._keyCombination.getIds()[0];
  }

  /**
   * Dictionary of keys included in the combination record
   * @returns {Object.<ReactKeyName, boolean>}
   */
  asKeyDictionary(){
    return dictionaryFrom(this._keyCombination.getKeys(), true);
  }

  /**
   * A plain JavaScript representation of the key combination record, useful for
   * serialization or debugging
   * @returns {Object} Serialized representation of the combination record
   */
  toJSON() {
    return {
      keys: this._keyCombination.getKeyStates(),
      ids: this._keyCombination.getIds(),
      keyAliases: this._keyCombination.getKeyAliases()
    };
  }
}

export default KeyCombinationDecorator;
