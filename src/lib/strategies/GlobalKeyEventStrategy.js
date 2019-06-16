import KeyEventRecordManager from '../KeyEventRecordManager';
import KeyEventRecordIndex from '../../const/KeyEventRecordIndex';
import AbstractKeyEventStrategy from './AbstractKeyEventStrategy';
import capitalize from '../../utils/string/capitalize';
import describeKeyEventType from '../../helpers/logging/describeKeyEventType';
import KeyEventCounter from '../KeyEventCounter';
import Logger from '../Logger';
import removeAtIndex from '../../utils/array/removeAtIndex';
import isUndefined from '../../utils/isUndefined';
import printComponent from '../../helpers/logging/printComponent';
import getKeyName from '../../helpers/resolving-handlers/getKeyName';
import Configuration from '../Configuration';
import describeKeyEvent from '../../helpers/logging/describeKeyEvent';
import isCmdKey from '../../helpers/parsing-key-maps/isCmdKey';
import EventResponse from '../../const/EventResponse';
import contains from '../../utils/collection/contains';
import dictionaryFrom from '../../utils/object/dictionaryFrom';

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

    this._addComponentToList(
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
      printComponent(this._getComponent(componentId))
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

    const componentPosition = this._getComponentPosition(componentId);

    /**
     * Manually update the registered key map state, usually reset using
     * _resetRegisteredKeyMapsState() method
     */

    this.componentList[componentPosition] = this._buildComponentOptions(
      componentId,
      actionNameToKeyMap,
      actionNameToHandlersMap,
      options
    );

    this._updateLongestKeySequenceIfNecessary(componentId);

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
      printComponent(this._getComponent(componentId))
    );
  }

  /**
   * Handles when a component is unmounted
   * @param {ComponentId} componentId - Index of component that is being unmounted
   */
  disableHotKeys(componentId) {
    const [{ keyMapEventRecord }, componentPosition ] =
      this._getComponentAndPosition(componentId);

    /**
     * Manually update the registered key map state, usually reset using
     * _resetRegisteredKeyMapsState() method
     */
    this.componentList = removeAtIndex(this.componentList, componentPosition);

    this._updateLongestKeySequenceIfNecessary(componentId);

    /**
     * Reset strategy state specific to the global strategy
     */
    this._updateComponentIndexDictFromList({ startingAt: componentPosition });

    this._updateDocumentHandlers(
      keyMapEventRecord,
      KeyEventRecordManager.newRecord()
    );

    /**
     * Reset handler resolution state
     */
    this._initHandlerResolutionState();

    this.logger.debug(
      this._logPrefix(componentId, {eventId: false}),
      `Unmounted global component ${componentId}`
    );
  }

  _updateLongestKeySequenceIfNecessary(componentId) {
    if (componentId === this.longestSequenceComponentIndex) {
      this.longestSequence = 1;

      this.componentList.forEach(({longestSequence}) => {
        if(longestSequence > this.longestSequence) {
          this.longestSequence = longestSequence;
        }
      });
    }
  }

  _updateComponentIndexDictFromList(options = { startingAt: 0 }) {
    let counter = options.startingAt;

    while(counter < this.componentList.length) {
      this._setComponentPosition(this.componentList[counter].componentId, counter);
      counter++;
    }
  }

  _updateDocumentHandlers(){
    const listenersShouldBeBound = this._listenersShouldBeBound();

    if (!this.listenersBound && listenersShouldBeBound) {
      for(let recordIndex = 0; recordIndex < this.keyMapEventRecord.length; recordIndex++) {
        const eventName = describeKeyEventType(recordIndex);

        document[`on${eventName}`] = (keyEvent) => {
          this.keyEventManager[`handleGlobal${capitalize(eventName)}`](keyEvent);
        };

        this.logger.debug(
          this._logPrefix(this.componentId, {eventId: false}),
          `Bound handler handleGlobal${capitalize(eventName)}() to document.on${eventName}()`
        );
      }

      this.listenersBound = true;

    } else if(this.listenersBound && !listenersShouldBeBound) {

      for(let recordIndex = 0; recordIndex < this.keyMapEventRecord.length; recordIndex++) {
        const eventName = describeKeyEventType(recordIndex);

        delete document[`on${eventName}`];

        this.logger.debug(
          this._logPrefix(this.componentId, {eventId: false}),
          `Removed handler handleGlobal${capitalize(eventName)}() from document.on${eventName}()`
        );
      }

      this.listenersBound = false;
    }
  }

  _listenersShouldBeBound() {
    return this.componentList.length > 0 || this.listeners.keyCombination;
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
  handleKeydown(event) {
    const _key = getKeyName(event);

    if (event.repeat && Configuration.option('ignoreRepeatedEventsWhenKeyHeldDown')) {
      this.logger.debug(
        this._logPrefix(),
        `Ignored repeated ${describeKeyEvent(event, _key, KeyEventRecordIndex.keydown)} event.`
      );

      return true;
    }

    this._checkForModifierFlagDiscrepancies(event, _key, KeyEventRecordIndex.keydown);

    const reactAppResponse = this._howReactAppRespondedTo(
      event,
      _key,
      KeyEventRecordIndex.keydown
    );

    if (reactAppResponse === EventResponse.unseen &&
          this.eventOptions.ignoreEventsCondition(event)) {

      this.logger.debug(
        this._logPrefix(),
        `Ignored ${describeKeyEvent(event, _key, KeyEventRecordIndex.keydown)} event because ignoreEventsFilter rejected it.`
      );

      return;
    }

    if (reactAppResponse !== EventResponse.ignored) {
      const keyInCurrentCombination = !!this._getCurrentKeyState(_key);
      const keyEventState = this._stateFromEvent(event);

      if (keyInCurrentCombination || this.keyCombinationIncludesKeyUp) {
        this._startAndLogNewKeyCombination(
          _key,
          KeyEventRecordIndex.keydown,
          keyEventState
        );
      } else {
        this._addToAndLogCurrentKeyCombination(
          _key,
          KeyEventRecordIndex.keydown,
          keyEventState
        );
      }
    }

    if (!contains([EventResponse.ignored, EventResponse.handled], reactAppResponse)) {
      this._callHandlerIfExists(event, _key, KeyEventRecordIndex.keydown);
    }

    this._simulateKeyPressesMissingFromBrowser(event, _key);
  }

  _howReactAppRespondedTo(event, key, eventRecordIndex) {
    const reactAppHistoryWithEvent =
      this.keyEventManager.reactAppHistoryWithEvent(key, eventRecordIndex);

    switch(reactAppHistoryWithEvent) {
      case EventResponse.handled:
        this.logger.debug(
          this._logPrefix(),
          `Ignored ${describeKeyEvent(event, key, eventRecordIndex)} event because React app has already handled it.`
        );

        break;

      case EventResponse.ignored:
        this.logger.debug(
          this._logPrefix(),
          `Ignored ${describeKeyEvent(event, key, eventRecordIndex)} event because React app has declared it should be ignored.`
        );

        break;

      case EventResponse.seen:
        this.logger.debug(
          this._logPrefix(),
          `Received ${describeKeyEvent(event, key, eventRecordIndex)} event (that has already passed through React app).`
        );

        break;

      default:
        KeyEventCounter.incrementId();

        this.logger.debug(
          this._logPrefix(),
          `New ${describeKeyEvent(event, key, eventRecordIndex)} event (that has NOT passed through React app).`
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
  handleKeypress(event) {
    const key = getKeyName(event);

    if (event.repeat && Configuration.option('ignoreRepeatedEventsWhenKeyHeldDown')) {
      this.logger.debug(
        this._logPrefix(),
        `Ignored repeated ${describeKeyEvent(event, key, KeyEventRecordIndex.keypress)} event.`
      );

      return true;
    }

    if (this._alreadySimulatedEvent(KeyEventRecordIndex.keypress, key)) {
      this.logger.debug(
        this._logPrefix(),
        `Ignored ${describeKeyEvent(event, key, KeyEventRecordIndex.keypress)} as it was not expected, and has already been simulated.`
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
      KeyEventRecordIndex.keypress
    );

    /**
     * Add new key event to key combination history
     */

    if (this._getCurrentKeyState(key)) {
      this._addToAndLogCurrentKeyCombination(
        key,
        KeyEventRecordIndex.keypress,
        this._stateFromEvent(event)
      );
    }

    if (reactAppResponse === EventResponse.unseen) {
      /**
       * If the key event has not been seen by the React application, we ensure that
       * it's not still waiting for it. This occurs when action handlers bound to keydown
       * move the focus outside of the react app before it can record the keypress or
       * keyup
       */
      this.keyEventManager.closeHangingKeyCombination(key, KeyEventRecordIndex.keypress);

      if (this.eventOptions.ignoreEventsCondition(event)) {
        this.logger.debug(
          this._logPrefix(),
          `Ignored ${describeKeyEvent(event, key, KeyEventRecordIndex.keypress)} event because ignoreEventsFilter rejected it.`
        );

        return;
      }
    }

    if (!contains([EventResponse.ignored, EventResponse.handled], reactAppResponse)) {
      this._callHandlerIfExists(event, key, KeyEventRecordIndex.keypress);
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
  handleKeyup(event) {
    const key = getKeyName(event);

    if (this._alreadySimulatedEvent(KeyEventRecordIndex.keyup, key)) {
      this.logger.debug(
        this._logPrefix(),
        `Ignored ${describeKeyEvent(event, key, KeyEventRecordIndex.keyup)} as it was not expected, and has already been simulated.`
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
      KeyEventRecordIndex.keyup
    );

    /**
     * We then add the keyup to our current combination - regardless of whether
     * it's to be handled or not. We need to do this to ensure that if a handler
     * function changes focus to a context that ignored events, the keyup event
     * is not lost (leaving react hotkeys thinking the key is still pressed).
     */
    if (this._getCurrentKeyState(key)) {
      this._addToAndLogCurrentKeyCombination(
        key,
        KeyEventRecordIndex.keyup,
        this._stateFromEvent(event)
      );
    }

    if (reactAppResponse === EventResponse.unseen){
      /**
       * If the key event has not been seen by the React application, we ensure that
       * it's not still waiting for it. This occurs when action handlers bound to keydown
       * or keypress move the focus outside of the react app before it can record the keyup
       */
      this.keyEventManager.closeHangingKeyCombination(key, KeyEventRecordIndex.keyup);

      if(this.eventOptions.ignoreEventsCondition(event)) {
        this.logger.debug(
          this._logPrefix(),
          `Ignored ${describeKeyEvent(event, key, KeyEventRecordIndex.keyup)} event because ignoreEventsFilter rejected it.`
        );
      } else {
        /**
         * We attempt to find a handler of the event, only if it has not already
         * been handled and should not be ignored
         */
        if (!contains([EventResponse.ignored, EventResponse.handled], reactAppResponse)) {
          this._callHandlerIfExists(event, key, KeyEventRecordIndex.keyup);
        }
      }
    } else {
      /**
       * We attempt to find a handler of the event, only if it has not already
       * been handled and should not be ignored
       */
      if (!contains([EventResponse.ignored, EventResponse.handled], reactAppResponse)) {
        this._callHandlerIfExists(event, key, KeyEventRecordIndex.keyup);
      }
    }

    /**
     * We simulate any hidden keyup events hidden by the command key, regardless
     * of whether the event should be ignored or not
     */
    this._simulateKeyUpEventsHiddenByCmd(event, key);

    if (this.listeners.keyCombination && this._allKeysAreReleased()) {
      const {keys,ids} = this._getCurrentKeyCombination();

      this.listeners.keyCombination({
        keys: dictionaryFrom(Object.keys(keys), true),
        id: ids[0]
      });
    }
  }

  _simulateKeyPressesMissingFromBrowser(event, key) {
    this.keyEventManager.simulatePendingKeyPressEvents();

    this._handleEventSimulation(
      'handleKeypress',
      this._shouldSimulate(KeyEventRecordIndex.keypress, key),
      {event, key}
    );
  }

  _simulateKeyUpEventsHiddenByCmd(event, key) {
    if (isCmdKey(key)) {
      /**
       * We simulate pending key events in the React app before we do it globally
       */
      this.keyEventManager.simulatePendingKeyUpEvents();

      Object.keys(this._getCurrentKeyCombination().keys).forEach((keyName) => {
        if (isCmdKey(keyName)) {
          return;
        }

        this._handleEventSimulation(
          'handleKeyup',
          this._shouldSimulate(KeyEventRecordIndex.keyup, keyName),
          {event, key: keyName}
        );
      });
    }
  }

  _startAndLogNewKeyCombination(keyName, eventRecordIndex, keyEventState) {
    this._startNewKeyCombination(keyName, eventRecordIndex, keyEventState);

    this.logger.verbose(
      this._logPrefix(),
      `Started a new combination with '${keyName}'.`
    );

    this.logger.verbose(
      this._logPrefix(),
      `Key history: ${printComponent(this.keyCombinationHistory)}.`
    );
  }

  _addToAndLogCurrentKeyCombination(keyName, eventRecordIndex, keyEventState) {
    this._addToCurrentKeyCombination(keyName, eventRecordIndex, keyEventState);

    if (eventRecordIndex === KeyEventRecordIndex.keydown) {
      this.logger.verbose(
        this._logPrefix(),
        `Added '${keyName}' to current combination: '${this._getCurrentKeyCombination().ids[0]}'.`
      );
    }

    this.logger.verbose(
      this._logPrefix(),
      `Key history: ${printComponent(this.keyCombinationHistory)}.`
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

  _callHandlerIfExists(event, keyName, eventRecordIndex) {
    const eventName = describeKeyEventType(eventRecordIndex);
    const combinationName = this._describeCurrentKeyCombination();

    if (this.keyMapEventRecord[eventRecordIndex]) {
      /**
       * If there is at least one handler for the specified key event type (keydown,
       * keypress, keyup), then attempt to find a handler that matches the current
       * key combination
       */
      this.logger.verbose(
        this._logPrefix(),
        `Attempting to find action matching '${combinationName}' ${eventName} . . .`
      );

      this._callMatchingHandlerClosestToEventTarget(
        event,
        keyName,
        eventRecordIndex
      );
    } else {
      /**
       * If there are no handlers registered for the particular key event type
       * (keydown, keypress, keyup) then skip trying to find a matching handler
       * for the current key combination
       */
      this.logger.debug(
        this._logPrefix(),
        `Ignored '${combinationName}' ${eventName} because it doesn't have any ${eventName} handlers.`
      );
    }
  }

  _callMatchingHandlerClosestToEventTarget(event, keyName, eventRecordIndex) {
    for(let componentPosition = 0; componentPosition < this.componentList.length; componentPosition++) {
      const matchFound = super._callMatchingHandlerClosestToEventTarget(
        event,
        keyName,
        eventRecordIndex,
        componentPosition,
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
