import AbstractKeyEventStrategy from './AbstractKeyEventStrategy';
import KeyEventBitmapIndex from '../../const/KeyEventBitmapIndex';
import KeyEventSequenceIndex from '../../const/KeyEventSequenceIndex';
import KeyEventCounter from '../KeyEventCounter';
import hasKeyPressEvent from '../../helpers/resolving-handlers/hasKeyPressEvent';
import describeKeyEvent from '../../helpers/logging/describeKeyEvent';
import Configuration from '../Configuration';
import Logger from '../Logger';
import printComponent from '../../helpers/logging/printComponent';
import isUndefined from '../../utils/isUndefined';
import normalizeKeyName from '../../helpers/resolving-handlers/normalizeKeyName';

/**
 * Defines behaviour for dealing with key maps defined in focus-only HotKey components
 * @class
 */
class FocusOnlyKeyEventStrategy extends AbstractKeyEventStrategy {
  /********************************************************************************
   * Init & Reset
   ********************************************************************************/

  constructor(configuration = {}, keyEventManager) {
    /**
     * Set state that DOES get cleared on each new focus tree
     */
    super(configuration, keyEventManager);

    /**
     * State that doesn't get cleared on each new focus tree
     */

    /**
     * Unique identifier given to each focus tree - when the focus in the browser
     * changes, and a different tree of elements are focused, a new id is allocated
     * @typedef {Number} FocusTreeId
     */

    /**
     * Counter to keep track of what focus tree ID should be allocated next
     * @type {FocusTreeId}
     */
    this.focusTreeId = 0;

    /**
     * Record of the event currently bubbling up through the React application (and
     * beyond). This state is *not* cleared when the event propagation is finished
     * or when the component focus tree changes. It persists until it is overridden
     * by a new event, so that the global strategy is able to inspect the last
     * event seen by the React application, even after focus is lost.
     */
    this.currentEvent = {
      /**
       * The name of the key the event belongs to
       * @type {ReactKeyName}
       */
      key: null,

      /**
       * The event bitmap index of the type of key event
       * @type {KeyEventBitmapIndex}
       */
      type: null,

      handled: false
    };
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
    this.componentId = 0;

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
       * @type {ComponentId}
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

  /********************************************************************************
   * Registering key maps and handlers
   ********************************************************************************/

  /**
   * Registers the actions and handlers of a HotKeys component that has gained focus
   * @param {KeyMap} actionNameToKeyMap - Map of actions to key expressions
   * @param {HandlersMap} actionNameToHandlersMap - Map of actions to handler functions
   * @param {Object} options Hash of options that configure how the actions
   *        and handlers are associated and called.
   * @returns {[FocusTreeId, ComponentId]} The current focus tree's ID and a unique
   *         component ID to assign to the focused HotKeys component and passed back
   *         when handling a key event
   */
  addHotKeys(actionNameToKeyMap = {}, actionNameToHandlersMap = {}, options) {
    if (this.resetOnNextFocus || this.keyMaps) {
      /**
       * We know components have just lost focus or keymaps have already been built,
       * meaning we are either anticipating a new set of components to be focused or
       * we are receiving notice of a component being focused when we aren't expecting it.
       * In either case, the internal state needs to be reset.
       */
      this._reset();
      this.resetOnNextFocus = false;
    }

    this.componentId = this.componentList.length;

    this._addComponentToList(
      this.componentId,
      actionNameToKeyMap,
      actionNameToHandlersMap,
      options
    );

    this.logger.debug(
      `${this._logPrefix(this.componentId, { eventId: false })} Focused. \n`
    );

    this.logger.verbose(
      `${this._logPrefix(this.componentId, { eventId: false })} Component options:\n`,
      printComponent(this.componentList[this.componentId])
    );

    return [ this.focusTreeId, this.componentId ];
  }

  /**
   * Handles when a HotKeys component that is in focus updates its props and changes
   * either the keyMap or handlers prop value
   * @param {FocusTreeId} focusTreeId - The ID of the focus tree the component is part of.
   *        Used to identify (and ignore) stale updates.
   * @param {ComponentId} componentId - The component index of the component to
   *        update
   * @param {KeyMap} actionNameToKeyMap - Map of key sequences to action names
   * @param {HandlersMap} actionNameToHandlersMap - Map of action names to handler
   *        functions
   * @param {Object} options Hash of options that configure how the actions
   *        and handlers are associated and called.
   */
  updateHotKeys(focusTreeId, componentId, actionNameToKeyMap = {}, actionNameToHandlersMap = {}, options) {
    if (focusTreeId !== this.focusTreeId || !this.componentList[componentId]) {
      return;
    }

    this.componentList[componentId] = this._buildComponentOptions(
      componentId,
      actionNameToKeyMap,
      actionNameToHandlersMap,
      options
    );

    this.logger.debug(
      `${this._logPrefix(componentId, {focusTreeId, eventId: false})} Received new props.`,
    );

    this.logger.verbose(
      `${this._logPrefix(componentId, {focusTreeId, eventId: false})} Component options:\n`,
      printComponent(this.componentList[componentId])
    );
  }

  /**
   * Handles when a component loses focus by resetting the internal state, ready to
   * receive the next tree of focused HotKeys components
   * @param {FocusTreeId} focusTreeId - Id of focus tree component thinks it's
   *        apart of
   * @param {ComponentId} componentId - Index of component that is blurring
   * @returns {Boolean} Whether the component still has event propagation yet to handle
   */
  removeHotKeys(focusTreeId, componentId){
    if (!this.resetOnNextFocus) {
      this.resetOnNextFocus = true;
    }

    const outstandingEventPropagation = (this.eventPropagationState.previousComponentIndex + 1) < componentId;

    this.logger.debug(
      `${this._logPrefix(componentId, {focusTreeId, eventId: false})}`,
      `Lost focus${outstandingEventPropagation ? ' (Key event has yet to propagate through it)' : '' }.`
    );

    return outstandingEventPropagation;
  }

  /********************************************************************************
   * Recording key events
   ********************************************************************************/

  /**
   * Records a keydown keyboard event and matches it against the list of pre-registered
   * event handlers, calling the first matching handler with the highest priority if
   * one exists.
   *
   * This method is called many times as a keyboard event bubbles up through the React
   * render tree. The event is only registered the first time it is seen and results
   * of some calculations are cached. The event is matched against the handlers registered
   * at each component level, to ensure the proper handler declaration scoping.
   * @param {KeyboardEvent} event - Event containing the key name and state
   * @param {FocusTreeId} focusTreeId - Id of focus tree component thinks it's apart of
   * @param {ComponentId} componentId - The id of the component that is currently handling
   *        the keyboard event as it bubbles towards the document root.
   * @param {Object} options - Hash of options that configure how the event is handled.
   * @returns Whether the event was discarded because it was part of an old focus tree
   */
  handleKeydown(event, focusTreeId, componentId, options) {
    const _key = normalizeKeyName(event.key);

    if (focusTreeId !== this.focusTreeId) {
      this.logger.debug(
        `${this._logPrefix(componentId)}' Ignored '${_key}' keydown event because it had an old focus tree id: ${focusTreeId}.`
      );

      this._ignoreEvent(event, componentId);

      return true;
    }

    if (this._alreadyEstablishedShouldIgnoreEvent()) {
      this.logger.debug(
        `${this._logPrefix(componentId)} Ignored '${_key}' keydown event because ignoreEventsFilter rejected it.`
      );

      this._ignoreEvent(event, componentId);

      return false;
    }

    if (this._isNewKeyEvent(componentId)) {
      this._setNewEventParameters(event, KeyEventBitmapIndex.keydown);

      /**
       * We know that this is a new key event and not the same event bubbling up
       * the React render tree towards the document root, so perform actions specific
       * to the first time an event is seen
       */

      this._setIgnoreEventFlag(event, options);

      if (this._alreadyEstablishedShouldIgnoreEvent()) {
        this.logger.debug(
          `${this._logPrefix(componentId)} Ignored '${_key}' keydown event because ignoreEventsFilter rejected it.`
        );

        this._ignoreEvent(event, componentId);

        return false;
      }

      this.logger.debug(
        `${this._logPrefix(componentId)} New '${_key}' keydown event.`
      );

      const keyInCurrentCombination = !!this._getCurrentKeyState(_key);

      if (keyInCurrentCombination || this.keyCombinationIncludesKeyUp) {
        this._startNewKeyCombination(_key, KeyEventBitmapIndex.keydown, focusTreeId, componentId);
      } else {
        this._addToCurrentKeyCombination(_key, KeyEventBitmapIndex.keydown, focusTreeId, componentId);
      }
    }

    this._callHandlerIfActionNotHandled(event, _key, KeyEventBitmapIndex.keydown, componentId, focusTreeId);

    if (!hasKeyPressEvent(_key) && Configuration.option('simulateMissingKeyPressEvents')) {
      /**
       * If a key does not have a keypress event, we save the details of the keydown
       * event to simulate the keypress event, as the keydown event bubbles through
       * the last focus-only HotKeysComponent
       */
      event.persist();

      this.keypressEventsToSimulate.push({
        event, focusTreeId, componentId, options, key: _key
      });
    }

    if (this._isFocusTreeRoot(componentId)) {
      if (!this.keyEventManager.isGlobalListenersBound()) {
        this.simulatePendingKeyPressEvents(_key);
      }
      /**
       * else, we wait for keydown event to propagate through global strategy
       * before we simulate the keypress
       */
    }

    this._updateEventPropagationHistory(componentId);

    return false;
  }

  simulatePendingKeyPressEvents() {
    if (this.keypressEventsToSimulate.length > 0) {
      KeyEventCounter.incrementId();
    }

    this.keypressEventsToSimulate.forEach(({ event, focusTreeId, componentId, options }) => {
      this.handleKeypress(event, focusTreeId, componentId, options);
    });

    this.keypressEventsToSimulate = [];

    /**
     * If an event gets handled and causes a focus shift, then subsequent components
     * will ignore the event (including the root component) and the conditions to
     * reset the propagation state are never met - so we ensure that after we are done
     * simulating the keypress event, the propagation state is reset for the following
     * keyup
     */
    this._clearEventPropagationState();
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
   * @param {KeyboardEvent} event - Event containing the key name and state
   * @param {FocusTreeId} focusTreeId Id - of focus tree component thinks it's apart of
   * @param {ComponentId} componentId - The index of the component that is currently handling
   *        the keyboard event as it bubbles towards the document root.
   * @param {Object} options - Hash of options that configure how the event
   *        is handled.
   */
  handleKeypress(event, focusTreeId, componentId, options) {
    const _key = normalizeKeyName(event.key);

    if (focusTreeId !== this.focusTreeId) {
      this.logger.debug(
        `${this._logPrefix(componentId)} Ignored '${_key}' keypress event because it had an old focus tree id: ${focusTreeId}.`
      );

      this._ignoreEvent(event, componentId);

      return true;
    }

    if (this._alreadyEstablishedShouldIgnoreEvent()) {
      this.logger.debug(
        `${this._logPrefix(componentId)} Ignored '${_key}' keypress event because ignoreEventsFilter rejected it.`
      );

      this._ignoreEvent(event, componentId);

      return;
    }

    if (this._isNewKeyEvent(componentId)) {
      this._setNewEventParameters(event, KeyEventBitmapIndex.keypress);

      /**
       * We know that this is a new key event and not the same event bubbling up
       * the React render tree towards the document root, so perform actions specific
       * to the first time an event is seen
       */

      this._setIgnoreEventFlag(event, options);

      if (this._alreadyEstablishedShouldIgnoreEvent()) {
        this.logger.debug(
          `${this._logPrefix(componentId)} Ignored '${_key}' keypress event because ignoreEventsFilter rejected it.`
        );

        this._ignoreEvent(event, componentId);

        return;
      }

      this.logger.debug(
        `${this._logPrefix(componentId)} New '${_key}' keypress event.`
      );

      /**
       * Add new key event to key combination history
       */

      const keyCombination = this._getCurrentKeyState(_key);
      const alreadySeenKeyInCurrentCombo = keyCombination && (keyCombination[KeyEventSequenceIndex.current][KeyEventBitmapIndex.keypress] || keyCombination[KeyEventSequenceIndex.current][KeyEventBitmapIndex.keyup]);

      if (alreadySeenKeyInCurrentCombo) {
        this._startNewKeyCombination(_key, KeyEventBitmapIndex.keypres, focusTreeId, componentId)
      } else {
        this._addToCurrentKeyCombination(_key, KeyEventBitmapIndex.keypress, focusTreeId, componentId);
      }
    }

    this._callHandlerIfActionNotHandled(event, _key, KeyEventBitmapIndex.keypress, componentId, focusTreeId);

    this._updateEventPropagationHistory(componentId);
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
   * @param {FocusTreeId} focusTreeId Id of focus tree component thinks it's apart of
   * @param {ComponentId} componentId The index of the component that is currently handling
   *        the keyboard event as it bubbles towards the document root.
   * @param {Object} options Hash of options that configure how the event
   *        is handled.
   */
  handleKeyup(event, focusTreeId, componentId, options) {
    const _key = normalizeKeyName(event.key);

    if (focusTreeId !== this.focusTreeId) {
      this.logger.debug(
        `${this._logPrefix(componentId)} Ignored '${_key}' keyup event because it had an old focus tree id: ${focusTreeId}.`
      );

      this._ignoreEvent(event, componentId);

      return true;
    }

    if (this._alreadyEstablishedShouldIgnoreEvent()) {
      this.logger.debug(
        `${this._logPrefix(componentId)} Ignored '${_key}' keyup event because ignoreEventsFilter rejected it.`
      );

      this._ignoreEvent(event, componentId);

      return;
    }

    if (this._isNewKeyEvent(componentId)) {
      this._setNewEventParameters(event, KeyEventBitmapIndex.keyup);

      /**
       * We know that this is a new key event and not the same event bubbling up
       * the React render tree towards the document root, so perform actions specific
       * to the first time an event is seen
       */

      this._setIgnoreEventFlag(event, options);

      if (this._alreadyEstablishedShouldIgnoreEvent()) {
        this.logger.debug(
          `${this._logPrefix(componentId)} Ignored '${_key}' keyup event because ignoreEventsFilter rejected it.`
        );

        this._ignoreEvent(event, componentId);

        return;
      }

      this.logger.debug(
        `${this._logPrefix(componentId)} New '${_key}' keyup event.`
      );

      const keyCombination = this._getCurrentKeyState(_key);

      const alreadySeenKeyEventInCombo = keyCombination && keyCombination[KeyEventSequenceIndex.current][KeyEventBitmapIndex.keyup];

      if (alreadySeenKeyEventInCombo) {
        this._startNewKeyCombination(_key, KeyEventBitmapIndex.keyup, focusTreeId, componentId);
      } else {
        this._addToCurrentKeyCombination(_key, KeyEventBitmapIndex.keyup, focusTreeId, componentId);

        this.keyCombinationIncludesKeyUp = true;
      }
    }

    this._callHandlerIfActionNotHandled(event, _key, KeyEventBitmapIndex.keyup, componentId, focusTreeId);

    this._updateEventPropagationHistory(componentId);
  }

  _ignoreEvent(event, componentId) {
    if(this._stopEventPropagationAfterIgnoringIfEnabled(event, componentId)) {
      this._updateEventPropagationHistory(componentId, { forceReset: true });
    } else {
      this._updateEventPropagationHistory(componentId);
    }
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
   * @param {ComponentId} componentId Index of the component currently handling
   *        the keyboard event
   * @return {Boolean} If the event has been seen before
   * @private
   */
  _isNewKeyEvent(componentId) {
    return this.eventPropagationState.previousComponentIndex >= componentId;
  }

  _updateEventPropagationHistory(componentId, options = { forceReset: false }) {
    if (options.forceReset || this._isFocusTreeRoot(componentId)) {
      this._clearEventPropagationState();
    } else {
      this.eventPropagationState.previousComponentIndex = componentId;
    }
  }

  /**
   * Sets the ignoreEvent flag so that subsequent handlers of the same event
   * do not have to re-evaluate whether to ignore the event or not as it bubbles
   * up towards the document root
   * @param {KeyboardEvent} event The event to decide whether to ignore
   * @param {Object} options Options containing the function to use
   *        to set the ignoreEvent flag
   * @param {Function} options.ignoreEventsCondition Function used to for setting
   *        the ignoreEvent flag
   * @private
   */
  _setIgnoreEventFlag(event, options) {
    this.eventPropagationState.ignoreEvent = options.ignoreEventsCondition(event);
  }

  _isFocusTreeRoot(componentId) {
    return componentId >= this.componentList.length - 1;
  }

  _setNewEventParameters(event, type) {
    KeyEventCounter.incrementId();

    this.currentEvent = {
      key: event.key,
      type,
      handled: false
    };
  }

  _startNewKeyCombination(keyName, eventBitmapIndex, focusTreeId, componentId) {
    super._startNewKeyCombination(keyName, eventBitmapIndex);

    this.logger.verbose(
      `${this._logPrefix(componentId, {focusTreeId})} Started a new combination with '${keyName}'.`
    );

    this.logger.verbose(
      `${this._logPrefix(componentId, {focusTreeId})} Key history: ${printComponent(this.keyCombinationHistory)}.`
    );
  }

  _addToCurrentKeyCombination(keyName, eventBitmapIndex, focusTreeId, componentId) {
    super._addToCurrentKeyCombination(keyName, eventBitmapIndex);

    if (eventBitmapIndex === KeyEventBitmapIndex.keydown) {
      this.logger.verbose(
        `${this._logPrefix(componentId, {focusTreeId})} Added '${keyName}' to current combination: '${this._getCurrentKeyCombination().ids[0]}'.`
      );
    }

    this.logger.verbose(
      `${this._logPrefix(componentId, {focusTreeId})} Key history: ${printComponent(this.keyCombinationHistory)}.`
    );
  }

  /********************************************************************************
   * Matching and calling handlers
   ********************************************************************************/

  /**
   * Calls the first handler that matches the current key event if the action has not
   * already been handled in a more deeply nested component
   * @param {KeyboardEvent} event Keyboard event object to be passed to the handler
   * @param {NormalizedKeyName} keyName Normalized key name
   * @param {KeyEventBitmapIndex} eventBitmapIndex The bitmap index of the current key event type
   * @param {FocusTreeId} focusTreeId Id of focus tree component thinks it's apart of
   * @param {ComponentId} componentId Index of the component that is currently handling
   *        the keyboard event
   * @private
   */
  _callHandlerIfActionNotHandled(event, keyName, eventBitmapIndex, componentId, focusTreeId) {
    const eventName = describeKeyEvent(eventBitmapIndex);
    const combinationName = this._describeCurrentKeyCombination();

    if (this.keyMapEventBitmap[eventBitmapIndex]) {
      if (this.eventPropagationState.actionHandled) {
        this.logger.debug(
          `${this._logPrefix(componentId, {focusTreeId})} Ignored '${combinationName}' ${eventName} as it has already been handled.`
        );
      } else {
        this.logger.verbose(
          `${this._logPrefix(componentId, {focusTreeId})} Attempting to find action matching '${combinationName}' ${eventName} . . .`
        );

        const handlerWasCalled =
          this._callMatchingHandlerClosestToEventTarget(
            event,
            keyName,
            eventBitmapIndex,
            componentId
          );

        if (handlerWasCalled) {
          this.eventPropagationState.actionHandled = true;
          this.currentEvent.handled = true;
        }
      }
    } else {
      this.logger.verbose(
        `${this._logPrefix(componentId, {focusTreeId})} Ignored '${combinationName}' ${eventName} because it doesn't have any ${eventName} handlers.`
      );
    }
  }

  /********************************************************************************
   * Logging
   ********************************************************************************/

  _logPrefix(componentId, options = {}) {
    const logIcons = Logger.logIcons;
    const eventIcons = Logger.eventIcons;
    const componentIcons = Logger.componentIcons;

    let base = 'HotKeys (';

    if (options.focusTreeId !== false) {
      const focusTreeId = isUndefined(options.focusTreeId) ? this.focusTreeId : options.focusTreeId;
      base += `FT${focusTreeId}${logIcons[focusTreeId % logIcons.length]}-`;
    }

    if (options.eventId !== false) {
      const eventId = isUndefined(options.eventId) ? KeyEventCounter.getId() : options.eventId;

      base += `E${eventId}${eventIcons[eventId % eventIcons.length]}-`;
    }

    return base +`C${componentId}${componentIcons[componentId % componentIcons.length]}):`;
  }

}

export default FocusOnlyKeyEventStrategy;
