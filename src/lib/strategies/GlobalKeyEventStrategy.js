import KeyEventType from '../../const/KeyEventType';
import AbstractKeyEventStrategy from './AbstractKeyEventStrategy';
import describeKeyEventType from '../../helpers/logging/describeKeyEventType';
import KeyEventCounter from '../listening/KeyEventCounter';
import Logger from '../logging/Logger';
import isUndefined from '../../utils/isUndefined';
import printComponent from '../../helpers/logging/printComponent';
import getKeyName from '../../helpers/resolving-handlers/getKeyName';
import Configuration from '../config/Configuration';
import describeKeyEvent from '../../helpers/logging/describeKeyEvent';
import isCmdKey from '../../helpers/parsing-key-maps/isCmdKey';
import EventResponse from '../../const/EventResponse';
import contains from '../../utils/collection/contains';
import stateFromEvent from '../../helpers/parsing-key-maps/stateFromEvent';
import normalizeEventName from '../../utils/string/normalizeEventName';

/**
 * Defines behaviour for dealing with key maps defined in global HotKey components
 * @class
 */
class GlobalKeyEventStrategy extends AbstractKeyEventStrategy {
  /********************************************************************************
   * Init & Reset
   ********************************************************************************/

  constructor(configuration = {}, keyEventManager) {
    /**
     * Set state that gets cleared every time a component gets mounted or unmounted
     */
    super(configuration, keyEventManager);

    /**
     * Set state that doesn't get cleared each time a new new component is mounted
     * or unmounted
     * @type {number}
     */

    /**
     * Whether the global key event handlers have been bound to document yet or not
     * @type {boolean}
     */
    this.listenersBound = false;

    this.eventOptions = {
      ignoreEventsCondition: Configuration.option('ignoreEventsCondition')
    };

    /**
     * Dictionary of listener functions - currently only intended to house
     * keyCombinationListener
     */
    this.listeners = {};
  }

  /********************************************************************************
   * Enabling key maps and handlers
   ********************************************************************************/

  /**
   * Registers the actions and handlers of a HotKeys component that has mounted
   * @param {ComponentId} componentId - Id of the component that the keyMap belongs to
   * @param {KeyMap} actionNameToKeyMap - Map of actions to key expressions
   * @param {HandlersMap} actionNameToHandlersMap - Map of actions to handler functions
   * @param {Object} options Hash of options that configure how the actions
   *        and handlers are associated and called.
   * @param {Object} eventOptions - Options for how the event should be handled
   */
  enableHotKeys(componentId, actionNameToKeyMap = {}, actionNameToHandlersMap = {}, options, eventOptions) {
    this.eventOptions = eventOptions;

    this._addComponent(
      componentId,
      actionNameToKeyMap,
      actionNameToHandlersMap,
      options
    );

    this._updateDocumentHandlers();

    /**
     * Reset handler resolution state
     */
    this._initHandlerResolutionState();

    this.logger.debug(
      this._logPrefix(componentId, {eventId: false}),
      'Mounted.',
    );

    this.logger.verbose(
      this._logPrefix(componentId, {eventId: false}),
      'Component options: \n',
      printComponent(this.componentList.get(componentId))
    );
  }

  /**
   * Handles when a mounted global HotKeys component updates its props and changes
   * either the keyMap or handlers prop value
   * @param {ComponentId} componentId - The component index of the component to
   *        update
   * @param {KeyMap} actionNameToKeyMap - Map of actions to key expressions
   * @param {HandlersMap} actionNameToHandlersMap - Map of actions to handler functions
   * @param {Object} options Hash of options that configure how the actions
   *        and handlers are associated and called.
   * @param {Object} eventOptions - Options for how the event should be handled
   */
  updateEnabledHotKeys(componentId, actionNameToKeyMap = {}, actionNameToHandlersMap = {}, options, eventOptions) {
    this.eventOptions = eventOptions;

    this.componentList.update(
      componentId,
      actionNameToKeyMap,
      actionNameToHandlersMap,
      options
    );

    this.getKeyHistory().setMaxLength(this.componentList.getLongestSequence());

    /**
     * Reset strategy state specific to the global strategy
     */
    this._updateDocumentHandlers();

    /**
     * Reset handler resolution state
     */
    this._initHandlerResolutionState();

    this.logger.debug(
      this._logPrefix(componentId, {eventId: false}),
      `Global component ${componentId} updated.`,
    );

    this.logger.verbose(
      this._logPrefix(componentId, {eventId: false}),
      'Component options: \n',
      printComponent(this.componentList.get(componentId))
    );
  }

