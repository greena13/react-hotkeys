import arrayFrom from '../utils/array/arrayFrom';
import isObject from '../utils/object/isObject';
import KeyEventBitmapManager from './KeyEventBitmapManager';
import normalizeKeyName from './normalizeKeyName';
import KeySerializer from './KeySerializer';
import KeyEventBitmapIndex from '../const/KeyEventBitmapIndex';
import isEmpty from '../utils/collection/isEmpty';
import isUndefined from '../utils/isUndefined';
import resolveShiftedAlias from './resolveShiftedAlias';
import resolveKeyAlias from './resolveKeyAlias';
import indexFromEnd from '../utils/array/indexFromEnd';

/**
 * Provides a registry for keyboard sequences and events, and the handlers that should
 * be called when they are detected. Also contains the interface for processing and
 * matching keyboard events against its list of registered actions and handlers.
 * @class
 */
class KeyEventManager {
  /**
   * Creates a new KeyEventManager instance if one does not already exist or returns the
   * instance that already exists.
   * @returns {KeyEventManager} The key event manager instance
   */
  static getInstance() {
    if (!this.instance) {
      this.instance = new KeyEventManager();
    }

    return this.instance;
  }

  static clear() {
    delete this.instance;
  }

  /**
   * Creates a new KeyEventManager instance. It is expected that only a single instance
   * will be used with a render tree.
   */
  constructor() {
    this.focusTreeId = -1;

    this._reset();
  }

  /**
   * Clears the internal state, wiping and history of key events and registered handlers
   * so they have no effect on the next tree of focused HotKeys components
   * @private
   */
  _reset() {
    /**
     * Increase the unique ID associated with each unique focus tree
     * @type {number}
     */
    this.focusTreeId += 1;

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

    this._clearEventPropagationState();
  }

