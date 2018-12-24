import KeyEventBitmapManager from './KeyEventBitmapManager';
import KeyEventBitmapIndex from '../const/KeyEventBitmapIndex';
import Logger from './Logger';
import KeySerializer from './KeySerializer';
import arrayFrom from '../utils/array/arrayFrom';
import indexFromEnd from '../utils/array/indexFromEnd';
import isObject from '../utils/object/isObject';
import isUndefined from '../utils/isUndefined';
import isEmpty from '../utils/collection/isEmpty';
import resolveAltShiftedAlias from './resolveAltShiftedAlias';
import resolveShiftedAlias from './resolveShiftedAlias';
import resolveAltedAlias from './resolveAltedAlias';
import resolveKeyAlias from './resolveKeyAlias';

class AbstractKeyEventManager {
  static _describeKeyEvent(eventBitmapIndex) {
    switch(eventBitmapIndex) {
      case 0: return 'keydown';
      case 1: return 'keypress';
      default: return 'keyup';
    }
  }

  static logIcons = ['📕', '📗', '📘', '📙'];
  static componentIcons = ['🔺', '⭐️', '🔷', '🔶', '⬛️'];
  static eventIcons = ['❤️', '💚', '💙', '💛', '💜', '🧡'];

  constructor(configuration = {}) {
    this.logger = configuration.logger || new Logger('warn');

    this.componentIndex = 0;

    this._reset();
  }

