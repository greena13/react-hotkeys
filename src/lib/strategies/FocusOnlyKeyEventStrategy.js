import AbstractKeyEventStrategy from './AbstractKeyEventStrategy';
import KeyEventRecordIndex from '../../const/KeyEventRecordIndex';
import KeyEventCounter from '../KeyEventCounter';
import describeKeyEventType from '../../helpers/logging/describeKeyEventType';
import Configuration from '../Configuration';
import Logger from '../Logger';
import printComponent from '../../helpers/logging/printComponent';
import isUndefined from '../../utils/isUndefined';
import getKeyName from '../../helpers/resolving-handlers/getKeyName';
import isCmdKey from '../../helpers/parsing-key-maps/isCmdKey';
import keyIsCurrentlyTriggeringEvent from '../../helpers/parsing-key-maps/keyIsCurrentlyTriggeringEvent';
import describeKeyEvent from '../../helpers/logging/describeKeyEvent';
import EventResponse from '../../const/EventResponse';
import KeyEventRecordState from '../../const/KeyEventRecordState';

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
       * The event record index of the type of key event
       * @type {KeyEventRecordIndex}
       */
      type: null,

      handled: false,

      ignored: false,
    };
  }

  /**
   * Clears the internal state, wiping any history of key events and registered handlers
   * so they have no effect on the next tree of focused HotKeys components
   * @private
   */
  _reset() {
    super._reset();

    this.keypressEventsToSimulate = [];

    /**
     * Increase the unique ID associated with each unique focus tree
     * @type {number}
     */
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
     * @type {{previousComponentPosition: number, actionHandled: boolean}}}
     */
    this.eventPropagationState = {
      /**
       * Index of the component last seen to be handling a key event
       * @type {ComponentId}
       */
      previousComponentPosition: -1,

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

      /**
       * Whether the keyboard event current being handled should be observed, even
       * if matches the ignoreEventCondition
       * @type {Boolean}
       */
      forceObserveEvent: false,

      /**
       * Whether the strategy is in the process of stopping propagation and tidying
       * up
       */
      stopping: false
    };
  }

  /********************************************************************************
   * Registering key maps and handlers
   ********************************************************************************/

  /**
   * Registers the actions and handlers of a HotKeys component that has gained focus
   * @param {ComponentId} componentId - Id of the component that the keyMap belongs to
   * @param {KeyMap} actionNameToKeyMap - Map of actions to key expressions
   * @param {HandlersMap} actionNameToHandlersMap - Map of actions to handler functions
   * @param {Object} options Hash of options that configure how the actions
   *        and handlers are associated and called.
   * @returns {FocusTreeId|undefined} The current focus tree's ID or undefined if the
   *        the <tt>componentId</tt> has already been registered (shouldn't normally
   *        occur).
   */
  enableHotKeys(componentId, actionNameToKeyMap = {}, actionNameToHandlersMap = {}, options) {
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

    if (this._getComponent(componentId)) {
      /**
       * The <tt>componentId</tt> has already been registered - this occurs when the
       * same component has somehow managed to be focused twice, without being blurred
       * in between.
       *
       * @see https://github.com/greena13/react-hotkeys/issues/173
       */
      return undefined;
    }

    this._addComponentToList(
      componentId,
      actionNameToKeyMap,
      actionNameToHandlersMap,
      options
    );

    this.logger.debug(
      this._logPrefix(componentId, { eventId: false }),
      'Focused. \n'
    );

    const component = this._getComponent(componentId);

    this.logger.verbose(
      this._logPrefix(componentId, { eventId: false }),
      'Component options:\n',
      printComponent(component)
    );

    return this.focusTreeId;
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
  updateEnabledHotKeys(focusTreeId, componentId, actionNameToKeyMap = {}, actionNameToHandlersMap = {}, options) {
    const componentPosition = this._getComponentPosition(componentId);

    if (focusTreeId !== this.focusTreeId || isUndefined(componentPosition)) {
      return;
    }

    this.componentList[componentPosition] = this._buildComponentOptions(
      componentId,
      actionNameToKeyMap,
      actionNameToHandlersMap,
      options
    );

    this.logger.debug(
      this._logPrefix(componentId, {focusTreeId, eventId: false}),
      'Received new props.',
    );

    /**
     * Reset handler resolution state
     */
    this._initHandlerResolutionState();

    const component = this._getComponent(componentId);

    this.logger.verbose(
      this._logPrefix(componentId, {focusTreeId, eventId: false}),
      'Component options:\n',
      printComponent(component)
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
  disableHotKeys(focusTreeId, componentId){
    if (!this.resetOnNextFocus) {
      this.resetOnNextFocus = true;
    }

    const componentPosition = this._getComponentPosition(componentId);

    const previousComponentPosition = this.eventPropagationState.previousComponentPosition;
    const outstandingEventPropagation = previousComponentPosition !== -1 && (previousComponentPosition + 1) < componentPosition;

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
   * @typedef {KeyboardEvent} SyntheticKeyboardEvent
   * @property {Function} persist
   */

  /**
   * Records a keydown keyboard event and matches it against the list of pre-registered
   * event handlers, calling the first matching handler with the highest priority if
   * one exists.
   *
   * This method is called many times as a keyboard event bubbles up through the React
   * render tree. The event is only registered the first time it is seen and results
   * of some calculations are cached. The event is matched against the handlers registered
   * at each component level, to ensure the proper handler declaration scoping.
   * @param {SyntheticKeyboardEvent} event - Event containing the key name and state
   * @param {FocusTreeId} focusTreeId - Id of focus tree component thinks it's apart of
   * @param {ComponentId} componentId - The id of the component that is currently handling
   *        the keyboard event as it bubbles towards the document root.
   * @param {Object} options - Hash of options that configure how the event is handled.
   * @returns Whether the event was discarded because it was part of an old focus tree
   */
  handleKeydown(event, focusTreeId, componentId, options = {}) {
    const _key = getKeyName(event);

    if (event.repeat && Configuration.option('ignoreRepeatedEventsWhenKeyHeldDown')) {
      this.logger.debug(
        this._logPrefix(componentId),
        `Ignored repeated ${describeKeyEvent(event, _key, KeyEventRecordIndex.keydown)} event.`
      );

      this._ignoreEvent(event, componentId);

      return true;
    }

    if (focusTreeId !== this.focusTreeId) {
      this.logger.debug(
        this._logPrefix(componentId),
        `Ignored ${describeKeyEvent(event, _key, KeyEventRecordIndex.keydown)} event because it had an old focus tree id: ${focusTreeId}.`
      );

      this._ignoreEvent(event, componentId);

      return true;
    }

    const responseAction = this._howToHandleKeyEvent(event,
      focusTreeId,
      componentId,
      _key,
      options,
      KeyEventRecordIndex.keydown
    );

    /**
     * We need to record the position of the component that is currently dealing with
     * the event, in case the component defines a handler for that event that changes
     * the focus or content in the render tree, causing the component to be de-registered
     * and have its position lost
     */
    const componentPosition = this._getComponentPosition(componentId);

    if (responseAction === EventResponse.handled) {
      const keyInCurrentCombination = !!this._getCurrentKeyState(_key);

      const keyEventState = this._stateFromEvent(event);

      if (keyInCurrentCombination || this.keyCombinationIncludesKeyUp) {
        this._startAndLogNewKeyCombination(
          _key,
          KeyEventRecordIndex.keydown,
          focusTreeId,
          componentId,
          keyEventState
        );
      } else {
        this._addToAndLogCurrentKeyCombination(
          _key,
          KeyEventRecordIndex.keydown,
          focusTreeId,
          componentId,
          keyEventState
        );
      }

      this._callHandlerIfActionNotHandled(event, _key, KeyEventRecordIndex.keydown, componentId, focusTreeId);
    }

    this._simulateKeyPressesMissingFromBrowser(event, _key, focusTreeId, componentId, options);

    this._updateEventPropagationHistory(componentId, componentPosition);

    return false;
  }

  _howToHandleKeyEvent(event, focusTreeId, componentId, key, options, keyEventRecordIndex){
    if (this._shouldIgnoreEvent()) {
      this.logger.debug(
        this._logPrefix(componentId),
        `Ignored ${describeKeyEvent(event, key, keyEventRecordIndex)} event because ignoreEventsFilter rejected it.`
      );

      this._ignoreEvent(event, componentId);

      return EventResponse.ignored;
    }

    if (this._isNewKeyEvent(componentId)) {
      this._setNewEventParameters(event, keyEventRecordIndex);

      /**
       * We know that this is a new key event and not the same event bubbling up
       * the React render tree towards the document root, so perform actions specific
       * to the first time an event is seen
       */

      this._setIgnoreEventFlag(event, options);

      if (this._shouldIgnoreEvent()) {
        this.logger.debug(
          this._logPrefix(componentId),
          `Ignored ${describeKeyEvent(event, key, keyEventRecordIndex)} event because ignoreEventsFilter rejected it.`
        );

        this._ignoreEvent(event, componentId);

        return EventResponse.ignored;
      }

      this.logger.debug(
        this._logPrefix(componentId),
        `New ${describeKeyEvent(event, key, keyEventRecordIndex)} event.`
      );

      this._checkForModifierFlagDiscrepancies(event, key, keyEventRecordIndex);
    }

    return EventResponse.handled;
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
   * @return {Boolean} Whether the HotKeys component should discard its current focus
   *        tree Id, because it belongs to an old focus tree.
   */
  handleKeypress(event, focusTreeId, componentId, options) {
    const _key = getKeyName(event);

    if (event.repeat && Configuration.option('ignoreRepeatedEventsWhenKeyHeldDown')) {
        this.logger.debug(
          this._logPrefix(componentId),
          `Ignored repeated ${describeKeyEvent(event, _key, KeyEventRecordIndex.keypress)} event.`
        );

        this._ignoreEvent(event, componentId);

        return true;
    }

    if (this._alreadySimulatedEvent(KeyEventRecordIndex.keypress, _key)) {
      this.logger.debug(
        this._logPrefix(componentId),
        `Ignored ${describeKeyEvent(event, _key, KeyEventRecordIndex.keypress)} as it was not expected, and has already been simulated.`
      );

      this._ignoreEvent(event, componentId);

      return true;
    }

    const shouldDiscardFocusTreeId = focusTreeId !== this.focusTreeId;

    /**
     * We first decide if the keypress event should be handled (to ensure the correct
     * order of logging statements)
     */
    const responseAction = this._howToHandleKeyEvent(event,
      focusTreeId,
      componentId,
      _key,
      options,
      KeyEventRecordIndex.keypress
    );

    if (this._isNewKeyEvent(componentId) && this._getCurrentKeyState(_key)) {
      this._addToAndLogCurrentKeyCombination(
        _key,
        KeyEventRecordIndex.keypress,
        focusTreeId,
        componentId,
        this._stateFromEvent(event)
      );
    }

    /**
     * We need to record the position of the component that is currently dealing with
     * the event, in case the component defines a handler for that event that changes
     * the focus or content in the render tree, causing the component to be de-registered
     * and have its position lost
     */
    const componentPosition = this._getComponentPosition(componentId);

    /**
     * We attempt to find a handler of the event, only if it has not already
     * been handled and should not be ignored
     */
    if (responseAction === EventResponse.handled) {
      this._callHandlerIfActionNotHandled(
        event,
        _key,
        KeyEventRecordIndex.keypress,
        componentId,
        focusTreeId
      );
    }

    this._updateEventPropagationHistory(componentId, componentPosition);

    return shouldDiscardFocusTreeId;
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
   * @return {Boolean} Whether HotKeys component should discard its current focusTreeId
   *        because it's stale (part of an old focus tree)
   */
  handleKeyup(event, focusTreeId, componentId, options) {
    const _key = getKeyName(event);

    if (this._alreadySimulatedEvent(KeyEventRecordIndex.keyup, _key)) {
      this.logger.debug(
        this._logPrefix(componentId),
        `Ignored ${describeKeyEvent(event, _key, KeyEventRecordIndex.keyup)} as it was not expected, and has already been simulated.`
      );

      this._ignoreEvent(event, componentId);

      return true;
    }

    const shouldDiscardFocusId = focusTreeId !== this.focusTreeId;

    /**
     * We first decide if the keyup event should be handled (to ensure the correct
     * order of logging statements)
     */
    const responseAction = this._howToHandleKeyEvent(event,
      focusTreeId,
      componentId,
      _key,
      options,
      KeyEventRecordIndex.keyup
    );

    /**
     * We then add the keyup to our current combination - regardless of whether
     * it's to be handled or not. We need to do this to ensure that if a handler
     * function changes focus to a context that ignored events, the keyup event
     * is not lost (leaving react hotkeys thinking the key is still pressed).
     */
    if (this._isNewKeyEvent(componentId) && this._getCurrentKeyState(_key)) {
      this._addToAndLogCurrentKeyCombination(
        _key,
        KeyEventRecordIndex.keyup,
        focusTreeId,
        componentId,
        this._stateFromEvent(event)
      );
    }

    /**
     * We need to record the position of the component that is currently dealing with
     * the event, in case the component defines a handler for that event that changes
     * the focus or content in the render tree, causing the component to be de-registered
     * and have its position lost
     */
    const componentPosition = this._getComponentPosition(componentId);

    /**
     * We attempt to find a handler of the event, only if it has not already
     * been handled and should not be ignored
     */
    if (responseAction === EventResponse.handled) {
      this._callHandlerIfActionNotHandled(event, _key, KeyEventRecordIndex.keyup, componentId, focusTreeId);
    }

    /**
     * We simulate any hidden keyup events hidden by the command key, regardless
     * of whether the event should be ignored or not
     */
    this._simulateKeyUpEventsHiddenByCmd(event, _key, focusTreeId, componentId, options);

    this._updateEventPropagationHistory(componentId, componentPosition);

    return shouldDiscardFocusId;
  }

  /**
   * Closes any hanging key combinations that have not received the key event indicated
   * by recordIndex.
   * @param {KeyName} keyName The name of the key whose state should be updated if it
   *        is currently set to keydown or keypress.
   * @param {KeyEventRecordIndex} recordIndex Index of key event to move the key state
   *        up to.
   */
  closeHangingKeyCombination(keyName, recordIndex) {
    const keyState = this._getCurrentKeyState(keyName);

    if (keyIsCurrentlyTriggeringEvent(keyState, KeyEventRecordIndex.keydown) &&
      !keyIsCurrentlyTriggeringEvent(keyState, recordIndex)) {

      /**
       * If the key is in the current combination and recorded as still being pressed
       * down (as either keydown or keypress), then we update the state
       * to keypress or keyup (depending on the value of recordIndex).
       */
      this._addToCurrentKeyCombination(keyName, recordIndex, KeyEventRecordState.simulated);
    }
  }

  _simulateKeyPressesMissingFromBrowser(event, key, focusTreeId, componentId, options){
    this._handleEventSimulation(
      'keypressEventsToSimulate',
      'simulatePendingKeyPressEvents',
      this._shouldSimulate(KeyEventRecordIndex.keypress, key),
      {
        event, key, focusTreeId, componentId, options
      }
    );
  }

  _simulateKeyUpEventsHiddenByCmd(event, key, focusTreeId, componentId, options) {
    if (isCmdKey(key)) {
      /**
       * When the command key is pressed down with other non-modifier keys, the browser
       * does not trigger the keyup event of those keys, so we simulate them when the
       * command key is released
       */

      Object.keys(this._getCurrentKeyCombination().keys).forEach((keyName) => {
        if (isCmdKey(keyName)) {
          return;
        }

        this._handleEventSimulation(
          'keyupEventsToSimulate',
          'simulatePendingKeyUpEvents',
          this._shouldSimulate(KeyEventRecordIndex.keyup, keyName),
          {
            event, key: keyName, focusTreeId, componentId, options
          }
        );
      })
    }
  }

  _ignoreEvent(event, componentId) {
    this.currentEvent.ignored = true;

    const componentPosition = this._getComponentPosition(componentId);

    if(this._stopEventPropagationAfterIgnoringIfEnabled(event, componentId)) {
      this._updateEventPropagationHistory(componentId, componentPosition, { forceReset: true });
    } else {
      this._updateEventPropagationHistory(componentId, componentPosition);
    }
  }

  /**
   * Whether KeyEventManager should ignore the event that is currently being handled
   * @returns {Boolean} Whether to ignore the event
   *
   * Do not override this method. Use setIgnoreEventsCondition() instead.
   * @private
   */
  _shouldIgnoreEvent() {
    const { ignoreEvent, forceObserveEvent } = this.eventPropagationState;
    return !forceObserveEvent && ignoreEvent;
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
    const { previousComponentPosition } = this.eventPropagationState;

    return previousComponentPosition === -1 || previousComponentPosition >= this._getComponentPosition(componentId);
  }

  _updateEventPropagationHistory(componentId, componentPosition, options = { forceReset: false }) {
    if (options.forceReset || this._isFocusTreeRoot(componentId)) {
      this._clearEventPropagationState();
    } else {
      this.eventPropagationState.previousComponentPosition = componentPosition;
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

  ignoreEvent() {
    this.eventPropagationState.ignoreEvent = true;
  }

  forceObserveEvent() {
    this.eventPropagationState.forceObserveEvent = true;
  }

  _isFocusTreeRoot(componentId) {
    return this._getComponentPosition(componentId) >= this.componentList.length - 1;
  }

  _setNewEventParameters(event, type) {
    KeyEventCounter.incrementId();

    this.currentEvent = {
      key: event.key,
      type,
      handled: false,
      ignored: false,
    };
  }

  _startAndLogNewKeyCombination(keyName, eventRecordIndex, focusTreeId, componentId, keyEventState) {
    this._startNewKeyCombination(keyName, eventRecordIndex, keyEventState);

    this.logger.verbose(
      this._logPrefix(componentId, {focusTreeId}),
      `Started a new combination with '${keyName}'.`
    );

    this.logger.verbose(
      this._logPrefix(componentId, {focusTreeId}),
      `Key history: ${printComponent(this.keyCombinationHistory)}.`
    );
  }

  _addToAndLogCurrentKeyCombination(keyName, eventRecordIndex, focusTreeId, componentId, keyEventState) {
    this._addToCurrentKeyCombination(keyName, eventRecordIndex, keyEventState);

    if (eventRecordIndex === KeyEventRecordIndex.keydown) {
      this.logger.verbose(
        this._logPrefix(componentId, {focusTreeId}),
        `Added '${keyName}' to current combination: '${this._getCurrentKeyCombination().ids[0]}'.`
      );
    }

    this.logger.verbose(
      this._logPrefix(componentId, {focusTreeId}),
      `Key history: ${printComponent(this.keyCombinationHistory)}.`
    );
  }

  /********************************************************************************
   * Event simulation
   ********************************************************************************/

  _stopEventPropagation(event, componentId) {
    if (!this.eventPropagationState.stopping) {
      this.eventPropagationState.stopping = true;

      this.logger.debug(
        this._logPrefix(componentId),
        'Stopping further event propagation.'
      );

      if (!event.simulated) {
        event.stopPropagation();
      }
    }
  }

  _handleEventSimulation(listName, handlerName, shouldSimulate, {event, key, focusTreeId, componentId, options}) {
    if (shouldSimulate && Configuration.option('simulateMissingKeyPressEvents')) {
      /**
       * If a key does not have a keypress event, we save the details of the keydown
       * event to simulate the keypress event, as the keydown event bubbles through
       * the last focus-only HotKeysComponent
       */
      const _event = this._cloneAndMergeEvent(event, {key, simulated: true });

      this[listName].push({
        event: _event, focusTreeId, componentId, options
      });
    }

    if (this._isFocusTreeRoot(componentId) || this.eventPropagationState.stopping) {
      if (!this.keyEventManager.isGlobalListenersBound()) {
        this[handlerName]();
      }
      /**
       * else, we wait for keydown event to propagate through global strategy
       * before we simulate the keypress
       */
    }
  }

  simulatePendingKeyPressEvents() {
    this._simulatePendingKeyEvents('keypressEventsToSimulate', 'handleKeypress');
  }

  simulatePendingKeyUpEvents() {
    this._simulatePendingKeyEvents('keyupEventsToSimulate', 'handleKeyup');
  }

  _simulatePendingKeyEvents(listName, handlerName) {
    if (this[listName].length > 0) {
      KeyEventCounter.incrementId();
    }

    this[listName].forEach(({ event, focusTreeId, componentId, options }) => {
      this[handlerName](event, focusTreeId, componentId, options);
    });

    this[listName] = [];

    /**
     * If an event gets handled and causes a focus shift, then subsequent components
     * will ignore the event (including the root component) and the conditions to
     * reset the propagation state are never met - so we ensure that after we are done
     * simulating the keypress event, the propagation state is reset
     */
    this._clearEventPropagationState();
  }

  /********************************************************************************
   * Matching and calling handlers
   ********************************************************************************/

  /**
   * Calls the first handler that matches the current key event if the action has not
   * already been handled in a more deeply nested component
   * @param {KeyboardEvent} event Keyboard event object to be passed to the handler
   * @param {NormalizedKeyName} keyName Normalized key name
   * @param {KeyEventRecordIndex} eventRecordIndex The record index of the current key event type
   * @param {FocusTreeId} focusTreeId Id of focus tree component thinks it's apart of
   * @param {ComponentId} componentId Index of the component that is currently handling
   *        the keyboard event
   * @private
   */
  _callHandlerIfActionNotHandled(event, keyName, eventRecordIndex, componentId, focusTreeId) {
    const eventName = describeKeyEventType(eventRecordIndex);
    const combinationName = this._describeCurrentKeyCombination();

    if (this.keyMapEventRecord[eventRecordIndex]) {
      if (this.eventPropagationState.actionHandled) {
        this.logger.debug(
          this._logPrefix(componentId, {focusTreeId}),
          `Ignored '${combinationName}' ${eventName} as it has already been handled.`
        );
      } else {
        this.logger.verbose(
          this._logPrefix(componentId, {focusTreeId}),
          `Attempting to find action matching '${combinationName}' ${eventName} . . .`
        );

        const { previousComponentPosition } = this.eventPropagationState;

        const componentPosition = this._getComponentPosition(componentId);

        const handlerWasCalled =
          this._callMatchingHandlerClosestToEventTarget(
            event,
            keyName,
            eventRecordIndex,
            componentPosition,
            previousComponentPosition === -1 ? 0 : previousComponentPosition
          );

        if (handlerWasCalled) {
          this.eventPropagationState.actionHandled = true;
          this.currentEvent.handled = true;
        }
      }
    } else {
      this.logger.verbose(
        this._logPrefix(componentId, {focusTreeId}),
        `Ignored '${combinationName}' ${eventName} because it doesn't have any ${eventName} handlers.`
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
      base += `F${focusTreeId}${logIcons[focusTreeId % logIcons.length]}-`;
    }

    if (options.eventId !== false) {
      const eventId = isUndefined(options.eventId) ? KeyEventCounter.getId() : options.eventId;

      base += `E${eventId}${eventIcons[eventId % eventIcons.length]}-`;
    }

    base += `C${componentId}${componentIcons[componentId % componentIcons.length]}`;

    const position = this._getComponentPosition(componentId);

    if (!isUndefined(position)) {
      base += `-P${position}${componentIcons[position % componentIcons.length]}:`
    }

    return `${base})`;
  }

}

export default FocusOnlyKeyEventStrategy;
