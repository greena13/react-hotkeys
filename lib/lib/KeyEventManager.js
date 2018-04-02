import indexFromEnd from '../utils/array/indexFromEnd';
import arrayFrom from '../utils/array/arrayFrom';
import isObject from '../utils/object/isObject';
import orderBy from 'lodash.orderby';
import KeyEventBitmapManager from './KeyEventBitmapManager';
import normalizeKeyName from './normalizeKeyName';
import KeySerializer from './KeySerializer';
import KeyEventBitmapIndex from '../const/KeyEventBitmapIndex';
import ignoreEventsCondition from './ignoreEventsCondition';

/**
 * Provides a registry for keyboard sequences and events, and the handlers that should
 * be called when they are detected. Also contains the interface for processing and
 * matching keyboard events against its list of registered actions and handlers.
 * @class
 */
class KeyEventManager {
  /**
   * Creates a new KeyEventManager instance. It is expected that only a single instance
   * will be used with a render tree.
   */
  constructor() {
    this._reset();
  }

  /**
   * Clears the internal state, wiping and history of key events and registered handlers
   * so they have no effect on the next tree of focused HotKeys components
   * @private
   */
  _reset() {
    if (!this.flags || !this.flags.reset) {
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
       * A list of cumulative merging of KeyEventMatchers so that as a keyboard event
       * propagates
       * @type {KeyEventMatcher[]}
       */
      this.keyMatcherList = null;

      /**
       * Counter for the longest sequence registered by the HotKeys components currently
       * in focus. Allows setting an upper bound on the length of the key event history
       * that must be kept.
       * @type {Number}
       */
      this.longestKeySequence = 1;

      /**
       * Container of flags that keep track of various facets of the KeyEventManager's
       * state.
       * @type {{reset: boolean, keyStateIncludesKeyUp: boolean}}
       */
      this.flags = {
        /**
         * Whether the KeyEventManager has been reset - sets to false when new HotKeys
         * components start registering themselves as being focused
         */
        reset: true,

        /**
         * Whether the current key combination includes at leas one keyup event - indicating
         * that the current combination is ending (and keys are being released)
         */
        keyCombinationIncludesKeyUp: false,

        /**
         * Whether the keyboard event current being handled should be ignored
         * @type {Boolean}
         */
        ignoreEvent: false,
      };

      /**
       * @typedef {Object.<String, KeyEventBitmap>} KeyCombinationRecord A dictionary of keys that
       * have been pressed down at once. The keys of the map are the lowercase names of the
       * keyboard keys. May contain 1 or more keyboard keys.
       *
       * @example: A key combination for when shift and A have been pressed, but not released:
       *
       * {
       *   shift: [true,true,false],
       *   A: [true,true,false]
       * }
       *
       * List of most recent key combinations seen by the KeyEventManager
       * @type {KeyCombinationRecord[]}
       */
      this.keyCombinationHistory = [];

      /**
       * Object containing state of a key events propagation up the render tree towards
       * the document root
       * @type {{previousComponentIndex: number, actionHandled: boolean, previousKeyMatcher: KeyEventMatcher}}}
       */
      this.eventPropagationHistory = {
        /**
         * Index of the component last seen to be handling a key event
         * @type {ComponentIndex}
         */
        previousComponentIndex: -1,

        /**
         * Whether the keyboard event currently being handled has already matched a
         * handler function that has been called
         * @type {Boolean}
         */
        actionHandled: false,

        /**
         * The KeyEventMatcher that previously matched the current key event on a
         * child component
         * @type {KeyEventMatcher}
         */
        previousKeyMatcher: null,
      };
    }
  }

  /**
   * @typedef {String} ActionName Unique identifier of an action that is used to match
   *          against handlers when a matching keyboard event occurs
   */

  /**
   * @typedef {Object.<KeySequenceId, KeyEventMatcher>} KeyMap A mapping from key
   * sequence ids to key event matchers
   */

  /**
   * @typedef {String} KeyCombinationId String describing a combination of one or more
   * keys separated by '+'
   */

  /**
   * @typedef {String} KeySequenceId String describing a sequence of one or more key
   * combinations with whitespace separating key combinations in the sequence and '+'
   * separating keys within a key combination.
   */

  /**
   * @typedef {KeySequenceId|KeyCombinationId|KeySequenceId[]|KeyCombinationId[]} KeyEventExpression
   *          expression describing a keyboard event
   */