  /**
   * Handles when a component is unmounted
   * @param {ComponentId} componentId - Index of component that is being unmounted
   */
  disableHotKeys(componentId) {
    /**
     * Manually update the registered key map state, usually reset using
     * _resetRegisteredKeyMapsState() method
     */
    this.componentList.remove(componentId);

    this.getKeyHistory().setMaxLength(this.componentList.getLongestSequence());

    this._updateDocumentHandlers();

    /**
     * Reset handler resolution state
     */
    this._initHandlerResolutionState();

    this.logger.debug(
      this._logPrefix(componentId, {eventId: false}),
      `Unmounted global component ${componentId}`
    );
  }

  _updateDocumentHandlers(){
    const listenersShouldBeBound = this._listenersShouldBeBound();

    if (!this.listenersBound && listenersShouldBeBound) {
      Object.values(KeyEventType).forEach((recordIndex) => {
        const eventName = describeKeyEventType(recordIndex);

        document[`on${eventName}`] = (keyEvent) => {
          this.keyEventManager[`handleGlobal${normalizeEventName(eventName)}`](keyEvent);
        };

        this.logger.debug(
          this._logPrefix(this.componentId, {eventId: false}),
          `Bound handler handleGlobal${normalizeEventName(eventName)}() to document.on${eventName}()`
        );
      });

      this.listenersBound = true;

    } else if(this.listenersBound && !listenersShouldBeBound) {

      Object.values(KeyEventType).forEach((recordIndex) => {
        const eventName = describeKeyEventType(recordIndex);

        delete document[`on${eventName}`];

        this.logger.debug(
          this._logPrefix(this.componentId, {eventId: false}),
          `Removed handler handleGlobal${normalizeEventName(eventName)}() from document.on${eventName}()`
        );
      });

      this.listenersBound = false;
    }
  }

  /**
   * Whether the document listeners should be bound, to record key events. Basically a check
   * to see if there are any global key maps, or whether the user is currently rebinding to
   * a new key combination.
   * @returns {boolean} True if the document listeners should be bound
   * @private
   */
  _listenersShouldBeBound() {
    return this.componentList.any() || this.listeners.keyCombination;
  }

  /********************************************************************************
   * Recording key events
   ********************************************************************************/

  /**
   * Records a keydown keyboard event and matches it against the list of pre-registered
   * event handlers, calling the first matching handler with the highest priority if
   * one exists.
   *
   * This method is called once when a keyboard event bubbles up to document, and checks
   * the keymaps for all of the mounted global HotKey components.
   * @param {KeyboardEvent} event - Event containing the key name and state
   */
  handleKeyDown(event) {
    const _key = getKeyName(event);

    if (event.repeat && Configuration.option('ignoreRepeatedEventsWhenKeyHeldDown')) {
      this.logger.debug(
        this._logPrefix(),
        `Ignored repeated ${describeKeyEvent(event, _key, KeyEventType.keydown)} event.`
      );

      return true;
    }

    this._checkForModifierFlagDiscrepancies(event, _key, KeyEventType.keydown);

    const reactAppResponse = this._howReactAppRespondedTo(
      event,
      _key,
      KeyEventType.keydown
    );

    if (reactAppResponse === EventResponse.unseen &&
          this.eventOptions.ignoreEventsCondition(event)) {

      this.logger.debug(
        this._logPrefix(),
        `Ignored ${describeKeyEvent(event, _key, KeyEventType.keydown)} event because ignoreEventsFilter rejected it.`
      );

      return;
    }

    if (reactAppResponse !== EventResponse.ignored) {
      const keyEventState = stateFromEvent(event);

      const currentCombination = this.getCurrentCombination();

      if (currentCombination.isKeyIncluded(_key) || currentCombination.isEnding()) {
        this._startAndLogNewKeyCombination(
          _key,
          keyEventState
        );
      } else {
        this._addToAndLogCurrentKeyCombination(
          _key,
          KeyEventType.keydown,
          keyEventState
        );
      }
    }

    if (!contains([EventResponse.ignored, EventResponse.handled], reactAppResponse)) {
      this._callHandlerIfExists(event, _key, KeyEventType.keydown);
    }

    this._simulateKeyPressForNonPrintableKeys(event, _key);
  }

