import AbstractKeyEventStrategy from './AbstractKeyEventStrategy';
import KeyEventType from '../../const/KeyEventType';
import describeKeyEventType from '../../helpers/logging/describeKeyEventType';
import getKeyName from '../../helpers/resolving-handlers/getKeyName';
import isCmdKey from '../../helpers/parsing-key-maps/isCmdKey';
import describeKeyEvent from '../../helpers/logging/describeKeyEvent';
import EventResponse from '../../const/EventResponse';
import KeyEventState from '../../const/KeyEventState';
import stateFromEvent from '../../helpers/parsing-key-maps/stateFromEvent';
import EventPropagator from '../listening/EventPropagator';
import FocusOnlyKeyEventSimulator from '../simulation/FocusOnlyKeyEventSimulator';
import FocusTree from '../listening/FocusTree';
import FocusOnlyLogger from '../logging/FocusOnlyLogger';

/**
 * Defines behaviour for dealing with key maps defined in focus-only HotKey components
 * @class
 */
class FocusOnlyKeyEventStrategy extends AbstractKeyEventStrategy {
  /********************************************************************************
   * Init & Reset
   ********************************************************************************/

  constructor(options = {}, keyEventManager) {
    /******************************************************************************
     * Set state that DOES get cleared on each new focus tree
     ******************************************************************************/
    super(options, keyEventManager);

    this.logger = new FocusOnlyLogger(options.logLevel || 'warn', this);
    this.eventPropagator.logger = this.logger;

    /*****************************************************************************
     * State that doesn't get cleared on each new focus tree
     *****************************************************************************/

    /**
     * Unique identifier given to each focus tree - when the focus in the browser
     * changes, and a different tree of elements are focused, a new id is allocated
     * @typedef {number} FocusTreeId
     */

    /**
     * Counter to keep track of what focus tree ID should be allocated next
     * @type {FocusTreeId}
     */
    this.focusTree = new FocusTree();

    this._simulator = new FocusOnlyKeyEventSimulator(this);
  }

  /**
   * Clears the internal state, wiping any history of key events and registered handlers
   * so they have no effect on the next tree of focused HotKeys components
   * @private
   */
  _reset() {
    super._reset();

    if (this._simulator) {
      this._simulator.clear();
    }

    /**
     * Increase the unique ID associated with each unique focus tree
     * @type {number}
     */
    if (this.focusTree) {
      this.focusTree.new();
    }

    this.eventPropagator = new EventPropagator(this._componentList);
    this.eventPropagator.logger = this.logger;
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
    if (this.resetOnNextFocus) {
      /**
       * We know components have just lost focus or keymaps have already been built,
       * meaning we are either anticipating a new set of components to be focused or
       * we are receiving notice of a component being focused when we aren't expecting it.
       * In either case, the internal state needs to be reset.
       */
      this._reset();
      this.resetOnNextFocus = false;
    }

    if (this._componentList.containsId(componentId)) {
      /**
       * The <tt>componentId</tt> has already been registered - this occurs when the
       * same component has somehow managed to be focused twice, without being blurred
       * in between.
       *
       * @see https://github.com/greena13/react-hotkeys/issues/173
       */
      return;
    }

    this._addComponent(
      componentId, actionNameToKeyMap, actionNameToHandlersMap, 'Focused', options
    );

    return this.focusTree.id;
  }

  /**
   * Handles when a HotKeys component that is in focus updates its props and changes
   * either the keyMap or handlers prop value
   * @param {FocusTreeId} focusTreeId - The ID of the focus tree the component is part of.
   *        Used to identify (and ignore) stale updates.
   * @param {ComponentId} componentId - The component index of the component to
   *        update
   * @param {KeyMap} keyMap - Map of key sequences to action names
   * @param {HandlersMap} handlersMap - Map of action names to handler
   *        functions
   * @param {Object} options Hash of options that configure how the actions
   *        and handlers are associated and called.
   */
  updateEnabledHotKeys(focusTreeId, componentId, keyMap = {}, handlersMap = {}, options) {
    if (this.focusTree.isOld(focusTreeId) || !this._componentList.containsId(componentId)) {
      return;
    }

    this._updateComponent(componentId, keyMap, handlersMap, options);
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
    this.resetOnNextFocus = true;

    const outstandingEventPropagation = this.eventPropagator.isPendingPropagation();

    this.logger.debug(
      `${this.logger.keyEventPrefix(componentId, {focusTreeId})}`,
      `Lost focus${outstandingEventPropagation ? ' (Key event has yet to propagate through it)' : '' }.`
    );

    return outstandingEventPropagation;
  }

  /********************************************************************************
   * Recording key events
   ********************************************************************************/