  /**
   * @typedef {Object.<ActionName, KeyEventExpression>} ActionKeyMap Mapping of ActionNames
   *          to KeyEventExpressions
   */

  /**
   * @typedef {Function(KeyboardEvent)} EventHandler Handler function that is called
   *          with the matching keyboard event
   */

  /**
   * @typedef {Object<ActionName, EventHandler>} EventHandlerMap Mapping of ActionNames
   *          to EventHandlers
   */

  /**
   * Registers the actions and handlers of a HotKeys component that has gained focus
   * @param {ActionKeyMap} actionNameToKeyMap Map of actions to key expressions
   * @param {EventHandlerMap} actionNameToHandlersMap Map of actions to handler functions
   * @returns {ComponentIndex} Unique component index to assign to the focused HotKeys
   *         component and passed back when handling a key event
   */
  handleFocus(actionNameToKeyMap = {}, actionNameToHandlersMap = {}) {
    if (this.flags.reset) {
      this.flags.reset = false;
    }

    const componentIndex = this.componentList.length;

    const { keyMap: hardSequenceKeyMap, handlers } = this._applyHardSequences(componentIndex, actionNameToKeyMap, actionNameToHandlersMap);

    this.componentList.unshift({
      keyMatcher: this._buildKeyMatcherMap({ ...actionNameToKeyMap, ...hardSequenceKeyMap }, componentIndex),
      handlers
    });

    return componentIndex;
  }