  _howReactAppRespondedTo(event, key, keyEventType) {
    const reactAppHistoryWithEvent =
      this.keyEventManager.reactAppHistoryWithEvent(key, keyEventType);

    switch(reactAppHistoryWithEvent) {
      case EventResponse.handled:
        this.logger.debug(
          this._logPrefix(),
          `Ignored ${describeKeyEvent(event, key, keyEventType)} event because React app has already handled it.`
        );

        break;

      case EventResponse.ignored:
        this.logger.debug(
          this._logPrefix(),
          `Ignored ${describeKeyEvent(event, key, keyEventType)} event because React app has declared it should be ignored.`
        );

        break;

      case EventResponse.seen:
        this.logger.debug(
          this._logPrefix(),
          `Received ${describeKeyEvent(event, key, keyEventType)} event (that has already passed through React app).`
        );

        break;

      default:
        KeyEventCounter.incrementId();

        this.logger.debug(
          this._logPrefix(),
          `New ${describeKeyEvent(event, key, keyEventType)} event (that has NOT passed through React app).`
        );
    }

    return reactAppHistoryWithEvent;
  }

  /**
   * Records a keypress keyboard event and matches it against the list of pre-registered
   * event handlers, calling the first matching handler with the highest priority if
   * one exists.
   *
   * This method is called once when a keyboard event bubbles up to document, and checks
   * the keymaps for all of the mounted global HotKey components.
   * @param {KeyboardEvent} event - Event containing the key name and state
   */
  handleKeyPress(event) {
    const key = getKeyName(event);

    if (event.repeat && Configuration.option('ignoreRepeatedEventsWhenKeyHeldDown')) {
      this.logger.debug(
        this._logPrefix(),
        `Ignored repeated ${describeKeyEvent(event, key, KeyEventType.keypress)} event.`
      );

      return true;
    }

    const currentCombination = this.getCurrentCombination();

    if (currentCombination.isKeyPressSimulated(key)) {
      this.logger.debug(
        this._logPrefix(),
        `Ignored ${describeKeyEvent(event, key, KeyEventType.keypress)} as it was not expected, and has already been simulated.`
      );

      return true;
    }

    /**
     * We first decide if the keypress event should be handled (to ensure the correct
     * order of logging statements)
     */
    const reactAppResponse = this._howReactAppRespondedTo(
      event,
      key,
      KeyEventType.keypress
    );

    /**
     * Add new key event to key combination history
     */

    if (currentCombination.isKeyIncluded(key)) {
      this._addToAndLogCurrentKeyCombination(
        key,
        KeyEventType.keypress,
        stateFromEvent(event)
      );
    }

    if (reactAppResponse === EventResponse.unseen) {
      /**
       * If the key event has not been seen by the React application, we ensure that
       * it's not still waiting for it. This occurs when action handlers bound to keydown
       * move the focus outside of the react app before it can record the keypress or
       * keyup
       */
      this.keyEventManager.closeHangingKeyCombination(key, KeyEventType.keypress);

      if (this.eventOptions.ignoreEventsCondition(event)) {
        this.logger.debug(
          this._logPrefix(),
          `Ignored ${describeKeyEvent(event, key, KeyEventType.keypress)} event because ignoreEventsFilter rejected it.`
        );

        return;
      }
    }

    if (!contains([EventResponse.ignored, EventResponse.handled], reactAppResponse)) {
      this._callHandlerIfExists(event, key, KeyEventType.keypress);
    }
  }