  /**
   * Clears the history that is maintained for the duration of a single keyboard event's
   * propagation up the React component tree towards the root component, so that the
   * next keyboard event starts with a clean state.
   * @private
   */
  _clearEventPropagationState() {
    /**
     * Object containing state of a key events propagation up the render tree towards
     * the document root
     * @type {{previousComponentIndex: number, actionHandled: boolean}}}
     */
    this.eventPropagationState = {
      /**
       * Index of the component last seen to be handling a key event
       * @type {ComponentIndex}
       */
      previousComponentIndex: 0,

      /**
       * Whether the keyboard event currently being handled has already matched a
       * handler function that has been called
       * @type {Boolean}
       */
      actionHandled: false,

      /**
       * Whether the keyboard event current being handled should be ignored
       * @type {Boolean}
       */
      ignoreEvent: false,
    };
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
   * @param {Object<String, any>} options Hash of options that configure how the actions
   *        and handlers are associated and called.
   * @returns {ComponentIndex} Unique component index to assign to the focused HotKeys
   *         component and passed back when handling a key event
   */
  handleFocus(actionNameToKeyMap = {}, actionNameToHandlersMap = {}, options) {
    if (this.resetOnNextFocus) {
      this._reset();
      this.resetOnNextFocus = false;
    }

    const componentIndex = this.componentList.length;
    const componentOptions = this._buildComponentOptions(componentIndex, actionNameToKeyMap, actionNameToHandlersMap, options);


    this.componentList.push(componentOptions);

    return [ this.focusTreeId, componentIndex ];
  }

  _buildComponentOptions(componentIndex, actionNameToKeyMap, actionNameToHandlersMap, options) {
    const { keyMap: hardSequenceKeyMap, handlers } = this._applyHardSequences(componentIndex, actionNameToKeyMap, actionNameToHandlersMap);

    return {
      actions: this._buildKeyMatcherMap({ ...actionNameToKeyMap, ...hardSequenceKeyMap }, componentIndex, options),
      handlers
    };
  }

  updateComponent(focusTreeId, componentIndex, actionNameToKeyMap = {}, actionNameToHandlersMap = {}, options) {
    if (focusTreeId !== this.focusTreeId || !this.componentList[componentIndex]) {
      return;
    }

    this.componentList[componentIndex] = this._buildComponentOptions(componentIndex, actionNameToKeyMap, actionNameToHandlersMap, options);
  }

  _applyHardSequences(componentIndex, actionNameToKeyMap, actionNameToHandlersMap) {
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
   * @param {ComponentIndex} componentIndex Index of component registering the keyMap
   * @param {Object<String, any>} options Hash of options that configure how the key
   *        map is built.
   * @param {String} options.defaultKeyEvent The default key event to use for any action
   *        that does not explicitly define one.
   * @return {KeyEventMatcher}
   * @private
   */
  _buildKeyMatcherMap(actionNameToKeyMap, componentIndex, options) {
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
        this.keyMapEventBitmap[eventBitmapIndex] = true;

        if (!keyMapMemo[actionName]) {
          keyMapMemo[actionName] = [];
        }

        keyMapMemo[actionName].push({
          prefix: sequence.prefix,
          sequenceLength: sequence.size,
          ...combination,
        });
      });

      return keyMapMemo;
    }, {});
  }

  /**
   * Handles when a component loses focus by resetting the internal state, ready to
   * receive the next tree of focused HotKeys components
   * @param {Number} focusTreeId Id of focus tree component thinks it's apart of
   * @param {ComponentIndex} componentIndex Index of component that is blurring
   * @returns {Boolean} Whether the component still has event propagation yet to handle
   */
  handleBlur(focusTreeId, componentIndex){
    if (!this.resetOnNextFocus) {
      this.resetOnNextFocus = true;
    }

    return (this.eventPropagationState.previousComponentIndex + 1) < componentIndex;
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
   * @param {Number} focusTreeId Id of focus tree component thinks it's apart of
   * @param {ComponentIndex} componentIndex The index of the component that is currently handling
   *        the keyboard event as it bubbles towards the document root.
   * @param {Object<String, any>} options Hash of options that configure how the event
   *        is handled.
   * @returns Whether the event was discarded because it was part of an old focus tree
   */
  handleKeyDown(event, focusTreeId, componentIndex, options) {
    if (focusTreeId !== this.focusTreeId) {
      return true;
    }

    if (this._alreadyEstablishedShouldIgnoreEvent()) {
      this._updateEventPropagationHistory(componentIndex);

      return false;
    }

    const _key = normalizeKeyName(event.key);

    if (this._isNewKeyEvent(componentIndex)) {
      /**
       * We know that this is a new key event and not the same event bubbling up
       * the React render tree towards the document root, so perform actions specific
       * to the first time an event is seen
       */

      this._setIgnoreEventFlag(event, options);

      if (this._alreadyEstablishedShouldIgnoreEvent()) {
        this._updateEventPropagationHistory(componentIndex);
        return false;
      }

      const keyInCurrentCombination = !!this._getCurrentKeyCombination().keys[_key];

      if (keyInCurrentCombination || this.keyCombinationIncludesKeyUp) {
        this._startNewKeyCombination(_key, KeyEventBitmapIndex.keydown);
      } else {
        this._addToCurrentKeyCombination(_key, KeyEventBitmapIndex.keydown);
      }
    }

    this._callHandlerIfActionNotHandled(event, _key, KeyEventBitmapIndex.keydown, componentIndex);

    this._updateEventPropagationHistory(componentIndex);

    return false;
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
   * @param {Number} focusTreeId Id of focus tree component thinks it's apart of
   * @param {ComponentIndex} componentIndex The index of the component that is currently handling
   *        the keyboard event as it bubbles towards the document root.
   * @param {Object<String, any>} options Hash of options that configure how the event
   *        is handled.
   */
  handleKeyPress(event, focusTreeId, componentIndex, options) {
    if (focusTreeId !== this.focusTreeId) {
      return true;
    }

    if (this._alreadyEstablishedShouldIgnoreEvent()) {
      this._updateEventPropagationHistory(componentIndex);
      return;
    }

    const _key = normalizeKeyName(event.key);

    if (this._isNewKeyEvent(componentIndex)) {

      /**
       * We know that this is a new key event and not the same event bubbling up
       * the React render tree towards the document root, so perform actions specific
       * to the first time an event is seen
       */

      this._setIgnoreEventFlag(event, options);

      if (this._alreadyEstablishedShouldIgnoreEvent()) {
        this._updateEventPropagationHistory(componentIndex);
        return;
      }

      /**
       * Add new key event to key combination history
       */

      const keyCombination = this._getCurrentKeyCombination().keys[_key];
      const alreadySeenKeyInCurrentCombo = keyCombination && (keyCombination[KeyEventBitmapIndex.current][KeyEventBitmapIndex.keypress] || keyCombination[KeyEventBitmapIndex.current][KeyEventBitmapIndex.keyup]);

      if (alreadySeenKeyInCurrentCombo) {
        this._startNewKeyCombination(_key, KeyEventBitmapIndex.keypress)
      } else {
        this._addToCurrentKeyCombination(_key, KeyEventBitmapIndex.keypress);
      }
    }

    this._callHandlerIfActionNotHandled(event, _key, KeyEventBitmapIndex.keypress, componentIndex);

    this._updateEventPropagationHistory(componentIndex);
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
   * @param {Number} focusTreeId Id of focus tree component thinks it's apart of
   * @param {ComponentIndex} componentIndex The index of the component that is currently handling
   *        the keyboard event as it bubbles towards the document root.
   * @param {Object<String, any>} options Hash of options that configure how the event
   *        is handled.
   * @return {Number} Length of component list so calling HotKeys component can establish
   *        if it's the last one in the list, or not
   */
  handleKeyUp(event, focusTreeId, componentIndex, options) {
    if (focusTreeId !== this.focusTreeId) {
      return true;
    }

    if (this._alreadyEstablishedShouldIgnoreEvent()) {
      this._updateEventPropagationHistory(componentIndex);
      return;
    }

    const _key = normalizeKeyName(event.key);

    if (this._isNewKeyEvent(componentIndex)) {
      /**
       * We know that this is a new key event and not the same event bubbling up
       * the React render tree towards the document root, so perform actions specific
       * to the first time an event is seen
       */

      this._setIgnoreEventFlag(event, options);

      if (this._alreadyEstablishedShouldIgnoreEvent()) {
        this._updateEventPropagationHistory(componentIndex);
        return;
      }

      const keyCombination = this._getCurrentKeyCombination().keys[_key];

      const alreadySeenKeyInCurrentCombo = keyCombination && keyCombination[KeyEventBitmapIndex.current][KeyEventBitmapIndex.keyup];

      if (alreadySeenKeyInCurrentCombo) {
        this._startNewKeyCombination(_key, KeyEventBitmapIndex.keyup);
      } else {
        this._addToCurrentKeyCombination(_key, KeyEventBitmapIndex.keyup);

        this.keyCombinationIncludesKeyUp = true;
      }
    }

    this._callHandlerIfActionNotHandled(event, _key, KeyEventBitmapIndex.keyup, componentIndex);

    this._updateEventPropagationHistory(componentIndex);
  }

  _updateEventPropagationHistory(componentIndex) {
    if (this._isFocusTreeRoot(componentIndex)) {
      this._clearEventPropagationState();
    } else {
      this.eventPropagationState.previousComponentIndex = componentIndex;
    }
  }

  _isFocusTreeRoot(componentIndex) {
    return componentIndex >= this.componentList.length - 1;
  }

  /**
   * Sets the ignoreEvent flag so that subsequent handlers of the same event
   * do not have to re-evaluate whether to ignore the event or not as it bubbles
   * up towards the document root
   * @param {KeyboardEvent} event The event to decide whether to ignore
   * @param {Object<String, any>} options Options containing the function to use
   *        to set the ignoreEvent flag
   * @param {Function} options.ignoreEventsCondition Function used to for setting
   *        the ignoreEvent flag
   * @private
   */
  _setIgnoreEventFlag(event, options) {
    this.eventPropagationState.ignoreEvent = options.ignoreEventsCondition(event);
  }

  /**
   * Whether KeyEventManager should ignore the event that is currently being handled
   * @returns {Boolean} Whether to ignore the event
   *
   * Do not override this method. Use setIgnoreEventsCondition() instead.
   * @private
   */
  _alreadyEstablishedShouldIgnoreEvent() {
    return this.eventPropagationState.ignoreEvent;
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
    return this.eventPropagationState.previousComponentIndex >= componentIndex;
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

  /**
   * Calls the first handler that matches the current key event if the action has not
   * already been handled in a more deeply nested component
   * @param {KeyboardEvent} event Keyboard event object to be passed to the handler
   * @param {NormalizedKeyName} keyName Normalized key name
   * @param {KeyEventBitmapIndex} eventBitmapIndex The bitmap index of the current key event type
   * @param {ComponentIndex} componentIndex Index of the component that is currently handling
   *        the keyboard event
   * @private
   */
  _callHandlerIfActionNotHandled(event, keyName, eventBitmapIndex, componentIndex) {
    if (this.keyMapEventBitmap[eventBitmapIndex] && !this.eventPropagationState.actionHandled) {
      this._callMatchingHandlerClosestToEventTarget(event, keyName, eventBitmapIndex, componentIndex);
    }
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
       * Component currently handing key event has handlers that have not yet been
       * associated with a key sequence. We need to continue walking up the component
       * tree, in search of the matching actions that describe the applicable key
       * sequence.
       */
      if (this.searchIndex < componentIndex) {
        this.searchIndex = componentIndex;
      }

      while (this.searchIndex < this.componentList.length && unmatchedHandlersCount > 0) {
        const { handlers, actions } = this.componentList[this.searchIndex];


        /**
         * Add current component's handlers to the handlersDictionary so we know
         * where what component has defined them
         */
        Object.keys(handlers).forEach((actionName) => {
          if (!this.handlersDictionary[actionName]) {
            this.handlersDictionary[actionName] = [];
          }

          this.handlersDictionary[actionName].push(this.searchIndex);
        });

        /**
         * Iterate over a component's actions, matching them to the current component's
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
            combinationMatcher.handler(event);
            this.eventPropagationState.actionHandled = true;

            return;
          }

          combinationIndex++;
        }

      }

      sequenceLengthCounter--;
    }
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
    const combinationIncludesShift = keyState.keys['Shift'];

    const candidateKeyNames = function(){
      if (combinationIncludesShift) {
        return resolveShiftedAlias(candidateKeyName);
      } else {
        return resolveKeyAlias(candidateKeyName);
      }
    }();

    return candidateKeyNames.find((keyName) => keyState.keys[keyName]);
  }
}

export default KeyEventManager;