  /**
   * @typedef {KeyboardEvent} SyntheticKeyboardEvent
   * @property {KeyboardEvent} nativeEvent The native event the SyntheticEvent is wrapping
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
   * @returns {boolean} Whether the event was discarded because it was part of an old focus tree
   */
  handleKeyDown(event, focusTreeId, componentId, options = {}) {
    const key = getKeyName(event);

    if (this.focusTree.isOld(focusTreeId)) {
      this.logger.logIgnoredKeyEvent(event, key, KeyEventType.keydown, `it had an old focus tree id: ${focusTreeId}`, componentId);

      this.eventPropagator.ignoreEvent(event);

      return true;
    }

    if (this._isIgnoringRepeatedEvent(event, key, KeyEventType.keydown, componentId)) {
      return false;
    }

    if (!this.eventPropagator.startNewPropagationStep(componentId, event, key, KeyEventType.keydown)) {
      return false;
    }

    const responseAction = this._howToHandleKeyEvent(
      event, focusTreeId, componentId, key, options, KeyEventType.keydown
    );

    if (responseAction === EventResponse.handled) {
      this._recordKeyDown(event, key, componentId);

      this._callHandlerIfActionNotHandled(event, key, KeyEventType.keydown, componentId, focusTreeId);
    }

    this._simulator.handleKeyPressSimulation({event, key, focusTreeId, componentId, options});

    this.eventPropagator.finishPropagationStep();

    return false;
  }

  _howToHandleKeyEvent(event, focusTreeId, componentId, key, options, keyEventType){
    if (this.eventPropagator.isFirstPropagationStep()) {
      if (options.ignoreEventsCondition(event) && this.eventPropagator.ignoreEvent(event)) {
        return this._eventIsToBeIgnored(event, componentId, key, keyEventType);
      }

      this.logger.debug(
        this.logger.keyEventPrefix(componentId),
        `New ${describeKeyEvent(event, key, keyEventType)} event.`
      );

      this.currentCombination.resolveModifierFlagDiscrepancies(event, key, keyEventType);

    } else if (this.eventPropagator.isIgnoringEvent()) {
      return this._eventIsToBeIgnored(event, componentId, key, keyEventType);
    }

    return EventResponse.handled;
  }