  /**
   * Records a keyup keyboard event and matches it against the list of pre-registered
   * event handlers, calling the first matching handler with the highest priority if
   * one exists.
   *
   * This method is called once when a keyboard event bubbles up to document, and checks
   * the keymaps for all of the mounted global HotKey components.
   * @param {KeyboardEvent} event - Event containing the key name and state
   */
  handleKeyUp(event) {
    const key = getKeyName(event);

    const currentCombination = this.getCurrentCombination();
    if (currentCombination.isKeyUpSimulated(key)) {
      this.logger.debug(
        this._logPrefix(),
        `Ignored ${describeKeyEvent(event, key, KeyEventType.keyup)} as it was not expected, and has already been simulated.`
      );

      return true;
    }

    /**
     * We first decide if the keyup event should be handled (to ensure the correct
     * order of logging statements)
     */
    const reactAppResponse = this._howReactAppRespondedTo(
      event,
      key,
      KeyEventType.keyup
    );

    /**
     * We then add the keyup to our current combination - regardless of whether
     * it's to be handled or not. We need to do this to ensure that if a handler
     * function changes focus to a context that ignored events, the keyup event
     * is not lost (leaving react hotkeys thinking the key is still pressed).
     */
    if (currentCombination.isKeyIncluded(key)) {
      this._addToAndLogCurrentKeyCombination(
        key,
        KeyEventType.keyup,
        stateFromEvent(event)
      );
    }

    if (reactAppResponse === EventResponse.unseen){
      /**
       * If the key event has not been seen by the React application, we ensure that
       * it's not still waiting for it. This occurs when action handlers bound to keydown
       * or keypress move the focus outside of the react app before it can record the keyup
       */
      this.keyEventManager.closeHangingKeyCombination(key, KeyEventType.keyup);

      if(this.eventOptions.ignoreEventsCondition(event)) {
        this.logger.debug(
          this._logPrefix(),
          `Ignored ${describeKeyEvent(event, key, KeyEventType.keyup)} event because ignoreEventsFilter rejected it.`
        );
      } else {
        /**
         * We attempt to find a handler of the event, only if it has not already
         * been handled and should not be ignored
         */
        if (!contains([EventResponse.ignored, EventResponse.handled], reactAppResponse)) {
          this._callHandlerIfExists(event, key, KeyEventType.keyup);
        }
      }
    } else {
      /**
       * We attempt to find a handler of the event, only if it has not already
       * been handled and should not be ignored
       */
      if (!contains([EventResponse.ignored, EventResponse.handled], reactAppResponse)) {
        this._callHandlerIfExists(event, key, KeyEventType.keyup);
      }
    }

    /**
     * We simulate any hidden keyup events hidden by the command key, regardless
     * of whether the event should be ignored or not
     */
    this._simulateKeyUpEventsHiddenByCmd(event, key);

    if (this.listeners.keyCombination && this._allKeysAreReleased()) {
      this.listeners.keyCombination({
        keys: currentCombination.getKeyDictionary(),
        id: currentCombination.describe()
      });
    }
  }

  _simulateKeyPressForNonPrintableKeys(event, key) {
    this.keyEventManager.simulatePendingKeyPressEvents();

    this._handleEventSimulation(
      'handleKeyPress',
      this._shouldSimulate(KeyEventType.keypress, key),
      {event, key}
    );
  }

  _simulateKeyUpEventsHiddenByCmd(event, key) {
    if (isCmdKey(key)) {
      /**
       * We simulate pending key events in the React app before we do it globally
       */
      this.keyEventManager.simulatePendingKeyUpEvents();

      this.getCurrentCombination().forEachKey((keyName) => {
        if (isCmdKey(keyName)) {
          return;
        }

        this._handleEventSimulation(
          'handleKeyUp',
          this._shouldSimulate(KeyEventType.keyup, keyName),
          {event, key: keyName}
        );
      });
    }
  }

  _startAndLogNewKeyCombination(keyName, keyEventState) {
    this.getKeyHistory().startNewKeyCombination(keyName, keyEventState);

    this.logger.verbose(
      this._logPrefix(),
      `Started a new combination with '${keyName}'.`
    );

    this.logger.verbose(
      this._logPrefix(),
      `Key history: ${printComponent(this.getKeyHistory().toJSON())}.`
    );
  }

