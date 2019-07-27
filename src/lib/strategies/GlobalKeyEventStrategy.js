import KeyEventType from '../../const/KeyEventType';
import AbstractKeyEventStrategy from './AbstractKeyEventStrategy';
import describeKeyEventType from '../../helpers/logging/describeKeyEventType';
import KeyEventCounter from '../listening/KeyEventCounter';
import getKeyName from '../../helpers/resolving-handlers/getKeyName';
import Configuration from '../config/Configuration';
import describeKeyEvent from '../../helpers/logging/describeKeyEvent';
import isCmdKey from '../../helpers/parsing-key-maps/isCmdKey';
import EventResponse from '../../const/EventResponse';
import contains from '../../utils/collection/contains';
import stateFromEvent from '../../helpers/parsing-key-maps/stateFromEvent';
import GlobalKeyEventSimulator from '../simulation/GlobalKeyEventSimulator';
import GlobalEventListenerAdaptor from '../listening/GlobalEventListenerAdaptor';
import Registry from '../shared/Registry';
import GlobalLogger from '../logging/GlobalLogger';
import KeyCombinationDecorator from '../listening/KeyCombinationDecorator';
import KeyCombinationIterator from '../listening/KeyCombinationIterator';

/**
 * Defines behaviour for dealing with key maps defined in global HotKey components
 * @class
 */
class GlobalKeyEventStrategy extends AbstractKeyEventStrategy {
  /********************************************************************************
   * Init & Reset
   ********************************************************************************/

