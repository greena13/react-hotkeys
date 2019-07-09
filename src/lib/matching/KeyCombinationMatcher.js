import Configuration from '../config/Configuration';
import size from '../../utils/collection/size';

/**
 * Object containing all information necessary to match a handler to a history of
 * key combinations
 * @typedef {Object} MatchingActionConfig
 * @property {NormalizedKeySequenceId} prefix - String describing the sequence of key
 *          combinations, before the final key combination (an empty string for
 *          sequences that are a single key combination)
 * @property {number} sequenceLength - Number of combinations involved in the
 *           sequence
 * @property {KeyCombinationString} id - Serialized description of the key combinations
 *            that make up the sequence
 * @property {Object.<KeyName, Boolean>} keyDictionary - Dictionary of key names involved
 *           in the last key combination of the sequence
 * @property {KeyEventType} keyEventType - Record index for key event that
 *          the matcher should match on
 * @property {number} size - Number of keys involved in the final key combination
 * @property {EventMatchDictionary} events - Dictionary of EventMatches
 */

/**
 * A dictionary mapping key event types to event matches
 * @typedef {Object.<KeyEventType, EventMatch>} EventMatchDictionary
 */

/**
 * Object containing information to call a handler if an event type matches a
 * key event
 * @typedef {Object} EventMatch
 * @property {ActionName} actionName - Name of the action
 * @property {Function} handler - Handler to call if event type matches
 */

/**
 * Matches a KeyCombination to a list of pre-registered ActionConfiguration and their
 * corresponding handler functions
 * @class
 */
class KeyCombinationMatcher {
  /**
   * Returns a new instance of KeyCombinationMatcher
   * @returns {KeyCombinationMatcher}
   */
  constructor() {
    this._actionConfigs = {};
    this._order = null;
  }

  /**
   * Adds a new ActionConfiguration and handler to those that can be used to match a
   * KeyCombination
   * @param {ActionConfiguration} actionConfig
   * @param {Function} handler Function to call if match is selected
   * @returns {void}
   */
  addMatch(actionConfig, handler) {
    if (this._includesMatcherForCombination(actionConfig.id)) {
      const { keyEventType, actionName, id } = actionConfig;
      this._addHandlerToActionConfig(id, { keyEventType, actionName, handler });
    } else {
      this._addNewActionConfig(actionConfig, handler);
    }
  }

  /**
   * Finds a MatchingActionConfig for a KeyCombination, ReactKeyName and
   * KeyEventType
   * @param {KeyCombination} keyCombination Record of key combinations
   *         to use in the match
   * @param {ReactKeyName} keyName Name of the key to use in the match
   * @param {KeyEventType} keyEventType The type of key event to use in the match
   * @returns {MatchingActionConfig|null} A MatchingActionOptions that matches the
   *          KeyCombination, ReactKeyName and KeyEventType
   */
  findMatch(keyCombination, keyName, keyEventType) {
    if (!this._order) {
      this._setOrder();
    }

    for(let combinationId of this._order) {
      const actionOptions = this._actionConfigs[combinationId];

      if (this._matchesActionConfig(keyCombination, keyName, keyEventType, actionOptions)) {
        return actionOptions;
      }
    }

    return null;
  }

  /********************************************************************************
   * Presentation
   ********************************************************************************/

  /**
   * A plain JavaScript representation of the KeyCombinationMatcher, useful for
   * serialization or debugging
   * @returns {Object} Serialized representation of the key combination matcher
   */
  toJSON() {
    return {
      actionConfigs: this._actionConfigs,
      order: this._order
    };
  }

  /********************************************************************************
   * Private methods
   ********************************************************************************/

  _matchesActionConfig(keyCombination, keyName, keyEventType, actionOptions) {
    if (!canBeMatched(keyCombination, actionOptions)) {
      return false;
    }

    const combinationHasHandlerForEventType =
      actionOptions.events[keyEventType];

    if (!combinationHasHandlerForEventType) {
      /**
       * If the combination does not have any actions bound to the key event we are
       * currently processing, we skip checking if it matches the current keys being
       * pressed.
       */
      return false;
    }

    let keyCompletesCombination = false;

    const combinationMatchesKeysPressed = Object.keys(actionOptions.keyDictionary).every((candidateKeyName) => {
      if (keyCombination.isEventTriggered(candidateKeyName, keyEventType)) {
        if (keyName && (keyName === keyCombination.getNormalizedKeyName(candidateKeyName))) {
          keyCompletesCombination = !keyCombination.wasEventPreviouslyTriggered(candidateKeyName, keyEventType);
        }

        return true;
      } else {
        return false;
      }
    });

    return combinationMatchesKeysPressed && keyCompletesCombination;
  }

  _setOrder() {
    /**
     * The first time the component that is currently handling the key event has
     * its handlers searched for a match, order the combinations based on their
     * size so that they may be applied in the correct priority order
     */

    const combinationsPartitionedBySize = Object.values(this._actionConfigs).reduce((memo, {id, size}) => {
      if (!memo[size]) {
        memo[size] = [];
      }

      memo[size].push(id);

      return memo;
    }, {});

    this._order = Object.keys(combinationsPartitionedBySize).sort((a, b) => b - a).reduce((memo, key) => {
      return memo.concat(combinationsPartitionedBySize[key]);
    }, []);
  }

  _addNewActionConfig(combinationSchema, handler) {
    const {
      prefix, sequenceLength, id, keyDictionary, size, keyEventType, actionName
    } = combinationSchema;

    this._setCombinationMatcher(id, {
      prefix, sequenceLength, id, keyDictionary, size,
      events: { }
    });

    this._addHandlerToActionConfig(id, { keyEventType, actionName, handler })
  }

  _addHandlerToActionConfig(id, { keyEventType, actionName, handler }) {
    const combination = this._getCombinationMatcher(id);

    this._setCombinationMatcher(id, {
      ...combination,
      events: {
        ...combination.events,
        [keyEventType]: { actionName, handler }
      }
    });
  }

  _setCombinationMatcher(id, combinationMatcher) {
    this._actionConfigs[id] = combinationMatcher;
  }

  _getCombinationMatcher(id) {
    return this._actionConfigs[id];
  }

  _includesMatcherForCombination(id) {
    return !!this._getCombinationMatcher(id);
  }
}

function canBeMatched(keyCombination, combinationMatcher) {
  const combinationKeysNo = size(combinationMatcher.keyDictionary);

  if (Configuration.option('allowCombinationSubmatches')) {
    return keyCombination.getNumberOfKeys() >= combinationKeysNo;
  } else {
    /**
     * If sub-matches are not allow, the number of keys in the key state and the
     * number of keys in the combination we are attempting to match, must be
     * exactly the same
     */
    return keyCombination.getNumberOfKeys() === combinationKeysNo;
  }
}

export default KeyCombinationMatcher;