  _addToAndLogCurrentKeyCombination(keyName, keyEventType, keyEventState) {
    this.getKeyHistory().addKeyToCurrentCombination(keyName, keyEventType, keyEventState);

    if (keyEventType === KeyEventType.keydown) {
      this.logger.verbose(
        this._logPrefix(),
        `Added '${keyName}' to current combination: '${this.getCurrentCombination().describe()}'.`
      );
    }

    this.logger.verbose(
      this._logPrefix(),
      `Key history: ${printComponent(this.getKeyHistory().toJSON())}.`
    );
  }

  /********************************************************************************
   * Event simulation
   ********************************************************************************/

  _handleEventSimulation(handlerName, shouldSimulate, {event, key}) {
    if (shouldSimulate && Configuration.option('simulateMissingKeyPressEvents')) {
      /**
       * If a key does not have a keypress event, we simulate one immediately after
       * the keydown event, to keep the behaviour consistent across all keys
       */

      const _event = this._cloneAndMergeEvent(event, {key, simulated: true});
      this[handlerName](_event);
    }
  }

  /********************************************************************************
   * Matching and calling handlers
   ********************************************************************************/

  _callHandlerIfExists(event, keyName, keyEventType) {
    const eventName = describeKeyEventType(keyEventType);
    const combinationName = this.getCurrentCombination().describe();

    if (!this.componentList.anyActionsForEventType(keyEventType)) {
      /**
       * If there are no handlers registered for the particular key event type
       * (keydown, keypress, keyup) then skip trying to find a matching handler
       * for the current key combination
       */
      this.logger.debug(
        this._logPrefix(),
        `Ignored '${combinationName}' ${eventName} because it doesn't have any ${eventName} handlers.`
      );

      return;
    }

    /**
     * If there is at least one handler for the specified key event type (keydown,
     * keypress, keyup), then attempt to find a handler that matches the current
     * key combination
     */
    this.logger.verbose(
      this._logPrefix(),
      `Attempting to find action matching '${combinationName}' ${eventName} . . .`
    );

    this._callClosestMatchingHandler(
      event,
      keyName,
      keyEventType
    );
  }

  _callClosestMatchingHandler(event, keyName, keyEventType) {
    const componentListIterator = this.componentList.getNewIterator();

    while (componentListIterator.next()) {
      const matchFound = super._callClosestMatchingHandler(
        event,
        keyName,
        keyEventType,
        componentListIterator.getPosition(),
        0
      );

      if (matchFound) {
        this.logger.debug(
          this._logPrefix(),
          `Searching no further, as handler has been found (and called).`
        );

        return;
      }
    }
  }

  _stopEventPropagation(event, componentId) {
    this.logger.debug(
      this._logPrefix(componentId),
      'Stopping further event propagation.'
    );

    if (!event.simulated) {
      event.stopPropagation();
    }
  }

  /********************************************************************************
   * Recording key combination
   ********************************************************************************/

  /**
   * Add a new key combination listener function to be called the next time a key
   * combination completes (assuming the cancel function is not called).
   * @param {keyCombinationListener} callbackFunction Function to call with the next
   *        completed key combination
   * @returns {function} Function to call to cancel listening for the next key
   *        combination
   */
  addKeyCombinationListener(callbackFunction) {
    const cancel = () => {
      delete this.listeners.keyCombination;
    };

    this.listeners.keyCombination = (keyCombination) => {
      callbackFunction(keyCombination);
      cancel();
    };

    this._updateDocumentHandlers();

    return cancel;
  }

  /********************************************************************************
   * Logging
   ********************************************************************************/

  _logPrefix(componentId, options = {}) {
    const eventIcons = Logger.eventIcons;
    const componentIcons = Logger.componentIcons;

    let base = 'HotKeys (GLOBAL';

    if (options.eventId !== false) {
      const eventId = isUndefined(options.eventId) ? KeyEventCounter.getId() : options.eventId;

      base = `${base}-E${eventId}${eventIcons[eventId % eventIcons.length]}`
    }

    if (isUndefined(componentId)) {
      return `${base}):`
    } else {
      return `${base}-C${componentId}${componentIcons[componentId % componentIcons.length]}):`;
    }
  }
}


export default GlobalKeyEventStrategy;