  constructor(options = {}, keyEventManager) {
    /**
     * Set state that gets cleared every time a component gets mounted or unmounted
     */
    super(options, keyEventManager);

    this.logger = new GlobalLogger(options.logLevel || 'warn', this);

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

    this._listenerAdaptor = new GlobalEventListenerAdaptor(this, { logger: this.logger });
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
      componentId, actionNameToKeyMap, actionNameToHandlersMap, 'Mounted', options
    );
  }

  /**
   * Handles when a mounted global HotKeys component updates its props and changes
   * either the keyMap or handlers prop value
   * @param {ComponentId} componentId - The component index of the component to
   *        update
   * @param {KeyMap} keyMap - Map of actions to key expressions
   * @param {HandlersMap} handlersMap - Map of actions to handler functions
   * @param {Object} options Hash of options that configure how the actions
   *        and handlers are associated and called.
   * @param {Object} eventOptions - Options for how the event should be handled
   */
  updateEnabledHotKeys(componentId, keyMap = {}, handlersMap = {}, options, eventOptions) {
    this.eventOptions = eventOptions;

    this._updateComponent(componentId, keyMap, handlersMap, options);
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

    this.logger.debug(
      this.logger.nonKeyEventPrefix(componentId),
      `Unmounted global component ${componentId}`
    );

    this._recalculate();
  }

  _recalculate() {
    super._recalculate();

    this._updateDocumentHandlers();
  }

  _updateDocumentHandlers(){
    const listenersShouldBeBound = this._shouldListenersBeBound();
    const listenersAreBound = this.isListenersBound();

    if (!listenersAreBound && listenersShouldBeBound) {
      this._listenerAdaptor.bindListeners();
    } else if (listenersAreBound && !listenersShouldBeBound) {
      this._listenerAdaptor.unbindListeners();
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
    return this.componentList.length !== 0 || this.listeners.get('keyCombination');
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
   * @param {SyntheticKeyboardEvent} event - Event containing the key name and state
   */
  handleKeyDown(event) {
    const key = getKeyName(event);

    if (this._isIgnoringRepeatedEvent(event, key, KeyEventType.keydown)) {
      return;
    }

    this.currentCombination.resolveModifierFlagDiscrepancies(event, key, KeyEventType.keydown);

    const reactAppResponse =
      this._howReactAppRespondedTo(event, key, KeyEventType.keydown);

    if (reactAppResponse === EventResponse.unseen && this.eventOptions.ignoreEventsCondition(event)) {
      this.logger.logEventRejectedByFilter(event, key, KeyEventType.keydown);

      return;
    }

    if (reactAppResponse !== EventResponse.ignored) {
      this._recordKeyDown(event, key);
    }

    this._callHandlerIfNeeded(reactAppResponse, event, key, KeyEventType.keydown);

    this.keyEventManager.simulatePendingKeyPressEvents();
    this._simulator.handleKeyPressSimulation({event, key});
  }

  _howReactAppRespondedTo(event, key, keyEventType) {
    const reactAppHistoryWithEvent =
      this.keyEventManager.reactAppHistoryWithEvent(key, keyEventType);

    switch(reactAppHistoryWithEvent) {
      case EventResponse.handled:
        this.logger.logIgnoredKeyEvent(event, key, keyEventType, 'React app has already handled it');

        break;

      case EventResponse.ignored:
        this.logger.logIgnoredKeyEvent(event, key, keyEventType, 'React app has declared it should be ignored');

        break;

      case EventResponse.seen:
        this.logger.debug(
          this.logger.keyEventPrefix(),
          `Received ${describeKeyEvent(event, key, keyEventType)} event (that has already passed through React app).`
        );

        break;

      default:
        KeyEventCounter.incrementId();

        this.logger.debug(
          this.logger.keyEventPrefix(),
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
   * @param {SyntheticKeyboardEvent} event - Event containing the key name and state
   */
  handleKeyPress(event) {
    const key = getKeyName(event);

    if (this._isIgnoringRepeatedEvent(event, key, KeyEventType.keypress)) {
      return;
    }

    const currentCombination = this.currentCombination;

    if (currentCombination.isKeyPressSimulated(key)){
      this.logger.logEventAlreadySimulated(event, key, KeyEventType.keypress);

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
      this._addToAndLogCurrentKeyCombination(key, KeyEventType.keypress, stateFromEvent(event));
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
        this.logger.logEventRejectedByFilter(event, key, KeyEventType.keypress);

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
   * @param {SyntheticKeyboardEvent} event - Event containing the key name and state
   */
  handleKeyUp(event) {
    const key = getKeyName(event);

    const currentCombination = this.currentCombination;

    if (currentCombination.isKeyUpSimulated(key)){
      this.logger.logEventAlreadySimulated(event, key, KeyEventType.keyup);

      return;
    }

    /**
     * We first decide if the keyup event should be handled (to ensure the correct
     * order of logging statements)
     */
    const reactAppResponse = this._howReactAppRespondedTo(event, key, KeyEventType.keyup);

    /**
     * We then add the keyup to our current combination - regardless of whether
     * it's to be handled or not. We need to do this to ensure that if a handler
     * function changes focus to a context that ignored events, the keyup event
     * is not lost (leaving react hotkeys thinking the key is still pressed).
     */
    if (currentCombination.isKeyIncluded(key)) {
      this._addToAndLogCurrentKeyCombination(key, KeyEventType.keyup, stateFromEvent(event));
    }

    if (reactAppResponse === EventResponse.unseen){
      /**
       * If the key event has not been seen by the React application, we ensure that
       * it's not still waiting for it. This occurs when action handlers bound to keydown
       * or keypress move the focus outside of the react app before it can record the keyup
       */
      this.keyEventManager.closeHangingKeyCombination(key, KeyEventType.keyup);

      if(this.eventOptions.ignoreEventsCondition(event)) {
        this.logger.logIgnoredKeyEvent(event, key, KeyEventType.keyup, 'ignoreEventsFilter rejected it');
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

    if (this.listeners.get('keyCombination') && this.currentCombination.hasEnded()) {
      const keyCombinationDecorator = new KeyCombinationDecorator(this.currentCombination);

      this.listeners.get('keyCombination')({
        keys: keyCombinationDecorator.asKeyDictionary(),
        id: keyCombinationDecorator.describe()
      });
    }
  }

  _simulateKeyUpEventsHiddenByCmd(event, key) {
    if (isCmdKey(key)) {
      /**
       * We simulate pending key events in the React app before we do it globally
       */
      this.keyEventManager.simulatePendingKeyUpEvents();

      const iterator = new KeyCombinationIterator(this.currentCombination);

      iterator.forEachKey((keyName) => {
        if (isCmdKey(keyName)) {
          return;
        }

        this._simulator.handleKeyUpSimulation({event, key: keyName});
      });
    }
  }

  /********************************************************************************
   * Matching and calling handlers
   ********************************************************************************/

  _callHandlerIfExists(event, keyName, keyEventType) {
    const eventName = describeKeyEventType(keyEventType);
    const combinationName = this._describeCurrentCombination();

    if (!this.componentList.anyActionsForEventType(keyEventType)) {
      /**
       * If there are no handlers registered for the particular key event type
       * (keydown, keypress, keyup) then skip trying to find a matching handler
       * for the current key combination
       */
      this.logger.logIgnoredEvent(`'${combinationName}' ${eventName}`, `it doesn't have any ${eventName} handlers`);

      return;
    }

    /**
     * If there is at least one handler for the specified key event type (keydown,
     * keypress, keyup), then attempt to find a handler that matches the current
     * key combination
     */
    this.logger.verbose(
      this.logger.keyEventPrefix(),
      `Attempting to find action matching '${combinationName}' ${eventName} . . .`
    );

    this._callClosestMatchingHandler(event, keyName, keyEventType);
  }

  _callClosestMatchingHandler(event, keyName, keyEventType) {
    const componentListIterator = this.componentList.iterator;

    while (componentListIterator.next()) {
      const matchFound = this.actionResolver.callClosestMatchingHandler(
        event, keyName, keyEventType,
        componentListIterator.position,
        0
      );

      if (matchFound) {
        this.logger.debug(this.logger.keyEventPrefix(), `Searching no further, as handler has been found (and called).`);

        return;
      }
    }
  }

  stopEventPropagation(event, componentId) {
    this.logger.debug(
      this.logger.keyEventPrefix(componentId),
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
}


export default GlobalKeyEventStrategy;