  _eventIsToBeIgnored(event, componentId, key, keyEventType){
    this.logger.logIgnoredKeyEvent(event, key, keyEventType, `ignoreEventsFilter rejected it`, componentId);

    return EventResponse.ignored;
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
   * @param {SyntheticKeyboardEvent} event - Event containing the key name and state
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

    if (this._isIgnoringRepeatedEvent(event, key, KeyEventType.keypress, componentId)) {
      return false;
    }

    const currentCombination = this.currentCombination;

    if (currentCombination.isKeyPressSimulated(key)) {
      this._ignoreAlreadySimulatedEvent(event, key, KeyEventType.keypress, componentId);

      return false;
    }

    if (!this.eventPropagator.startNewPropagationStep(componentId, event, key, KeyEventType.keypress)) {
      return false;
    }

    const shouldDiscardFocusTreeId = this.focusTree.isOld(focusTreeId);

    /**
     * We first decide if the keypress event should be handled (to ensure the correct
     * order of logging statements)
     */
    const responseAction = this._howToHandleKeyEvent(event,
      focusTreeId, componentId, key, options, KeyEventType.keypress
    );

    if (this.eventPropagator.isFirstPropagationStep(componentId) && currentCombination.isKeyIncluded(key)) {
      this._addToAndLogCurrentKeyCombination(key, KeyEventType.keypress, stateFromEvent(event), componentId);
    }

    /**
     * We attempt to find a handler of the event, only if it has not already
     * been handled and should not be ignored
     */
    if (responseAction === EventResponse.handled) {
      this._callHandlerIfActionNotHandled(
        event, key, KeyEventType.keypress, componentId, focusTreeId
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
   * @param {SyntheticKeyboardEvent} event Event containing the key name and state
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

    const currentCombination = this.currentCombination;

    if (currentCombination.isKeyUpSimulated(key)) {
      this._ignoreAlreadySimulatedEvent(event, key, KeyEventType.keyup, componentId);

      return true;
    }

    const started = this.eventPropagator.startNewPropagationStep(
      componentId,
      event,
      key,
      KeyEventType.keyup
    );

    if (!started) {
      return;
    }

    const shouldDiscardFocusId = this.focusTree.isOld(focusTreeId);

    /**
     * We first decide if the keyup event should be handled (to ensure the correct
     * order of logging statements)
     */
    const responseAction = this._howToHandleKeyEvent(event,
      focusTreeId, componentId, key, options, KeyEventType.keyup
    );

    /**
     * We then add the keyup to our current combination - regardless of whether
     * it's to be handled or not. We need to do this to ensure that if a handler
     * function changes focus to a context that ignored events, the keyup event
     * is not lost (leaving react hotkeys thinking the key is still pressed).
     */
    if (this.eventPropagator.isFirstPropagationStep(componentId) && currentCombination.isKeyIncluded(key)) {
      this._addToAndLogCurrentKeyCombination(key, KeyEventType.keyup, stateFromEvent(event), componentId);
    }

    /**
     * We attempt to find a handler of the event, only if it has not already
     * been handled and should not be ignored
     */
    if (responseAction === EventResponse.handled) {
      this._callHandlerIfActionNotHandled(event, key, KeyEventType.keyup, componentId, focusTreeId);
    }

    /**
     * We simulate any hidden keyup events hidden by the command key, regardless
     * of whether the event should be ignored or not
     */
    this._simulateKeyUpEventsHiddenByCmd(event, key, focusTreeId, componentId, options);

    this.eventPropagator.finishPropagationStep();

    return shouldDiscardFocusId;
  }

  _ignoreAlreadySimulatedEvent(event, key, eventType, componentId) {
    this.logger.logAlreadySimulatedEvent(event, key, eventType, componentId);

    this.eventPropagator.ignoreEvent(event);
  }

  /**
   * Closes any hanging key combinations that have not received the key event indicated
   * by recordIndex.
   * @param {KeyName} keyName The name of the key whose state should be updated if it
   *        is currently set to keydown or keypress.
   * @param {KeyEventType} recordIndex Index of key event to move the key state
   *        up to.
   */
  closeHangingKeyCombination(keyName, recordIndex) {
    const currentCombination = this.currentCombination;

    if (currentCombination.isKeyIncluded(keyName) &&
      !currentCombination.isEventTriggered(keyName, recordIndex)) {

      /**
       * If the key is in the current combination and recorded as still being pressed
       * down (as either keydown or keypress), then we update the state
       * to keypress or keyup (depending on the value of recordIndex).
       */
      currentCombination.setKeyState(keyName, recordIndex, KeyEventState.simulated);
    }
  }

  _simulateKeyUpEventsHiddenByCmd(event, key, focusTreeId, componentId, options) {
    if (isCmdKey(key)) {
      const iterator = this.currentCombination.iterator;

      iterator.forEachKey((keyName) => {
        if (isCmdKey(keyName)) {
          return;
        }

        this._simulator.handleKeyUpSimulation({event, key: keyName, focusTreeId, componentId, options});
      });
    }
  }

  stopEventPropagation(event, componentId) {
    if (this.eventPropagator.stop(event)) {
      this.logger.debug(
        this.logger.keyEventPrefix(componentId),
        'Stopping further event propagation.'
      );
    }
  }

  /********************************************************************************
   * Event simulation
   ********************************************************************************/

  simulatePendingKeyPressEvents() {
    this._simulator.simulatePendingKeyPressEvents();
  }

  simulatePendingKeyUpEvents() {
    this._simulator.simulatePendingKeyUpEvents();
  }

  shouldSimulateEventsImmediately() {
    return !this.keyEventManager.isGlobalListenersBound();
  }

  /********************************************************************************
   * Matching and calling handlers
   ********************************************************************************/

  /**
   * Calls the first handler that matches the current key event if the action has not
   * already been handled in a more deeply nested component
   * @param {SyntheticKeyboardEvent} event Keyboard event object to be passed to the handler
   * @param {NormalizedKeyName} keyName Normalized key name
   * @param {KeyEventType} keyEventType The record index of the current key event type
   * @param {FocusTreeId} focusTreeId Id of focus tree component thinks it's apart of
   * @param {ComponentId} componentId Index of the component that is currently handling
   *        the keyboard event
   * @private
   */
  _callHandlerIfActionNotHandled(event, keyName, keyEventType, componentId, focusTreeId) {
    const eventName = describeKeyEventType(keyEventType);
    const combinationName = this._describeCurrentCombination();

    if (!this._componentList.anyActionsForEventType(keyEventType)) {
      this.logger.logIgnoredEvent(`'${combinationName}' ${eventName}`, `it doesn't have any ${eventName} handlers`, componentId);

      return;
    }

    if (this.eventPropagator.isHandled()) {
      this.logger.logIgnoredEvent(`'${combinationName}' ${eventName}`, 'it has already been handled', componentId);
    } else {
      this.logger.verbose(
        this.logger.keyEventPrefix(componentId, {focusTreeId}),
        `Attempting to find action matching '${combinationName}' ${eventName} . . .`
      );

      const { previousPosition } = this.eventPropagator;

      const componentPosition = this._componentList.getIndexById(componentId);

      const handlerWasCalled =
        this.actionResolver.callClosestMatchingHandler(
          event, keyName, keyEventType, componentPosition,
          previousPosition === -1 ? 0 : previousPosition
        );

      if (handlerWasCalled) {
        this.eventPropagator.setHandled();
      }
    }
  }

  /********************************************************************************
   * Logging
   ********************************************************************************/

  getFocusTreeId() {
    return this.focusTree.id;
  }
}

export default FocusOnlyKeyEventStrategy;