  _reset() {
    /**
     * @typedef {Object} ComponentOptions Object containing a description of the key map
     *          and handlers from a particular HotKeys component
     * @property {KeyEventMatcher} keyMatchersMap Map of ActionNames to
     *           KeySequenceDSLStatement
     * @property {EventHandlerMap} handlers Map of ActionNames to EventHandlers
     */

    /**
     * List of actions and handlers registered by each component currently in focus.
     * The component closest to the element in focus is last in the list.
     * @type {ComponentOptions[]}
     */
    this.componentList = [];

    /**
     * List of mappings from key sequences to handlers that is constructed on-the-fly
     * as key events propagate up the render tree
     */
    this.keyMaps = null;

    /**
     * Index marking the number of places from the end of componentList for which the
     * keyMaps have been matched with event handlers. Used to build this.keyMaps as
     * key events propagate up the React tree.
     * @type {Number}
     */
    this.searchIndex =  0;

    /**
     * Array of counters - one for each component - to keep track of how many handlers
     * for that component still need actions assigned to them
     * @type {Number[]}
     */
    this.unmatchedHandlerStatus = null;

    /**
     * A dictionary of handlers to the components that register them. This is populated
     * as this.searchIndex increases, moving from the end of this.componentList to the
     * front, populating this.keyMaps as needed
     * @type {Object<ActionName, ComponentIndex>}
     */
    this.handlersDictionary = {};

    /**
     * A dictionary of sequences already encountered in the process of building the
     * list of keyMaps on the fly, as key events propagate up the component tree
     */
    this.keySequencesDictionary = {};

    /**
     * @typedef {String} KeyName Name of the keyboard key
     */

    /**
     * @typedef {Number} ComponentIndex Unique index associated with every HotKeys component
     * as it registers itself as being in focus. The HotKeys component closest to the DOM
     * element in focus gets the smallest number (0) and those further up the render tree
     * get larger (incrementing) numbers.
     */

    /**
     * @typedef {Object} BasicKeyCombination Object containing the basic information that
     *          describes a key combination
     * @property {KeyCombinationId} id String description of keys involved in the key
     *          combination
     * @property {Number} size Number of keys involved in the combination
     * @property {Object.<KeyName, Boolean>} keyDictionary Dictionary of key names involved in
     *           the key combination
     */

    /**
     * @typedef {Object} KeySequenceObject Object containing description of a key sequence
     *          to compared against key events
     * @property {KeySequenceId} id Id describing key sequence used for matching against
     *            key events
     * @property {ComponentIndex} componentIndex Id associated with the HotKeys component
     *          that registered the key sequence
     * @property {BasicKeyCombination[]} sequence A list of key combinations involved in
     *            the sequence
     * @property {Number} size Number of key combinations in the key sequence
     * @property {KeyEventBitmapIndex} eventBitmapIndex Index that matches key event type
     * @property {ActionName} actionName Name of the action that should be triggered if a
     *           keyboard event matching the sequence and event type occur
     */

    /**
     * @typedef {Object} KeyCombinationObject Object containing description of a key
     *          combination to compared against key events
     * @extends BasicKeyCombination
     * @property {ComponentIndex} componentIndex Id associated with the HotKeys component
     *          that registered the key sequence
     * @property {Number} size Number of key combinations in the key sequence
     * @property {KeyEventBitmapIndex} eventBitmapIndex Index that matches key event type
     * @property {ActionName} actionName Name of the action that should be triggered if a
     *           keyboard event matching the combination and event type occur
     */

    /**
     * @typedef {Object} KeyEventMatcher Object containing key sequence and combination
     *          descriptions for a particular HotKeys component
     * @property {KeySequenceObject} sequences Map of key sequences
     * @property {KeyCombinationObject} combinations Map of key combinations
     * @property {KeyCombinationId[]} combinationsOrder Order of combinations from highest
     *            priority to lowest
     */

    /**
     * Counter for the longest sequence registered by the HotKeys components currently
     * in focus. Allows setting an upper bound on the length of the key event history
     * that must be kept.
     * @type {Number}
     */
    this.longestSequence = 1;

    /**
     * Bitmap to record whether there is at least one keymap bound to each event type
     * (keydown, keypress or keyup) so that we can skip trying to find a matching keymap
     * on events where we know there is none to find
     * @type {KeyEventBitmap}
     */
    this.keyMapEventBitmap = KeyEventBitmapManager.newBitmap();

    /**
     * Whether the current key combination includes at least one keyup event - indicating
     * that the current combination is ending (and keys are being released)
     */
    this.keyCombinationIncludesKeyUp = false;

    /**
     * @typedef {Object.<String, KeyEventBitmap[]>} KeyCombinationRecord A dictionary of keys that
     * have been pressed down at once. The keys of the map are the lowercase names of the
     * keyboard keys. May contain 1 or more keyboard keys.
     *
     * @example: A key combination for when shift and A have been pressed, but not released:
     *
     * {
     *   shift: [ [true,false,false], [true,true,false] ],
     *   A: [ [true,true,false], [true,true,false] ]
     * }
     *
     * List of most recent key combinations seen by the KeyEventManager
     * @type {KeyCombinationRecord[]}
     */
    if (!this.keyCombinationHistory || this.keyCombinationHistory.length < 1) {
      this.keyCombinationHistory = [];
    } else {
      const currentKeyCombination = this._getCurrentKeyCombination();

      const keysStillPressed = Object.keys(currentKeyCombination.keys).reduce((memo, keyName) => {
        const keyState = currentKeyCombination.keys[keyName];
        const currentKeyState = keyState[KeyEventBitmapIndex.current];

        if (currentKeyState[KeyEventBitmapIndex.keydown] && !currentKeyState[KeyEventBitmapIndex.keyup]) {
          memo[keyName] = keyState;
        }

        return memo;
      }, {});

      this.keyCombinationHistory = [
        {
          keys: keysStillPressed,
          ids: KeySerializer.combination(keysStillPressed)
        }
      ]
    }
  }

  _addComponentToList(actionNameToKeyMap = {}, actionNameToHandlersMap = {}, options) {
    this.componentIndex = this.componentList.length;

    const componentOptions = this._buildComponentOptions(
      this.componentIndex,
      actionNameToKeyMap,
      actionNameToHandlersMap,
      options
    );

    this.componentList.push(componentOptions);
  }

  /**
   * Returns the current key combination, i.e. the key combination that represents
   * the current key events.
   * @returns {KeyCombinationRecord} The current key combination
   * @private
   */
  _getCurrentKeyCombination() {
    if (this.keyCombinationHistory.length > 0) {
      return this.keyCombinationHistory[this.keyCombinationHistory.length - 1];
    } else {
      return { keys: {}, ids: [ '' ] };
    }
  }

