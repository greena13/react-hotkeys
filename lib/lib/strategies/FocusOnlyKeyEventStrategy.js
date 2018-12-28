import AbstractKeyEventStrategy from './AbstractKeyEventStrategy';
import KeyEventBitmapIndex from '../../const/KeyEventBitmapIndex';
import KeyEventCounter from '../KeyEventCounter';
import normalizeKeyName from '../normalizeKeyName';
import hasKeyPressEvent from '../hasKeyPressEvent';

class FocusOnlyKeyEventStrategy extends AbstractKeyEventStrategy {
  /**
   * Creates a new KeyEventManager instance. It is expected that only a single instance
   * will be used with a render tree.
   */
  constructor(configuration = {}) {
    super(configuration);

    this.focusTreeId = 0;

    this.currentEvent = {
      key: null,
      type: null,
      handled: false
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
  addHotKeys(actionNameToKeyMap = {}, actionNameToHandlersMap = {}, options) {
    if (this.resetOnNextFocus) {
      this._reset();
      this.resetOnNextFocus = false;
    }

    this.componentIndex = this.componentList.length;

    this._addComponentToList(
      this.componentIndex,
      actionNameToKeyMap,
      actionNameToHandlersMap,
      {
        ...options,
        keyMapEventBitmap: this.keyMapEventBitmap
      }
    );

    this.logger.debug(
      `${this._logPrefix(this.componentIndex)} Focused. \n`,
      this.componentList[this.componentIndex]
    );

    return [ this.focusTreeId, this.componentIndex ];
  }

  updateHotKeys(focusTreeId, componentIndex, actionNameToKeyMap = {}, actionNameToHandlersMap = {}, options) {
    if (focusTreeId !== this.focusTreeId || !this.componentList[componentIndex]) {
      return;
    }

    this.componentList[componentIndex] = this._buildComponentOptions(
      componentIndex,
      actionNameToKeyMap,
      actionNameToHandlersMap,
      {
        ...options,
        keyMapEventBitmap: this.keyMapEventBitmap
      }
    );

    this.logger.verbose(
      `${this._logPrefix(componentIndex, focusTreeId)} Received new props: \n`,
      this.componentList[componentIndex]
    );
  }

  /**
   * Handles when a component loses focus by resetting the internal state, ready to
   * receive the next tree of focused HotKeys components
   * @param {Number} focusTreeId Id of focus tree component thinks it's apart of
   * @param {ComponentIndex} componentIndex Index of component that is blurring
   * @returns {Boolean} Whether the component still has event propagation yet to handle
   */
  removeHotKeys(focusTreeId, componentIndex){
    if (!this.resetOnNextFocus) {
      this.resetOnNextFocus = true;
    }

    const outstandingEventPropagation = (this.eventPropagationState.previousComponentIndex + 1) < componentIndex;

    this.logger.verbose(`${this._logPrefix(componentIndex)} Lost focus${outstandingEventPropagation ? ' (Key event has yet to propagate through it)' : '' }.`);

    return outstandingEventPropagation;
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
   * Clears the internal state, wiping any history of key events and registered handlers
   * so they have no effect on the next tree of focused HotKeys components
   * @private
   */
  _reset() {
    super._reset();

    /**
     * Increase the unique ID associated with each unique focus tree
     * @type {number}
     */
    this.componentIndex = 0;
    this.focusTreeId += 1;

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
       * The name of the key the event belongs to
       */
      key: null,

      /**
       * The type of key event
       */
      type: null,

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

  _logPrefix(componentIndex, focusTreeId = this.focusTreeId) {
    const logIcons = this.constructor.logIcons;
    const eventIcons = this.constructor.eventIcons;
    const componentIcons = this.constructor.componentIcons;

    return `HotKeys (FT${focusTreeId}${logIcons[focusTreeId % logIcons.length]}-E${KeyEventCounter.getId()}${eventIcons[KeyEventCounter.getId() % eventIcons.length]}-C${componentIndex}${componentIcons[componentIndex % componentIcons.length]}):`
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
  handleKeydown(event, focusTreeId, componentIndex, options) {
    const _key = normalizeKeyName(event.key);

    if (focusTreeId !== this.focusTreeId) {
      this.logger.verbose(`${this._logPrefix(componentIndex, focusTreeId)} Ignored '${_key}' keydown event because it had an old focus tree id: ${focusTreeId}.`);
      return true;
    }

    if (this._alreadyEstablishedShouldIgnoreEvent()) {
      this._updateEventPropagationHistory(componentIndex);

      this.logger.debug(`${this._logPrefix(componentIndex, focusTreeId)} Ignored '${_key}' keydown event because ignoreEventsFilter rejected it.`);

      return false;
    }

    if (this._isNewKeyEvent(componentIndex)) {
      this._setNewEventParameters(event, KeyEventBitmapIndex.keydown);

      /**
       * We know that this is a new key event and not the same event bubbling up
       * the React render tree towards the document root, so perform actions specific
       * to the first time an event is seen
       */

      this._setIgnoreEventFlag(event, options);

      if (this._alreadyEstablishedShouldIgnoreEvent()) {
        this._updateEventPropagationHistory(componentIndex);

        this.logger.debug(`${this._logPrefix(componentIndex, focusTreeId)} Ignored '${_key}' keydown event because ignoreEventsFilter rejected it.`);

        return false;
      }

      this.logger.debug(`${this._logPrefix(componentIndex, focusTreeId)} New '${_key}' keydown event.`);

      const keyInCurrentCombination = !!this._getCurrentKeyCombination().keys[_key];

      if (keyInCurrentCombination || this.keyCombinationIncludesKeyUp) {
        this.logger.debug(`${this._logPrefix(componentIndex, focusTreeId)} Started a new combination with '${_key}'.`);

        this._startNewKeyCombination(_key, KeyEventBitmapIndex.keydown);
      } else {
        this._addToCurrentKeyCombination(_key, KeyEventBitmapIndex.keydown);

        this.logger.debug(`${this._logPrefix(componentIndex, focusTreeId)} Added '${_key}' to current combination: ${this._getCurrentKeyCombination().ids[0]}.`);
      }
    }

    this._callHandlerIfActionNotHandled(event, _key, KeyEventBitmapIndex.keydown, componentIndex, focusTreeId);

    if (!hasKeyPressEvent(_key)) {
      this.logger.debug(`${this._logPrefix(componentIndex, focusTreeId)} Simulating '${_key}' keypress event because '${_key}' doesn't natively have one.`);

      /**
       * If a key does not have a keypress event, we simulate one immediately after
       * the keydown event, to keep the behaviour consistent across all keys
       */
      this.handleKeypress(event, focusTreeId, componentIndex, options);
    } else {
      /**
       * The simulated keypress event will clear propagation history, so we only
       * need to do it here if we are not simulating the keypress event
       */
      this._updateEventPropagationHistory(componentIndex);
    }

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
  handleKeypress(event, focusTreeId, componentIndex, options) {
    const _key = normalizeKeyName(event.key);

    if (focusTreeId !== this.focusTreeId) {
      this.logger.verbose(`${this._logPrefix(componentIndex, focusTreeId)} Ignored '${_key}' keypress event because it had an old focus tree id: ${focusTreeId}.`);
      return true;
    }

    if (this._alreadyEstablishedShouldIgnoreEvent()) {
      this._updateEventPropagationHistory(componentIndex);

      this.logger.debug(`${this._logPrefix(componentIndex, focusTreeId)} Ignored '${_key}' keypress event because ignoreEventsFilter rejected it.`);

      return;
    }

    if (this._isNewKeyEvent(componentIndex)) {
      this._setNewEventParameters(event, KeyEventBitmapIndex.keypress);

      /**
       * We know that this is a new key event and not the same event bubbling up
       * the React render tree towards the document root, so perform actions specific
       * to the first time an event is seen
       */

      this._setIgnoreEventFlag(event, options);

      if (this._alreadyEstablishedShouldIgnoreEvent()) {
        this._updateEventPropagationHistory(componentIndex);

        this.logger.debug(`${this._logPrefix(componentIndex, focusTreeId)} Ignored '${_key}' keypress event because ignoreEventsFilter rejected it.`);

        return;
      }

      this.logger.debug(`${this._logPrefix(componentIndex, focusTreeId)} New '${_key}' keypress event.`);

      /**
       * Add new key event to key combination history
       */

      const keyCombination = this._getCurrentKeyCombination().keys[_key];
      const alreadySeenKeyInCurrentCombo = keyCombination && (keyCombination[KeyEventBitmapIndex.current][KeyEventBitmapIndex.keypress] || keyCombination[KeyEventBitmapIndex.current][KeyEventBitmapIndex.keyup]);

      if (alreadySeenKeyInCurrentCombo) {
        this.logger.debug(`${this._logPrefix(componentIndex, focusTreeId)} Started a new combination with '${_key}'.`);

        this._startNewKeyCombination(_key, KeyEventBitmapIndex.keypress)
      } else {
        this._addToCurrentKeyCombination(_key, KeyEventBitmapIndex.keypress);
      }
    }

    this._callHandlerIfActionNotHandled(event, _key, KeyEventBitmapIndex.keypress, componentIndex, focusTreeId);

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
  handleKeyup(event, focusTreeId, componentIndex, options) {
    const _key = normalizeKeyName(event.key);

    if (focusTreeId !== this.focusTreeId) {
      this.logger.verbose(`${this._logPrefix(componentIndex, focusTreeId)} Ignored '${_key}' keyup event because it had an old focus tree id: ${focusTreeId}.`);

      return true;
    }

    if (this._alreadyEstablishedShouldIgnoreEvent()) {
      this._updateEventPropagationHistory(componentIndex);

      this.logger.debug(`${this._logPrefix(componentIndex, focusTreeId)} Ignored '${_key}' keyup event because ignoreEventsFilter rejected it.`);

      return;
    }

    if (this._isNewKeyEvent(componentIndex)) {
      this._setNewEventParameters(event, KeyEventBitmapIndex.keyup);

      /**
       * We know that this is a new key event and not the same event bubbling up
       * the React render tree towards the document root, so perform actions specific
       * to the first time an event is seen
       */

      this._setIgnoreEventFlag(event, options);

      if (this._alreadyEstablishedShouldIgnoreEvent()) {
        this._updateEventPropagationHistory(componentIndex);

        this.logger.debug(`${this._logPrefix(componentIndex, focusTreeId)} Ignored '${_key}' keyup event because ignoreEventsFilter rejected it.`);
        return;
      }

      this.logger.debug(`${this._logPrefix(componentIndex, focusTreeId)} New '${_key}' keyup event.`);

      const keyCombination = this._getCurrentKeyCombination().keys[_key];

      const alreadySeenKeyEventInCombo = keyCombination && keyCombination[KeyEventBitmapIndex.current][KeyEventBitmapIndex.keyup];

      if (alreadySeenKeyEventInCombo) {
        this.logger.debug(`${this._logPrefix(componentIndex, focusTreeId)} Started a new combination with '${_key}'.`);

        this._startNewKeyCombination(_key, KeyEventBitmapIndex.keyup);
      } else {
        this._addToCurrentKeyCombination(_key, KeyEventBitmapIndex.keyup);

        this.keyCombinationIncludesKeyUp = true;
      }
    }

    this._callHandlerIfActionNotHandled(event, _key, KeyEventBitmapIndex.keyup, componentIndex, focusTreeId);

    this._updateEventPropagationHistory(componentIndex);
  }

  /**
   * Calls the first handler that matches the current key event if the action has not
   * already been handled in a more deeply nested component
   * @param {KeyboardEvent} event Keyboard event object to be passed to the handler
   * @param {NormalizedKeyName} keyName Normalized key name
   * @param {KeyEventBitmapIndex} eventBitmapIndex The bitmap index of the current key event type
   * @param {Number} focusTreeId Id of focus tree component thinks it's apart of
   * @param {ComponentIndex} componentIndex Index of the component that is currently handling
   *        the keyboard event
   * @private
   */
  _callHandlerIfActionNotHandled(event, keyName, eventBitmapIndex, componentIndex, focusTreeId) {
    const eventName = this.constructor._describeKeyEvent(eventBitmapIndex);
    const combinationName = this._describeCurrentKeyCombination();

    if (this.keyMapEventBitmap[eventBitmapIndex]) {
      if (this.eventPropagationState.actionHandled) {
        this.logger.verbose(`${this._logPrefix(componentIndex, focusTreeId)} Ignored '${combinationName}' ${eventName} as it has already been handled.`);
      } else {
        this.logger.verbose(`${this._logPrefix(componentIndex, focusTreeId)} Attempting to find action matching '${combinationName}' ${eventName} . . .`);

        const handlerWasCalled =
          this._callMatchingHandlerClosestToEventTarget(
            event,
            keyName,
            eventBitmapIndex,
            componentIndex
          );

        if (handlerWasCalled) {
          this.eventPropagationState.actionHandled = true;
          this.currentEvent.handled = true;
        }
      }
    } else {
      this.logger.verbose(`${this._logPrefix(componentIndex, focusTreeId)} Ignored '${combinationName}' ${eventName} because it doesn't have any ${eventName} handlers.`);
    }
  }

  _setNewEventParameters(event, type) {
    KeyEventCounter.incrementId();

    this.currentEvent = {
      key: event.key,
      type,
      handled: false
    };
  }

}

export default FocusOnlyKeyEventStrategy;
