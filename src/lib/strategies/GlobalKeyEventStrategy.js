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
import GlobalKeyEventSimulator from '../simulation/GlobalKeyEventSimulator';
import GlobalEventListenerAdaptor from '../listening/GlobalEventListenerAdaptor';
import normalizeEventName from '../../utils/string/normalizeEventName';
import Registry from '../shared/Registry';

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

    this.eventOptions = {
      ignoreEventsCondition: Configuration.option('ignoreEventsCondition')
    };

    /**
     * Dictionary of listener functions - currently only intended to house
     * keyCombinationListener
     */
    this.listeners = new Registry();

    this._simulator = new GlobalKeyEventSimulator(this);

    this._listenerAdaptor = new GlobalEventListenerAdaptor(this,
      { logger: this.logger, logPrefix: this._logPrefix }
    );
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

    this._logComponentOptions(componentId);
  }

  _logComponentOptions(componentId) {
    super._logComponentOptions(componentId, {eventId: false});
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

    this._componentList.update(
      componentId, actionNameToKeyMap, actionNameToHandlersMap, options
    );

    this._updateLongestSequence();

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

    this._logComponentOptions(componentId);
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
    this._componentList.remove(componentId);

    this._updateLongestSequence();
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
    const listenersShouldBeBound = this._shouldListenersBeBound();
    const listenersAreBound = this.isListenersBound();

    if (!listenersAreBound && listenersShouldBeBound) {
      this._listenerAdaptor.bindListeners(this.componentId);
    } else if (listenersAreBound && !listenersShouldBeBound) {
      this._listenerAdaptor.unbindListeners(this.componentId);
    }
  }

  isListenersBound() {
    return this._listenerAdaptor.isListenersBound();
  }

  /**
   * Whether the document listeners should be bound, to record key events. Basically a check
   * to see if there are any global key maps, or whether the user is currently rebinding to
   * a new key combination.
   * @returns {boolean} True if the document listeners should be bound
   * @private
   */
  _shouldListenersBeBound() {
    return this._componentList.any() || this.listeners.get('keyCombination');
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
    const key = getKeyName(event);

    if (this._isIgnoringRepeatedEvent(event, key, KeyEventType.keydown)) {
      return;
    }

    this._checkForModifierFlagDiscrepancies(event, key, KeyEventType.keydown);

    const reactAppResponse = this._howReactAppRespondedTo(
      event, key, KeyEventType.keydown
    );

    if (reactAppResponse === EventResponse.unseen &&
          this.eventOptions.ignoreEventsCondition(event)) {

      this._logEventRejectedByFilter(event, key, KeyEventType.keydown);

      return;
    }

    if (reactAppResponse !== EventResponse.ignored) {
      const keyEventState = stateFromEvent(event);

      const currentCombination = this.getCurrentCombination();

      if (currentCombination.isKeyIncluded(key) || currentCombination.isEnding()) {
        this._startAndLogNewKeyCombination(key, keyEventState);
      } else {
        this._addToAndLogCurrentKeyCombination(key, KeyEventType.keydown, keyEventState);
      }
    }

    this._callHandlerIfNeeded(reactAppResponse, event, key, KeyEventType.keydown);

    this.keyEventManager.simulatePendingKeyPressEvents();
    this._simulator.handleKeyPressSimulation({event, key});
  }

  _logEventRejectedByFilter(event, key, eventType) {
    this._logIgnoredKeyEvent(event, key, eventType, 'ignoreEventsFilter rejected it');
  }

  _isIgnoringRepeatedEvent(event, key, eventType) {
    if (event.repeat && Configuration.option('ignoreRepeatedEventsWhenKeyHeldDown')) {
      this._logIgnoredKeyEvent(event, key, eventType, 'it was a repeated event');

      return true;
    }

    return false;
  }

  _howReactAppRespondedTo(event, key, keyEventType) {
    const reactAppHistoryWithEvent =
      this.keyEventManager.reactAppHistoryWithEvent(key, keyEventType);

    switch(reactAppHistoryWithEvent) {
      case EventResponse.handled:
        this._logIgnoredKeyEvent(event, key, keyEventType, 'React app has already handled it');

        break;

      case EventResponse.ignored:
        this._logIgnoredKeyEvent(event, key, keyEventType, 'React app has declared it should be ignored');

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

    if (this._isIgnoringRepeatedEvent(event, key, KeyEventType.keypress)) {
      return;
    }

    const currentCombination = this.getCurrentCombination();
    const eventIsSimulated = currentCombination.isKeyPressSimulated(key);

    if (this._logEventAlreadySimulated(eventIsSimulated, key, event, KeyEventType.keypress)){
      return;
    }

    /**
     * We first decide if the keypress event should be handled (to ensure the correct
     * order of logging statements)
     */
    const reactAppResponse = this._howReactAppRespondedTo(
      event, key, KeyEventType.keypress
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
        this._logEventRejectedByFilter(event, key, KeyEventType.keypress);

        return;
      }
    }

    this._callHandlerIfNeeded(reactAppResponse, event, key, KeyEventType.keypress);
  }

  _callHandlerIfNeeded(reactAppResponse, event, key, eventType) {
    if (!contains([EventResponse.ignored, EventResponse.handled], reactAppResponse)) {
      this._callHandlerIfExists(event, key, eventType);
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
    const eventIsSimulated = currentCombination.isKeyUpSimulated(key);

    if (this._logEventAlreadySimulated(eventIsSimulated, key, event, KeyEventType.keyup)){
      return;
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
        this._logIgnoredKeyEvent(event, key, KeyEventType.keyup, 'ignoreEventsFilter rejected it');
      } else {
        this._callHandlerIfNeeded(reactAppResponse, event, key, KeyEventType.keyup);
      }

    } else {
      this._callHandlerIfNeeded(reactAppResponse, event, key, KeyEventType.keyup);
    }

    /**
     * We simulate any hidden keyup events hidden by the command key, regardless
     * of whether the event should be ignored or not
     */
    this._simulateKeyUpEventsHiddenByCmd(event, key);

    if (this.listeners.get('keyCombination') && this._allKeysAreReleased()) {
      this.listeners.get('keyCombination')({
        keys: currentCombination.getKeyDictionary(),
        id: currentCombination.describe()
      });
    }
  }

  _logEventAlreadySimulated(eventIsSimulated, key, event, eventType) {
    if (eventIsSimulated) {
      this._logIgnoredKeyEvent(
        event, key, eventType,
        'it was not expected, and has already been simulated'
      );

      return true;
    }

    return false;
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

        this._simulator.handleKeyUpSimulation({event, key: keyName});
      });
    }
  }

  _startAndLogNewKeyCombination(keyName, keyEventState) {
    this.getKeyHistory().startNewKeyCombination(keyName, keyEventState);

    this.logger.verbose(
      this._logPrefix(),
      `Started a new combination with '${keyName}'.`
    );

    this._logKeyHistory();
  }

  _logKeyHistory() {
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

    this._logKeyHistory();
  }

  /********************************************************************************
   * Matching and calling handlers
   ********************************************************************************/

  _callHandlerIfExists(event, keyName, keyEventType) {
    const eventName = describeKeyEventType(keyEventType);
    const combinationName = this.getCurrentCombination().describe();

    if (!this._componentList.anyActionsForEventType(keyEventType)) {
      /**
       * If there are no handlers registered for the particular key event type
       * (keydown, keypress, keyup) then skip trying to find a matching handler
       * for the current key combination
       */
      this._logIgnoredEvent(
        `'${combinationName}' ${eventName}`,
        `it doesn't have any ${eventName} handlers`
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
    const componentListIterator = this._componentList.getNewIterator();

    while (componentListIterator.next()) {
      const matchFound = super._callClosestMatchingHandler(
        event, keyName, keyEventType,
        componentListIterator.getPosition(),
        0
      );

      if (matchFound) {
        this.logger.debug(this._logPrefix(), `Searching no further, as handler has been found (and called).`);

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
      this.listeners.remove('keyCombination');
    };

    this.listeners.set('keyCombination', (keyCombination) => {
      callbackFunction(keyCombination);
      cancel();
    });

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