  /**
   * Adds a key event to the current key combination (as opposed to starting a new
   * keyboard combination).
   * @param {String} keyName Name of the key to add to the current combination
   * @param {KeyEventBitmapIndex} bitmapIndex Index in bitmap to set to true
   * @private
   */
  _addToCurrentKeyCombination(keyName, bitmapIndex) {
    if (this.keyCombinationHistory.length === 0) {
      this.keyCombinationHistory.push({ keys: {}, ids: [ '' ] });
    }

    const keyCombination = this._getCurrentKeyCombination();

    const existingBitmap = keyCombination.keys[keyName];

    if (!existingBitmap) {
      keyCombination.keys[keyName] = [
        KeyEventBitmapManager.newBitmap(),
        KeyEventBitmapManager.newBitmap(bitmapIndex)
      ];

    } else {
      keyCombination.keys[keyName] = [
        KeyEventBitmapManager.clone(existingBitmap[1]),
        KeyEventBitmapManager.newBitmap(bitmapIndex)
      ];
    }

    keyCombination.ids = KeySerializer.combination(keyCombination.keys);
  }

  /**
   * Adds a new KeyCombinationRecord to the event history and resets the keystateIncludesKeyUp
   * flag to false.
   * @param {String} keyName Name of the keyboard key to add to the new KeyCombinationRecord
   * @param {KeyEventBitmapIndex} eventBitmapIndex Index of bit to set to true in new
   *        KeyEventBitmap
   * @private
   */
  _startNewKeyCombination(keyName, eventBitmapIndex) {
    if (this.keyCombinationHistory.length > this.longestSequence) {
      /**
       * We know the longest key sequence registered for the currently focused
       * components, so we don't need to keep a record of history longer than
       * that
       */
      this.keyCombinationHistory.shift();
    }

    const lastKeyCombination = this._getCurrentKeyCombination();

    const keys = {
      ...this._withoutKeyUps(lastKeyCombination),
      [keyName]: [
        KeyEventBitmapManager.newBitmap(),
        KeyEventBitmapManager.newBitmap(eventBitmapIndex)
      ]
    };

    this.keyCombinationHistory.push({
      keys,
      ids: KeySerializer.combination(keys)
    });

    this.keyCombinationIncludesKeyUp = false;
  }

  /**
   * Returns a new KeyCombinationRecord without the keys that have been
   * released (had the keyup event recorded). Essentially, the keys that are
   * currently still pressed down at the time a key event is being handled.
   * @param {KeyCombinationRecord} keyCombinationRecord Record of keys currently
   *        pressed down that should have the release keyed omitted from
   * @returns {KeyCombinationRecord} New KeyCombinationRecord with all of the
   *        keys with keyup events omitted
   * @private
   */
  _withoutKeyUps(keyCombinationRecord) {
    return Object.keys(keyCombinationRecord.keys).reduce((memo, keyName) => {
      const keyState = keyCombinationRecord.keys[keyName];

      if (!keyState[KeyEventBitmapIndex.current][KeyEventBitmapIndex.keyup]) {
        memo[keyName] = keyState;
      }

      return memo;
    }, {});
  }

