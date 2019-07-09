import KeyEventStateArrayManager from '../shared/KeyEventStateArrayManager';
import indexFromEnd from '../../utils/array/indexFromEnd';
import KeyCombinationMatcher from './KeyCombinationMatcher';
import KeyEventState from '../../const/KeyEventState';

/**
 * Matches a KeyHistory to a list of pre-registered ActionConfiguration and
 * their corresponding handler functions
 * @class
 */
class KeyHistoryMatcher {
  /**
   * Returns a new instance of KeyMapMatcher
   * @returns {KeyHistoryMatcher}
   */
  constructor() {
    this._combinationMatchers = {};
    this._eventRecord = KeyEventStateArrayManager.newRecord();
  }

  /**
   * Adds a possible match that can be used to match key combination histories
   * @param {ActionConfiguration} actionConfig The configuration object that
   *        defines the action the possible match represents
   * @param {Function} handler Function to call if the possible match is selected
   *        when matching against a key combination history
   * @returns {void}
   */
  addMatch(actionConfig, handler) {
    const combinationMatcher = this._getOrCreateCombinationMatcher(actionConfig.prefix);
    combinationMatcher.addMatch(actionConfig, handler);

    /**
     * Merge event records so we can quickly determine if a given component
     * has any handlers bound to particular key events
     */
    KeyEventStateArrayManager.setBit(
      this._eventRecord,
      actionConfig.keyEventType,
      KeyEventState.seen
    );

    /**
     * Record the longest sequence length so we know to only check for sequences
     * of that length or shorter for a particular component
     */
    if (!this._longestSequence || this._longestSequence < actionConfig.sequenceLength) {
      this._longestSequence = actionConfig.sequenceLength;
    }
  }

  /**
   * Attempts to find a match from the list of possible matches previously registered
   * for a given key event and key combination history
   * @param {KeyHistory} keyHistory History to attempt to
   *        find a match for
   * @param {ReactKeyName} key Name of the key to find a match for
   * @param {KeyEventType} keyEventType Type of event to find a match
   * @returns {MatchingActionConfig|null} First MatchingActionOptions that matches
   */
  findMatch(keyHistory, key, keyEventType) {
    const combinationMatcher = this._findCombinationMatcher(keyHistory);

    if (combinationMatcher) {
      return combinationMatcher.findMatch(
        keyHistory.getCurrentCombination(),
        keyHistory.getCurrentCombination().getNormalizedKeyName(key),
        keyEventType
      )
    }

    return null;
  }

  /**
   * Whether a possible match has been registered for a key event type
   * @param {KeyEventType} eventType Type of event
   * @returns {boolean} true if at least one possible match has been registered for
   *        the event
   */
  hasMatchesForEventType(eventType) {
    return !!this._eventRecord[eventType];
  }

  /**
   * The number of combinations involved for the ActionConfiguration with the longest
   * key sequence
   * @returns {number} Number of combinations in the longest sequence
   */
  getLongestSequence() {
    return this._longestSequence;
  }

  /********************************************************************************
   * Presentation
   ********************************************************************************/

  /**
   * A plain JavaScript representation of the KeyMapMatcher, useful for
   * serialization or debugging
   * @returns {Object} Serialized representation of the key map matcher
   */
  toJSON() {
    return Object.keys(this._combinationMatchers).reduce((memo, prefix) => {
      const combinationMatcher = this._combinationMatchers[prefix];

      memo[prefix] = combinationMatcher.toJSON();

      return memo;
    }, {});
  }

  /********************************************************************************
   * Private methods
   ********************************************************************************/

  _getOrCreateCombinationMatcher(prefix) {
    if (!this._combinationMatchers[prefix]) {
      this._combinationMatchers[prefix] = new KeyCombinationMatcher();
    }

    return this._combinationMatchers[prefix];
  }

  _findCombinationMatcher(keyHistory) {
    const sequenceHistory =
      keyHistory.getMostRecentCombinations(this.getLongestSequence());

    if (sequenceHistory.length === 0) {
      return this._combinationMatchers[''];
    }

    const sequenceIds =
      sequenceHistory.map((keyCombination) => keyCombination.getIds());

    const idSizes = sequenceIds.map((ids) => ids.length);

    /**
     * List of counters
     * @type {number[]}
     */
    const indexCounters = new Array(sequenceIds.length).fill(0);

    let triedAllPossiblePermutations = false;

    while (!triedAllPossiblePermutations) {
      const sequenceIdPermutation = indexCounters.map((sequenceIdIndex, index) => {
        return sequenceIds[index][sequenceIdIndex];
      });

      const candidateId = sequenceIdPermutation.join(' ');

      if (this._combinationMatchers[candidateId]) {
        return this._combinationMatchers[candidateId];
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
}

export default KeyHistoryMatcher;
