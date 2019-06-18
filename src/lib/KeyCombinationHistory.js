class KeyCombinationHistory {
  constructor() {
    /**
     * Whether the current key combination includes at least one keyup event - indicating
     * that the current combination is ending (and keys are being released)
     */
    this.includesKeyup = false;

    this.records = [];
  }

  init() {
    if (this.isEmpty()) {
      this.push(emptyKeyCombination())
    }
  }

  push(record) {
    this.records.push(record);
  }

  shift() {
    this.records.shift();
  }

  slice(start, end) {
    return this.records.slice(start, end);
  }

  any() {
    return !this.isEmpty();
  }

  isEmpty() {
    return this.length() === 0;
  }

  length() {
    return this.records.length;
  }

  getCurrentCombination() {
    if (this.any()) {
      return this.records[this.length() - 1];
    } else {
      return emptyKeyCombination();
    }
  }

  toJSON() {
    return this.records;
  }
}

/**
 * Returns a new, empty key combination
 * @returns {KeyCombinationRecord} A new, empty key combination
 */
function emptyKeyCombination() {
  return {
    keys: {},
    ids: [ '' ],
    keyAliases: {}
  };
}

export default KeyCombinationHistory;