  _callMatchingHandlerClosestToEventTarget(event, keyName, eventBitmapIndex, componentIndex) {
    if (!this.keyMaps || !this.unmatchedHandlerStatus) {
      /**
       * Initialize key maps and unmatched handler counts the first time a key event
       * is received by a new focus tree
       */
      this.keyMaps = [];
      this.unmatchedHandlerStatus = [];

      this.componentList.forEach(({ handlers }) => {
        this.unmatchedHandlerStatus.push( [ Object.keys(handlers).length, {} ]);
        this.keyMaps.push({});
      });
    }

    const unmatchedHandlersStatus = this.unmatchedHandlerStatus[componentIndex];
    let unmatchedHandlersCount = unmatchedHandlersStatus[0];

    if (unmatchedHandlersCount > 0) {
      /**
       * Component currently handling key event has handlers that have not yet been
       * associated with a key sequence. We need to continue walking up the component
       * tree in search of the matching actions that describe the applicable key
       * sequence.
       */
      if (this.searchIndex < componentIndex) {
        this.searchIndex = componentIndex;
      }

      while (this.searchIndex < this.componentList.length && unmatchedHandlersCount > 0) {
        const { handlers, actions } = this.componentList[this.searchIndex];

        /**
         * Add current component's handlers to the handlersDictionary so we know
         * what component has defined them
         */
        Object.keys(handlers).forEach((actionName) => {
          if (!this.handlersDictionary[actionName]) {
            this.handlersDictionary[actionName] = [];
          }

          this.handlersDictionary[actionName].push(this.searchIndex);
        });

        /**
         * Iterate over the actions of a component (starting with the current component
         * and working through its ancestors), matching them to the current component's
         * handlers
         */
        Object.keys(actions).forEach((actionName) => {
          const handlerComponentIndexes = this.handlersDictionary[actionName];

          if (handlerComponentIndexes) {
            /**
             * Get action handler closest to the event target
             */
            const handlerComponentIndex = handlerComponentIndexes[0];
            const handler = this.componentList[handlerComponentIndex].handlers[actionName];

            /**
             * Get key map that corresponds with the component that defines the handler
             * closest to the event target
             */
            const keyMap = this.keyMaps[handlerComponentIndex];

            /**
             * Store the key sequence with the handler that it should call at
             * a given component level
             */
            if (!keyMap.sequences) {
              keyMap.sequences = {};
            }

            /**
             * At least one child HotKeys component (or the component itself) has
             * defined a handler for the action, so now we need to associate them
             */
            const keyMatchers = actions[actionName];

            keyMatchers.forEach((keyMatcher) => {
              const keySequence = [keyMatcher.prefix, keyMatcher.id].join(' ');

              if (this.keySequencesDictionary[keySequence]) {
                /**
                 * Return if there is already a component with handlers for the current
                 * key sequence closer to the event target
                 */
                return;
              }

              if (!keyMap.sequences[keyMatcher.prefix]) {
                keyMap.sequences[keyMatcher.prefix] = { combinations: {} };
              }

              keyMap.sequences[keyMatcher.prefix].combinations[keyMatcher.id] = {
                ...keyMatcher,
                handler
              };

              /**
               * Merge event bitmaps so we can quickly determine if a given component
               * has any handlers bound to particular key events
               */
              if (!keyMap.eventBitmap) {
                keyMap.eventBitmap = KeyEventBitmapManager.newBitmap();
              }

              KeyEventBitmapManager.setBit(keyMap.eventBitmap, keyMatcher.eventBitmapIndex);

              /**
               * Record the longest sequence length so we know to only check for sequences
               * of that length or shorter for a particular component
               */
              if (!keyMap.longestSequence || keyMap.longestSequence < keyMatcher.sequenceLength) {
                keyMap.longestSequence = keyMatcher.sequenceLength;
              }

              /**
               * Record that we have already found a handler for the current action so
               * that we do not override handlers for an action closest to the event target
               * with handlers further up the tree
               */
              if (!this.keySequencesDictionary[keySequence]) {
                this.keySequencesDictionary[keySequence] = [];
              }

              this.keySequencesDictionary[keySequence].push(handlerComponentIndex);
            });

            handlerComponentIndexes.forEach((handlerComponentIndex) => {
              const handlerComponentStatus = this.unmatchedHandlerStatus[handlerComponentIndex];

              if (!handlerComponentStatus[1][actionName]) {
                handlerComponentStatus[1][actionName] = true;

                /**
                 * Decrement the number of remaining unmatched handlers for the
                 * component currently handling the propagating key event, so we know
                 * when all handlers have been matched to sequences and we can move on
                 * to matching them against the current key event
                 */
                handlerComponentStatus[0]--;
              }
            });
          }
        });

        /**
         * Search next component up in the hierarchy for actions that match outstanding
         * handlers
         */
        this.searchIndex++;
      }
    }

    const keyMap = this.keyMaps[componentIndex];

    if (!keyMap || isEmpty(keyMap.sequences) || !keyMap.eventBitmap[eventBitmapIndex]) {
      /**
       * Component doesn't define any matchers for the current key event
       */

      this.logger.verbose(`${this._logPrefix(componentIndex)} Doesn't define a handler for ${this._describeCurrentKeyCombination()} ${this.constructor._describeKeyEvent(eventBitmapIndex)}.`);

      return;
    }

    const { sequences, longestSequence } = keyMap;

    const currentKeyState = this._getCurrentKeyCombination();

    let sequenceLengthCounter = longestSequence;

    while(sequenceLengthCounter >= 0) {
      const sequenceHistory = this.keyCombinationHistory.slice(-sequenceLengthCounter, -1);
      const sequenceHistoryIds = sequenceHistory.map(({ ids }) => ids );

      const matchingSequence = this._tryMatchSequenceWithKeyAliases(sequences, sequenceHistoryIds);

      if (matchingSequence) {
        if (!matchingSequence.order) {
          /**
           * The first time the component that is currently handling the key event has
           * its handlers searched for a match, order the combinations based on their
           * size so that they may be applied in the correct priority order
           */

          const combinationsPartitionedBySize = Object.values(matchingSequence.combinations).reduce((memo, { id, size }) => {
            if (!memo[size]) {
              memo[size] = [];
            }

            memo[size].push(id);

            return memo;
          }, {});

          matchingSequence.order = Object.keys(combinationsPartitionedBySize).sort((a, b) => b-a ).reduce((memo, key) => {
            return memo.concat(combinationsPartitionedBySize[key]);
          }, []);
        }

        const combinationOrder = matchingSequence.order;

        let combinationIndex = 0;

        while(combinationIndex < combinationOrder.length) {
          const combinationId = combinationOrder[combinationIndex];
          const combinationMatcher = matchingSequence.combinations[combinationId];

          if (this._combinationMatchesKeys(keyName, currentKeyState, combinationMatcher)) {
            this.logger.debug(`${this._logPrefix(componentIndex)} Found action that matches ${this._describeCurrentKeyCombination()}: ${combinationMatcher.actionName}. Calling handler . . .`);
            combinationMatcher.handler(event);

            this.currentEvent.handled = true;

            return true;
          }

          combinationIndex++;
        }

      }

      sequenceLengthCounter--;
    }

    const eventName = this.constructor._describeKeyEvent(eventBitmapIndex);
    this.logger.debug(`${this._logPrefix(componentIndex)} No matching actions found for ${this._describeCurrentKeyCombination()} ${eventName}.`);
  }

