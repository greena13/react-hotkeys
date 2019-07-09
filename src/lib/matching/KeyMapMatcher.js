import KeyEventRecordManager from '../shared/KeyEventRecordManager';
import indexFromEnd from '../../utils/array/indexFromEnd';
import KeySequenceMatcher from './KeySequenceMatcher';
import KeyEventRecordState from '../../const/KeyEventRecordState';

class KeyMapMatcher {
  constructor() {
    this._sequenceMatchers = {};

    this._eventRecord = KeyEventRecordManager.newRecord();
  }

  addSequenceMatcher(keyCombinationSchema, handler) {
    const sequenceMatcher = this._getOrCreateSequenceMatcher(keyCombinationSchema.prefix);
    sequenceMatcher.addCombination(keyCombinationSchema, handler);

    /**
     * Merge event records so we can quickly determine if a given component
     * has any handlers bound to particular key events
     */
    KeyEventRecordManager.setBit(
      this._eventRecord,
      keyCombinationSchema.keyEventType,
      KeyEventRecordState.seen
    );

    /**
     * Record the longest sequence length so we know to only check for sequences
     * of that length or shorter for a particular component
     */
    if (!this._longestSequence || this._longestSequence < keyCombinationSchema.sequenceLength) {
      this._longestSequence = keyCombinationSchema.sequenceLength;
    }
  }

  findMatch(keyCombinationHistory, key, keyEventType) {
    const sequenceMatcher = this._findSequenceMatcher(keyCombinationHistory);

    if (sequenceMatcher) {
      const currentCombination = keyCombinationHistory.getCurrentCombination();
      const normalizedKeyName = currentCombination.getNormalizedKeyName(key);

      return sequenceMatcher.findMatch(
        currentCombination,
        normalizedKeyName,
        keyEventType
      )
    }

    return null;
  }

  hasMatchesForEventType(eventIndex) {
    return !!this._eventRecord[eventIndex];
  }

  _getOrCreateSequenceMatcher(prefix) {
    if (!this._sequenceMatchers[prefix]) {
      this._sequenceMatchers[prefix] = new KeySequenceMatcher();
    }

    return this._sequenceMatchers[prefix];
  }

  toJSON() {
    return Object.keys(this._sequenceMatchers).reduce((memo, prefix) => {
      const sequenceMatcher = this._sequenceMatchers[prefix];

      memo[prefix] = sequenceMatcher.toJSON();

      return memo;
    }, {});
  }

  _findSequenceMatcher(keyCombinationHistory) {
    const sequenceHistory =
      keyCombinationHistory.getMostRecentCombinations(this.getLongestSequence());

    if (sequenceHistory.length === 0) {
      return this._sequenceMatchers[''];
    }

    const sequenceIds =
      sequenceHistory.map((keyCombinationRecord) => keyCombinationRecord.getIds());

    const idSizes = sequenceIds.map((ids) => ids.length);
    const indexCounters = new Array(sequenceIds.length).fill(0);

    let triedAllPossiblePermutations = false;

    while (!triedAllPossiblePermutations) {
      const sequenceIdPermutation = indexCounters.map((sequenceIdIndex, index) => {
        return sequenceIds[index][sequenceIdIndex];
      });

      const candidateId = sequenceIdPermutation.join(' ');

      if (this._sequenceMatchers[candidateId]) {
        return this._sequenceMatchers[candidateId];
      }

      let incrementer = 0;
      let carry = true;

      while (carry && incrementer < indexCounters.length) {
        const count = indexFromEnd(indexCounters, incrementer);

        const newIndex = (count + 1) % (indexFromEnd(idSizes, incrementer) || 1);

        indexCounters[indexCounters.length - (incrementer + 1)] = newIndex;

        carry = newIndex === 0;

        if (carry) {
          incrementer++;
        }
      }

      triedAllPossiblePermutations = incrementer === indexCounters.length;
    }
  }

  getLongestSequence() {
    return this._longestSequence;
  }
}

export default KeyMapMatcher;
