import AbstractKeyEventStrategy from './AbstractKeyEventStrategy';
import KeyEventRecordIndex from '../../const/KeyEventRecordIndex';
import KeyEventCounter from '../listening/KeyEventCounter';
import describeKeyEventType from '../../helpers/logging/describeKeyEventType';
import Configuration from '../config/Configuration';
import Logger from '../logging/Logger';
import printComponent from '../../helpers/logging/printComponent';
import isUndefined from '../../utils/isUndefined';
import getKeyName from '../../helpers/resolving-handlers/getKeyName';
import isCmdKey from '../../helpers/parsing-key-maps/isCmdKey';
import describeKeyEvent from '../../helpers/logging/describeKeyEvent';
import EventResponse from '../../const/EventResponse';
import KeyEventRecordState from '../../const/KeyEventRecordState';
import stateFromEvent from '../../helpers/parsing-key-maps/stateFromEvent';
import EventPropagator from '../listening/EventPropagator';

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
     * @typedef {number} FocusTreeId
     */

    /**
     * Counter to keep track of what focus tree ID should be allocated next
     * @type {FocusTreeId}
     */
    this.focusTreeId = 0;
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

    this.eventPropagator = new EventPropagator(this.componentList, {
      logger: this.logger,
      logPrefix: this._logPrefix.bind(this)
    });
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

    if (this.componentList.containsId(componentId)) {
      /**
       * The <tt>componentId</tt> has already been registered - this occurs when the
       * same component has somehow managed to be focused twice, without being blurred
       * in between.
       *
       * @see https://github.com/greena13/react-hotkeys/issues/173
       */
      return undefined;
    }

    this._addComponent(
      componentId,
      actionNameToKeyMap,
      actionNameToHandlersMap,
      options
    );

    this.logger.debug(
      this._logPrefix(componentId, { eventId: false }),
      'Focused. \n'
    );

    this.logger.verbose(
      this._logPrefix(componentId, { eventId: false }),
      'Component options:\n',
      printComponent(this.componentList.get(componentId))
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
    if (focusTreeId !== this.focusTreeId || !this.componentList.containsId(componentId)) {
      return;
    }

    this.componentList.update(componentId,
      actionNameToKeyMap,
      actionNameToHandlersMap,
      options
    );

    this.getKeyHistory().setMaxLength(this.componentList.getLongestSequence());

    this.logger.debug(
      this._logPrefix(componentId, {focusTreeId, eventId: false}),
      'Received new props.',
    );

    /**
     * Reset handler resolution state
     */
    this._initHandlerResolutionState();

    this.logger.verbose(
      this._logPrefix(componentId, {focusTreeId, eventId: false}),
      'Component options:\n',
      printComponent(this.componentList.get(componentId))
    );
  }

  /**
   * Handles when a component loses focus by resetting the internal state, ready to
   * receive the next tree of focused HotKeys components
   * @param {FocusTreeId} focusTreeId - Id of focus tree component thinks it's
   *        apart of
   * @param {ComponentId} componentId - Index of component that is blurring
   * @returns {boolean} Whether the component still has event propagation yet to handle
   */
  disableHotKeys(focusTreeId, componentId){
    if (!this.resetOnNextFocus) {
      this.resetOnNextFocus = true;
    }

    const outstandingEventPropagation = this.eventPropagator.isPendingPropagation();

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
   * @property {function} persist
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
    const key = getKeyName(event);

    if (focusTreeId !== this.focusTreeId) {
      this.logger.debug(
        this._logPrefix(componentId),
        `Ignored ${describeKeyEvent(event, key, KeyEventRecordIndex.keydown)} event because it had an old focus tree id: ${focusTreeId}.`
      );

      this.eventPropagator.ignoreEvent(event);

      return true;
    }

    const started = this.eventPropagator.startNewPropagationStep(
      componentId,
      event,
      key,
      KeyEventRecordIndex.keydown
    );

    if (!started) {
      return;
    }

    const responseAction = this._howToHandleKeyEvent(event,
      focusTreeId,
      componentId,
      key,
      options,
      KeyEventRecordIndex.keydown
    );

    if (responseAction === EventResponse.handled) {
      const keyEventState = stateFromEvent(event);

      const currentCombination = this.getCurrentCombination();

      if (currentCombination.isKeyIncluded(key) || currentCombination.isEnding()) {
        this._startAndLogNewKeyCombination(
          key,
          focusTreeId,
          componentId,
          keyEventState
        );
      } else {
        this._addToAndLogCurrentKeyCombination(
          key,
          KeyEventRecordIndex.keydown,
          focusTreeId,
          componentId,
          keyEventState
        );
      }

      this._callHandlerIfActionNotHandled(event, key, KeyEventRecordIndex.keydown, componentId, focusTreeId);
    }

    this._simulateKeyPressForNonPrintableKeys(event, key, focusTreeId, componentId, options);

    this.eventPropagator.finishPropagationStep();

    return false;
  }

  _howToHandleKeyEvent(event, focusTreeId, componentId, key, options, keyEventRecordIndex){
    if (this.eventPropagator.isFirstPropagationStep()) {
      if (options.ignoreEventsCondition(event) && this.eventPropagator.ignoreEvent(event)) {
        return this._eventIsToBeIgnored(event, componentId, key, keyEventRecordIndex);
      }

      this.logger.debug(
        this._logPrefix(componentId),
        `New ${describeKeyEvent(event, key, keyEventRecordIndex)} event.`
      );

      this._checkForModifierFlagDiscrepancies(event, key, keyEventRecordIndex);

    } else if (this.eventPropagator.isIgnoringEvent()) {
      return this._eventIsToBeIgnored(event, componentId, key, keyEventRecordIndex);
    }

    return this._eventIsToBeHandled();
  }

  _eventIsToBeIgnored(event, componentId, key, keyEventRecordIndex){
    this.logger.debug(
      this._logPrefix(componentId),
      `Ignored ${describeKeyEvent(event, key, keyEventRecordIndex)} event because ignoreEventsFilter rejected it.`
    );

    return EventResponse.ignored;
  }

  _eventIsToBeHandled() {
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
   * @returns {boolean} Whether the HotKeys component should discard its current focus
   *        tree Id, because it belongs to an old focus tree.
   */
  handleKeyPress(event, focusTreeId, componentId, options) {
    const key = getKeyName(event);

    const currentCombination = this.getCurrentCombination();

    if (currentCombination.isKeyPressSimulated(key)) {
      this.logger.debug(
        this._logPrefix(componentId),
        `Ignored ${describeKeyEvent(event, key, KeyEventRecordIndex.keypress)} as it was not expected, and has already been simulated.`
      );

      this.eventPropagator.ignoreEvent(event);

      return true;
    }

    const started = this.eventPropagator.startNewPropagationStep(
      componentId,
      event,
      key,
      KeyEventRecordIndex.keypress
    );

    if (!started) {
      return;
    }

    const shouldDiscardFocusTreeId = focusTreeId !== this.focusTreeId;

    /**
     * We first decide if the keypress event should be handled (to ensure the correct
     * order of logging statements)
     */
    const responseAction = this._howToHandleKeyEvent(event,
      focusTreeId,
      componentId,
      key,
      options,
      KeyEventRecordIndex.keypress
    );

    if (this.eventPropagator.isFirstPropagationStep(componentId) && currentCombination.isKeyIncluded(key)) {
      this._addToAndLogCurrentKeyCombination(
        key,
        KeyEventRecordIndex.keypress,
        focusTreeId,
        componentId,
        stateFromEvent(event)
      );
    }

    /**
     * We attempt to find a handler of the event, only if it has not already
     * been handled and should not be ignored
     */
    if (responseAction === EventResponse.handled) {
      this._callHandlerIfActionNotHandled(
        event,
        key,
        KeyEventRecordIndex.keypress,
        componentId,
        focusTreeId
      );
    }

    this.eventPropagator.finishPropagationStep();

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
   * @returns {boolean} Whether HotKeys component should discard its current focusTreeId
   *        because it's stale (part of an old focus tree)
   */
  handleKeyUp(event, focusTreeId, componentId, options) {
    const key = getKeyName(event);

    const currentCombination = this.getCurrentCombination();

    if (currentCombination.isKeyUpSimulated(key)) {
      this.logger.debug(
        this._logPrefix(componentId),
        `Ignored ${describeKeyEvent(event, key, KeyEventRecordIndex.keyup)} as it was not expected, and has already been simulated.`
      );

      this.eventPropagator.ignoreEvent(event);

      return true;
    }

    const started = this.eventPropagator.startNewPropagationStep(
      componentId,
      event,
      key,
      KeyEventRecordIndex.keyup
    );

    if (!started) {
      return;
    }

    const shouldDiscardFocusId = focusTreeId !== this.focusTreeId;

    /**
     * We first decide if the keyup event should be handled (to ensure the correct
     * order of logging statements)
     */
    const responseAction = this._howToHandleKeyEvent(event,
      focusTreeId,
      componentId,
      key,
      options,
      KeyEventRecordIndex.keyup
    );

    /**
     * We then add the keyup to our current combination - regardless of whether
     * it's to be handled or not. We need to do this to ensure that if a handler
     * function changes focus to a context that ignored events, the keyup event
     * is not lost (leaving react hotkeys thinking the key is still pressed).
     */
    if (this.eventPropagator.isFirstPropagationStep(componentId) && currentCombination.isKeyIncluded(key)) {
      this._addToAndLogCurrentKeyCombination(
        key,
        KeyEventRecordIndex.keyup,
        focusTreeId,
        componentId,
        stateFromEvent(event)
      );
    }

    /**
     * We attempt to find a handler of the event, only if it has not already
     * been handled and should not be ignored
     */
    if (responseAction === EventResponse.handled) {
      this._callHandlerIfActionNotHandled(event, key, KeyEventRecordIndex.keyup, componentId, focusTreeId);
    }

    /**
     * We simulate any hidden keyup events hidden by the command key, regardless
     * of whether the event should be ignored or not
     */
    this._simulateKeyUpEventsHiddenByCmd(event, key, focusTreeId, componentId, options);

    this.eventPropagator.finishPropagationStep();

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
    const currentCombination = this.getCurrentCombination();

    if (currentCombination.isKeyDownTriggered(keyName) &&
      !currentCombination.isKeyEventTriggered(keyName, recordIndex)) {

      /**
       * If the key is in the current combination and recorded as still being pressed
       * down (as either keydown or keypress), then we update the state
       * to keypress or keyup (depending on the value of recordIndex).
       */
      currentCombination.setKeyState(keyName, recordIndex, KeyEventRecordState.simulated);
    }
  }

  _simulateKeyPressForNonPrintableKeys(event, key, focusTreeId, componentId, options){
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
      this.getCurrentCombination().forEachKey((keyName) => {
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
      });
    }
  }

  _stopEventPropagation(event, componentId) {
    if (this.eventPropagator.stop(event)) {
      this.logger.debug(
        this._logPrefix(componentId),
        'Stopping further event propagation.'
      );
    }
  }

  getEventPropagator() {
    return this.eventPropagator;
  }

  _startAndLogNewKeyCombination(keyName, focusTreeId, componentId, keyEventState) {
    this.getKeyHistory().startNewKeyCombination(keyName, keyEventState);

    this.logger.verbose(
      this._logPrefix(componentId, {focusTreeId}),
      `Started a new combination with '${keyName}'.`
    );

    this.logger.verbose(
      this._logPrefix(componentId, {focusTreeId}),
      `Key history: ${printComponent(this.getKeyHistory().toJSON())}.`
    );
  }

  _addToAndLogCurrentKeyCombination(keyName, eventRecordIndex, focusTreeId, componentId, keyEventState) {
    this.getKeyHistory().addKeyToCurrentCombination(keyName, eventRecordIndex, keyEventState);

    if (eventRecordIndex === KeyEventRecordIndex.keydown) {
      this.logger.verbose(
        this._logPrefix(componentId, {focusTreeId}),
        `Added '${keyName}' to current combination: '${this.getCurrentCombination().describe()}'.`
      );
    }

    this.logger.verbose(
      this._logPrefix(componentId, {focusTreeId}),
      `Key history: ${printComponent(this.getKeyHistory().toJSON())}.`
    );
  }

  /********************************************************************************
   * Event simulation
   ********************************************************************************/

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

    if (this.componentList.isRoot(componentId) || this.eventPropagator.isStopped()) {
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
    this._simulatePendingKeyEvents('keypressEventsToSimulate', 'handleKeyPress');
  }

  simulatePendingKeyUpEvents() {
    this._simulatePendingKeyEvents('keyupEventsToSimulate', 'handleKeyUp');
  }

  _simulatePendingKeyEvents(listName, handlerName) {
    if (this[listName].length > 0) {
      KeyEventCounter.incrementId();
    }

    this[listName].forEach(({ event, focusTreeId, componentId, options }) => {
      this[handlerName](event, focusTreeId, componentId, options);
    });

    this[listName] = [];
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
    const combinationName = this.getCurrentCombination().describe();

    if (!this.componentList.anyActionsForEventType(eventRecordIndex)) {
      this.logger.verbose(
        this._logPrefix(componentId, {focusTreeId}),
        `Ignored '${combinationName}' ${eventName} because it doesn't have any ${eventName} handlers.`
      );

      return;
    }

    if (this.eventPropagator.isHandled()) {
      this.logger.debug(
        this._logPrefix(componentId, {focusTreeId}),
        `Ignored '${combinationName}' ${eventName} as it has already been handled.`
      );
    } else {
      this.logger.verbose(
        this._logPrefix(componentId, {focusTreeId}),
        `Attempting to find action matching '${combinationName}' ${eventName} . . .`
      );

      const previousComponentPosition = this.eventPropagator.getPreviousPosition();

      const componentPosition = this.componentList.getIndexById(componentId);

      const handlerWasCalled =
        this._callClosestMatchingHandler(
          event,
          keyName,
          eventRecordIndex,
          componentPosition,
          previousComponentPosition === -1 ? 0 : previousComponentPosition
        );

      if (handlerWasCalled) {
        this.eventPropagator.setHandled();
      }
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

    const position = this.componentList.getIndexById(componentId);

    if (!isUndefined(position)) {
      base += `-P${position}${componentIcons[position % componentIcons.length]}:`
    }

    return `${base})`;
  }

}

export default FocusOnlyKeyEventStrategy;