  _describeCurrentKeyCombination() {
    return this._getCurrentKeyCombination().ids[0];
  }

  _tryMatchSequenceWithKeyAliases(keyMatcher, sequenceIds) {
    if (sequenceIds.length === 0) {
      return keyMatcher[''];
    }

    const idSizes = sequenceIds.map((ids) => ids.length);
    const indexCounters = sequenceIds.map(() => 0);

    let triedAllPossiblePermutations = false;

    while (!triedAllPossiblePermutations) {
      const sequenceIdPermutation = indexCounters.map((sequenceIdIndex, index) => {
        return sequenceIds[index][sequenceIdIndex];
      });

      const candidateId = sequenceIdPermutation.join(' ');

      if (keyMatcher[candidateId]) {
        return keyMatcher[candidateId];
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

  _combinationMatchesKeys(keyBeingPressed, keyboardState, combinationMatch) {
    let keyCompletesCombination = false;

    const combinationMatchesKeysPressed = !Object.keys(combinationMatch.keyDictionary).some((candidateKeyName) => {
      const candidateBitmapIndex = combinationMatch.eventBitmapIndex;

      const matchingKeyName = (() => {
        if (keyboardState.keys[candidateKeyName]) {
          return candidateKeyName;
        } else {
          return this._tryMatchWithKeyAliases(keyboardState, candidateKeyName);
        }
      })();

      if (matchingKeyName) {
        const keyEventBitmap = keyboardState.keys[matchingKeyName];
        const keyEventBitTrue = keyEventBitmap[KeyEventBitmapIndex.current][candidateBitmapIndex];

        if (keyBeingPressed && matchingKeyName === keyBeingPressed) {
          keyCompletesCombination = !keyEventBitmap[KeyEventBitmapIndex.previous][candidateBitmapIndex] && keyEventBitTrue;
        }

        return !keyEventBitTrue;
      } else {
        return true;
      }
    });

    return combinationMatchesKeysPressed && keyCompletesCombination;
  }

  _tryMatchWithKeyAliases(keyState, candidateKeyName) {
    const candidateKeyNames = function(){
      const combinationIncludesShift = keyState.keys['Shift'];
      const combinationIncludesAlt = keyState.keys['Alt'];

      if (combinationIncludesShift) {
        if (combinationIncludesAlt) {
          return resolveAltShiftedAlias(candidateKeyName);
        } else {
          return resolveShiftedAlias(candidateKeyName);
        }
      } else {
        if (combinationIncludesAlt) {
          return resolveAltedAlias(candidateKeyName);
        } else {
          return resolveKeyAlias(candidateKeyName);
        }
      }
    }();

    return candidateKeyNames.find((keyName) => keyState.keys[keyName]);
  }

  _buildComponentOptions(componentIndex, actionNameToKeyMap, actionNameToHandlersMap, options) {
    const { keyMap: hardSequenceKeyMap, handlers } = this._applyHardSequences(actionNameToKeyMap, actionNameToHandlersMap);

    return {
      actions: this._buildKeyMatcherMap({ ...actionNameToKeyMap, ...hardSequenceKeyMap }, options),
      handlers,
      componentIndex,
      keyMapEventBitmap: options.keyMapEventBitmap
    };
  }

  _applyHardSequences(actionNameToKeyMap, actionNameToHandlersMap) {
    return Object.keys(actionNameToHandlersMap).reduce((memo, actionNameOrKeyExpression) => {
      const actionNameIsInKeyMap = !!actionNameToKeyMap[actionNameOrKeyExpression];

      const handler = actionNameToHandlersMap[actionNameOrKeyExpression];

      if (!actionNameIsInKeyMap && KeySerializer.isValidKeySerialization(actionNameOrKeyExpression)) {
        memo.keyMap[actionNameOrKeyExpression] = actionNameOrKeyExpression;
        memo.handlers[actionNameOrKeyExpression] = handler;
      } else {
        memo.handlers[actionNameOrKeyExpression] = handler;
      }

      return memo;
    }, { keyMap: {}, handlers: {}});
  }

  /**
   * @typedef {Object} KeyExpressionObject Object describing a key event
   * @property {KeySequenceId|KeyCombinationId|KeySequenceId[]|KeyCombinationId[]} sequence
   * @property {EventType} action
   */

  /**
   * Converts a ActionKeyMap to a KeyExpressionObject and saves it so it can later be
   * recalled and matched against key events
   * @param {ActionKeyMap} actionNameToKeyMap Mapping of ActionNames to key sequences
   * @param {Object<String, any>} options Hash of options that configure how the key
   *        map is built.
   * @param {String} options.defaultKeyEvent The default key event to use for any action
   *        that does not explicitly define one.
   * @return {KeyEventMatcher}
   * @private
   */
  _buildKeyMatcherMap(actionNameToKeyMap, options) {
    return Object.keys(actionNameToKeyMap).reduce((keyMapMemo, actionName) => {
      const keyMapOptions = arrayFrom(actionNameToKeyMap[actionName]);

      keyMapOptions.forEach((keyMapOption) => {
        const { keySequence, eventBitmapIndex } = function(){
          if (isObject(keyMapOption)) {
            const { sequence, action } = keyMapOption;

            return {
              keySequence: sequence,
              eventBitmapIndex: isUndefined(action) ? KeyEventBitmapIndex[options.defaultKeyEvent] : KeyEventBitmapIndex[action]
            };
          } else {
            return {
              keySequence: keyMapOption,
              eventBitmapIndex: KeyEventBitmapIndex[options.defaultKeyEvent]
            }
          }
        }();

        const { sequence, combination } = KeySerializer.parseString(keySequence, { eventBitmapIndex });

        if (sequence.size > this.longestSequence) {
          this.longestSequence = sequence.size;
        }

        /**
         * Record that there is at least one key sequence in the focus tree bound to
         * the keyboard event
         */
        KeyEventBitmapManager.setBit(options.keyMapEventBitmap, eventBitmapIndex);

        if (!keyMapMemo[actionName]) {
          keyMapMemo[actionName] = [];
        }

        keyMapMemo[actionName].push({
          prefix: sequence.prefix,
          actionName,
          sequenceLength: sequence.size,
          ...combination,
        });
      });

      return keyMapMemo;
    }, {});
  }
}

export default AbstractKeyEventManager;