  _applyHardSequences(componentIndex, actionNameToKeyMap, actionNameToHandlersMap) {
    let counter = 0;

    return Object.keys(actionNameToHandlersMap).reduce((memo, actionNameOrKeyExpression) => {
      const actionNameIsInKeyMap = !!actionNameToKeyMap[actionNameOrKeyExpression];

      const handler = actionNameToHandlersMap[actionNameOrKeyExpression];

      if (!actionNameIsInKeyMap && KeySerializer.isValidKeySerialization(actionNameOrKeyExpression)) {
        const implicitActionName = `Component${componentIndex}HardSequence${counter++}`;

        memo.keyMap[implicitActionName] = actionNameOrKeyExpression;
        memo.handlers[implicitActionName] = handler;
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
   * @param {ComponentIndex} componentIndex Index of component registering the keyMap
   * @return {KeyEventMatcher}
   * @private
   */
  _buildKeyMatcherMap(actionNameToKeyMap, componentIndex) {
    const sequences = {};
    const combinations = {};

    Object.keys(actionNameToKeyMap).forEach((actionName) => {
      const keyMapOptions = arrayFrom(actionNameToKeyMap[actionName]);

      keyMapOptions.forEach((keyMapOption) => {
        const { keySequence, eventBitmapIndex } = function(){
          if (isObject(keyMapOption)) {
            const { sequence, action } = keyMapOption;

            return {
              keySequence: sequence,
              eventBitmapIndex: KeyEventBitmapIndex[action]
            };
          } else {
            return {
              keySequence: keyMapOption,
              eventBitmapIndex: KeyEventBitmapIndex.keypress
            }
          }
        }();

        const { sequence: _keyCombinations, id: keySequenceID } = KeySerializer.parseString(keySequence);

        if (_keyCombinations.length > 1) {
          if (_keyCombinations.length > this.longestKeySequence) {
            this.longestKeySequence = _keyCombinations.length;
          }

          sequences[keySequenceID] = {
            id: keySequenceID,
            componentIndex,
            sequence: _keyCombinations,
            size: _keyCombinations.length,
            eventBitmapIndex,
            actionName
          }

        } else {
          combinations[keySequenceID] = {
            componentIndex,
            ..._keyCombinations[0],
            eventBitmapIndex,
            actionName
          };
        }
      });
    });

    return { sequences, combinations };
  }

  /**
   * Handles when a component loses focus by resetting the internal state, ready to
   * receive the next tree of focused HotKeys components
   */
  handleBlur(){
    this._reset();
  }

  /**
   * Records a keydown keyboard event and matches it against the list of pre-registered
   * event handlers, calling the first matching handler with the highest priority if
   * one exists.
   *
   * This method is called many times as a keyboard event bubbles up through the React
   * render tree. The event is only registered the first time it is seen and results
   * of some calculations are cached. The event is matched against the handlers registered
   * at each component level, to ensure the proper handler declaration scoping.
   * @param {KeyboardEvent} event Event containing the key name and state
   * @param {ComponentIndex} index The index of the component that is currently handling
   *        the keyboard event as it bubbles towards the document root.
   */
  handleKeyDown(event, index) {
    const _key = normalizeKeyName(event.key);

    if (this._isNewKeyEvent(index)) {
      /**
       * We know that this is a new key event and not the same event bubbling up
       * the React render tree towards the document root
       */

      if (this._setIgnoreEventFlag(event)) {
        return;
      }

      const keyInCurrentCombination = !!this._getCurrentKeyCombination()[_key];

      if (keyInCurrentCombination || this.flags.keyCombinationIncludesKeyUp) {
        this._startNewKeyCombination(_key, KeyEventBitmapIndex.keydown);
      } else {
        this._addToCurrentKeyCombination(_key, KeyEventBitmapIndex.keydown);
      }
    }

    if (!this._shouldIgnoreEvent()) {
      this._callHandlerIfActionNotHandled(event, KeyEventBitmapIndex.keydown, index);

      this._recordComponentHasSeenEvent(index);
    }
  }

  /**
   * Records a keypress keyboard event and matches it against the list of pre-registered
   * event handlers, calling the first matching handler with the highest priority if
   * one exists.
   *
   * This method is called many times as a keyboard event bubbles up through the React
   * render tree. The event is only registered the first time it is seen and results
   * of some calculations are cached. The event is matched against the handlers registered
   * at each component level, to ensure the proper handler declaration scoping.
   * @param {KeyboardEvent} event Event containing the key name and state
   * @param {ComponentIndex} index The index of the component that is currently handling
   *        the keyboard event as it bubbles towards the document root.
   */
  handleKeyPress(event, index) {
    const _key = normalizeKeyName(event.key);

    if (this._isNewKeyEvent(index)) {
      /**
       * We know that this is a new key event and not the same event bubbling up
       * the React render tree towards the document root
       */

      if (this._setIgnoreEventFlag(event)) {
        return;
      }

      const keyCombination = this._getCurrentKeyCombination()[_key];

      const alreadySeenKeyInCurrentCombo = keyCombination && (keyCombination[KeyEventBitmapIndex.keypress] || keyCombination[KeyEventBitmapIndex.keyup]);

      if (alreadySeenKeyInCurrentCombo) {
        this._startNewKeyCombination(_key, KeyEventBitmapIndex.keypress)
      } else {
        this._addToCurrentKeyCombination(_key, KeyEventBitmapIndex.keypress);
      }
    }

    if (!this._shouldIgnoreEvent()) {
      this._callHandlerIfActionNotHandled(event, KeyEventBitmapIndex.keypress, index);

      this._recordComponentHasSeenEvent(index);
    }
  }

  /**
   * Records a keyup keyboard event and matches it against the list of pre-registered
   * event handlers, calling the first matching handler with the highest priority if
   * one exists.
   *
   * This method is called many times as a keyboard event bubbles up through the React
   * render tree. The event is only registered the first time it is seen and results
   * of some calculations are cached. The event is matched against the handlers registered
   * at each component level, to ensure the proper handler declaration scoping.
   * @param {KeyboardEvent} event Event containing the key name and state
   * @param {ComponentIndex} index The index of the component that is currently handling
   *        the keyboard event as it bubbles towards the document root.
   */
  handleKeyUp(event, index) {
    const _key = normalizeKeyName(event.key);

    if (this._isNewKeyEvent(index)) {
      /**
       * We know that this is a new key event and not the same event bubbling up
       * the React render tree towards the document root
       */

      if (this._setIgnoreEventFlag(event)) {
        return;
      }

      const keyCombination = this._getCurrentKeyCombination()[_key];

      const alreadySeenKeyInCurrentCombo = keyCombination && keyCombination[KeyEventBitmapIndex.keyup];

      if (alreadySeenKeyInCurrentCombo) {
        this._startNewKeyCombination(_key, KeyEventBitmapIndex.keyup);
      } else {
        this._addToCurrentKeyCombination(_key, KeyEventBitmapIndex.keyup);

        this.flags.keyCombinationIncludesKeyUp = true;
      }
    }

    if (!this._shouldIgnoreEvent()) {
      this._callHandlerIfActionNotHandled(event, KeyEventBitmapIndex.keyup, index);

      this._recordComponentHasSeenEvent(index);
    }
  }

  /**
   * @callback ignoreEventsConditionCallback
   * @param {KeyboardEvent) event Keyboard event
   * @return {Boolean} Whether to ignore the event
   */
  /**
   * Sets the function used to determine whether a keyboard event should be ignored.
   *
   * The function passed as an argument accepts the KeyboardEvent as its only argument.
   * @param {ignoreEventsConditionCallback} func Function to use to decide whether to
   *        ignore keyboard events
   */
  static setIgnoreEventsCondition(func){
    this.ignoreEventsCondition = func;
  }

  /**
   * Sets the ignoreEventsCondition function back to its original value
   */
  static resetIgnoreEventsCondition(){
    this.ignoreEventsCondition = ignoreEventsCondition;
  }

  /**
   * Whether to ignore a particular keyboard event
   * @param {KeyboardEvent} event Event that must be decided to ignore or not
   * @returns {Boolean} Whether to ignore the keyboard event
   */
  static ignoreEventsCondition(event) {
    return ignoreEventsCondition(event)
  }

  /**
   * Sets the ignoreEvent flag so that subsequent handlers of the same event
   * do not have to re-evaluate whether to ignore the event or not as it bubbles
   * up towards the document root
   * @param {KeyboardEvent} event The event to decide whether to ignore
   * @private
   */
  _setIgnoreEventFlag(event) {
    this.flags.ignoreEvent = this.constructor.ignoreEventsCondition(event);
  }

  /**
   * Whether KeyEventManager should ignore the event that is currently being handled
   * @returns {Boolean} Whether to ignore the event
   *
   * Do not override this method. Use setIgnoreEventsCondition() instead.
   * @private
   */
  _shouldIgnoreEvent() {
    return !!(this.flags && this.flags.ignoreEvent);
  }

  /**
   * Returns whether this is a previously seen event bubbling up to render tree towards
   * the document root, or whether it is a new event that has not previously been seen.
   * @param {ComponentIndex} componentIndex Index of the component currently handling
   *        the keyboard event
   * @return {Boolean} If the event has been seen before
   * @private
   */
  _isNewKeyEvent(componentIndex) {
    return this.eventPropagationHistory.previousComponentIndex <= componentIndex;
  }

  /**
   * Record that the component has seen the current event
   * @param {ComponentIndex} componentIndex Index of the component to record has seen
   *        the event
   * @private
   */
  _recordComponentHasSeenEvent(componentIndex) {
    this.eventPropagationHistory.previousComponentIndex = componentIndex;
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
      this.keyCombinationHistory.push({});
    }

    const keyCombination = this._getCurrentKeyCombination();

    if (!keyCombination[keyName]) {
      keyCombination[keyName] = KeyEventBitmapManager.newBitmap(bitmapIndex);
    } else {
      KeyEventBitmapManager.setBit(keyCombination[keyName], bitmapIndex);
    }
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
      return {};
    }
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
    if (this.keyCombinationHistory.length > this.longestKeySequence) {
      /**
       * We know the longest key sequence registered for the currently focused
       * components, so we don't need to keep a record of history longer than
       * that
       */
      this.keyCombinationHistory.shift();
    }

    this.keyCombinationHistory.push({
      [keyName]: KeyEventBitmapManager.newBitmap(eventBitmapIndex)
    });

    this.flags.keyCombinationIncludesKeyUp = false;
  }

  /**
   * Calls the first handler that matches the current key event if the action has not
   * already been handled in a more deeply nested component
   * @param {KeyboardEvent} event Keyboard event object to be passed to the handler
   * @param {KeyEventBitmapIndex} eventBitmapIndex The bitmap index of the current key event type
   * @param {ComponentIndex} componentIndex Index of the component that is currently handling
   *        the keyboard event
   * @private
   */
  _callHandlerIfActionNotHandled(event, eventBitmapIndex, componentIndex) {
    if (!this.eventPropagationHistory.actionHandled) {
      this._callHighestPriorityHandler(event, eventBitmapIndex, componentIndex);
    }
  }

  _callHighestPriorityHandler(event, eventBitmapIndex, componentIndex) {
    if (!this.keyMatcherList) {
      this.keyMatcherList = this._buildCumulativeKeyMatchers();
    }

    /**
     * @type {KeyEventMatcher}
     */
    const keyMatcher = indexFromEnd(this.keyMatcherList, componentIndex);

    if (!keyMatcher) {
      return;
    }

    const previousKeyMatch = this.eventPropagationHistory.previousKeyMatcher;

    if (!this._isNewKeyEvent(componentIndex) && previousKeyMatch && (keyMatcher.sequences[previousKeyMatch] || keyMatcher.combinations[previousKeyMatch] )) {
      /**
       * We know that if the previous matching key sequence is also present in the
       * current key map, then that key sequence must also be the highest priority
       * match for the current KeyEventMatcher and we do not need to recalculate
       */
      return keyMatcher[previousKeyMatch].actionName;
    }

    /**
     * We start by checking for matching key sequences, the longest first
     */
    let sequenceLength = this.keyCombinationHistory.length;

    while(sequenceLength > 0) {
      const keySequenceString = KeySerializer.sequence(indexFromEnd(this.keyCombinationHistory, sequenceLength));

      const matchingSequence = keyMatcher.sequences[keySequenceString];

      if (matchingSequence) {
        const handlerFound = this._callHandler(event, matchingSequence.actionName, componentIndex);

        if (handlerFound) {
          return;
        }
      }

      sequenceLength--;
    }

    /**
     * We then check for key combinations, longest first
     */
    const currentKeyCombination = this._getCurrentKeyCombination();

    const matchingCombinationId = keyMatcher.combinationsOrder.forEach((combinationId) => {
      const candidateKeyCombination = keyMatcher.combinations[combinationId];

      const candidateMatch = !Object.keys(candidateKeyCombination.keyDictionary).some((candidateKeyId) => {
        return !currentKeyCombination[candidateKeyId] || !currentKeyCombination[candidateKeyId][candidateKeyCombination.eventBitmapIndex];
      });

      if (candidateMatch) {
        const handlerFound = this._callHandler(event, candidateKeyCombination.actionName, componentIndex);

        if (handlerFound) {
          return;
        }
      }
    });

    if (matchingCombinationId) {
      this.eventPropagationHistory.previousKeyMatcher = matchingCombinationId;

      return keyMatcher.combinations[matchingCombinationId].actionName;
    } else {
      this.eventPropagationHistory.previousKeyMatcher = null;

      return null;
    }
  }

  _callHandler(event, matchingAction, componentIndex) {
    const handler = this._getHandlerMatching(matchingAction, componentIndex);

    if (handler) {
      handler(event);
      this.eventPropagationHistory.actionHandled = true;
    }

    return this.eventPropagationHistory.actionHandled;
  }

  /**
   * Returns the highest priority handler function registered to the specified action,
   * if one exists
   * @param {ActionName} actionName Name of the action to find the handler for
   * @param {ComponentIndex} componentIndex Index of the component to start looking
   *        for handlers
   * @returns {EventHandler} Highest priority handler function that matches the action
   * @private
   */
  _getHandlerMatching(actionName, componentIndex) {
    let counter = componentIndex;

    while(counter < this.componentList.length) {
      /**
       * @type {ComponentOptions}
       */
      const { handlers } = indexFromEnd(this.componentList, counter);
      const handler = handlers[actionName];

      if (handler) {
        return handler;
      }

      counter++;
    }

    return null;
  }

  /**
   * Builds a list of key matchers, each the result of a merge of the previous with
   * the corresponding component's.
   * @returns {KeyEventMatcher[]} List of cumulative key event matchers
   * @private
   */
  _buildCumulativeKeyMatchers() {

    return this.componentList.reduce((memo, { keyMatcher }) => {
      const previousKeyMap = memo[memo.length -1] || { sequences: {}, combinations: {} };

      const sequences = {
        ...previousKeyMap.sequences,
        ...keyMatcher.sequences
      };

      const combinations = {
        ...previousKeyMap.combinations,
        ...keyMatcher.combinations
      };

      /**
       * List of combinations sorted by the index of the component that registered
       * them and the number of keys involved in the combination. The combinations
       * with the lowest index (closest to the target of the key event) and the
       * most keys involved in the combination, are listed first
       * @type {KeyCombinationObject[]}
       */
      const sortedCombinations = orderBy(Object.values(combinations), [ [ 'componentIndex', 'asc' ] , [ 'size', 'desc' ] ]);

      memo.push({
        sequences,
        combinations,
        combinationsOrder: sortedCombinations.map(({ id }) => id)
      });

      return memo;
    }, []);
  }

}

export default KeyEventManager;
