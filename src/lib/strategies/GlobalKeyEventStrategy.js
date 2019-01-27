import KeyEventBitmapManager from '../KeyEventBitmapManager';
import KeyEventBitmapIndex from '../../const/KeyEventBitmapIndex';
import KeyEventSequenceIndex from '../../const/KeyEventSequenceIndex';
import AbstractKeyEventStrategy from './AbstractKeyEventStrategy';
import capitalize from '../../utils/string/capitalize';
import describeKeyEventType from '../../helpers/logging/describeKeyEventType';
import KeyEventCounter from '../KeyEventCounter';
import Logger from '../Logger';
import removeAtIndex from '../../utils/array/removeAtIndex';
import isUndefined from '../../utils/isUndefined';
import getEventKey from '../../vendor/react-dom/getEventKey';
import printComponent from '../../helpers/logging/printComponent';
import normalizeKeyName from '../../helpers/resolving-handlers/normalizeKeyName';
import Configuration from '../Configuration';
import describeKeyEvent from '../../helpers/logging/describeKeyEvent';
import isCmdKey from '../../helpers/parsing-key-maps/isCmdKey';

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
    const [{ keyMapEventBitmap }, componentPosition ] =
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
      keyMapEventBitmap,
      KeyEventBitmapManager.newBitmap()
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
    const listenersShouldBeBound = this.keyMapEventBitmap.some((eventType) => eventType);

    if (!this.listenersBound && listenersShouldBeBound) {
      for(let bitmapIndex = 0; bitmapIndex < this.keyMapEventBitmap.length; bitmapIndex++) {
        const eventName = describeKeyEventType(bitmapIndex);

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

      for(let bitmapIndex = 0; bitmapIndex < this.keyMapEventBitmap.length; bitmapIndex++) {
        const eventName = describeKeyEventType(bitmapIndex);

        delete document[`on${eventName}`];

        this.logger.debug(
          this._logPrefix(this.componentId, {eventId: false}),
          `Removed handler handleGlobal${capitalize(eventName)}() from document.on${eventName}()`
        );
      }

      this.listenersBound = false;
    }
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
    this._checkForModifierFlagDiscrepancies(event);

    const _key = normalizeKeyName(getEventKey(event));

    const reactAppHistoryWithEvent =
      this.keyEventManager.reactAppHistoryWithEvent(_key, KeyEventBitmapIndex.keydown);

    if (reactAppHistoryWithEvent === 'handled') {
      this.logger.debug(
        `${this._logPrefix()} Ignored ${describeKeyEvent(event, _key, KeyEventBitmapIndex.keydown)} event because React app has already handled it.`
      );
    } else {
      if (reactAppHistoryWithEvent === 'seen') {
        this.logger.debug(
          `${this._logPrefix()} Received ${describeKeyEvent(event, _key, KeyEventBitmapIndex.keydown)} event (that has already passed through React app).`
        );

      } else {
        KeyEventCounter.incrementId();

        this.logger.debug(
          `${this._logPrefix()} New ${describeKeyEvent(event, _key, KeyEventBitmapIndex.keydown)} event (that has NOT passed through React app).`
        );
      }

      if (this.eventOptions.ignoreEventsCondition(event)) {
        this.logger.debug(
          `${this._logPrefix()} Ignored ${describeKeyEvent(event, _key, KeyEventBitmapIndex.keydown)} event because ignoreEventsFilter rejected it.`
        );

        return;
      }

      const keyInCurrentCombination = !!this._getCurrentKeyState(_key);

      if (keyInCurrentCombination || this.keyCombinationIncludesKeyUp) {
        this._startNewKeyCombination(_key, KeyEventBitmapIndex.keydown);
      } else {
        this._addToCurrentKeyCombination(_key, KeyEventBitmapIndex.keydown);
      }

      this._callHandlerIfExists(event, _key, KeyEventBitmapIndex.keydown);

      this._simulateKeyPressesMissingFromBrowser(event, _key);
    }
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
    const _key = normalizeKeyName(getEventKey(event));

    /**
     * We first decide if the keypress event should be handled (to ensure the correct
     * order of logging statements)
     */
    const shouldHandleEvent = this._shouldHandleKeyPressEvent(event, _key);

    /**
     * Add new key event to key combination history
     */

    if (this._getCurrentKeyState(_key)) {
      this._addToCurrentKeyCombination(_key, KeyEventBitmapIndex.keypress);
    }

    if (shouldHandleEvent) {
      this._callHandlerIfExists(event, _key, KeyEventBitmapIndex.keypress);
    }
  }

  _shouldHandleKeyPressEvent(event, key) {
    const reactAppHistoryWithEvent =
      this.keyEventManager.reactAppHistoryWithEvent(key, KeyEventBitmapIndex.keypress);

    if (reactAppHistoryWithEvent === 'handled') {
      this.logger.debug(
        `${this._logPrefix()} Ignored ${describeKeyEvent(event, key, KeyEventBitmapIndex.keypress)} event because React app has already handled it.`
      );

      return false;
    } else {
      if (reactAppHistoryWithEvent === 'seen') {
        this.logger.debug(
          `${this._logPrefix()} ${describeKeyEvent(event, key, KeyEventBitmapIndex.keypress)} event (that has already passed through React app).`
        );

      } else {
        KeyEventCounter.incrementId();

        this.logger.debug(
          `${this._logPrefix()} New ${describeKeyEvent(event, key, KeyEventBitmapIndex.keypress)} event (that has NOT passed through React app).`
        );
      }

      if (this.eventOptions.ignoreEventsCondition(event)) {
        this.logger.debug(
          `${this._logPrefix()} Ignored ${describeKeyEvent(event, key, KeyEventBitmapIndex.keypress)} event because ignoreEventsFilter rejected it.`
        );

        return false;
      }

      return true;
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
    const _key = normalizeKeyName(getEventKey(event));

    /**
     * We first decide if the keyup event should be handled (to ensure the correct
     * order of logging statements)
     */
    const shouldHandleEvent = this._shouldHandleKeyupEvent(event, _key);

    /**
     * We then add the keyup to our current combination - regardless of whether
     * it's to be handled or not. We need to do this to ensure that if a handler
     * function changes focus to a context that ignored events, the keyup event
     * is not lost (leaving react hotkeys thinking the key is still pressed).
     */
    if (this._getCurrentKeyState(_key)) {
      this._addToCurrentKeyCombination(_key, KeyEventBitmapIndex.keyup);
    }

    /**
     * We attempt to find a handler of the event, only if it has not already
     * been handled and should not be ignored
     */
    if (shouldHandleEvent) {
      this._callHandlerIfExists(event, _key, KeyEventBitmapIndex.keyup);
    }

    /**
     * We simulate any hidden keyup events hidden by the command key, regardless
     * of whether the event should be ignored or not
     */
    this._simulateKeyUpEventsHiddenByCmd(event, _key);
  }

  _shouldHandleKeyupEvent(event, _key) {
    const reactAppHistoryWithEvent =
      this.keyEventManager.reactAppHistoryWithEvent(_key, KeyEventBitmapIndex.keyup);

    if (reactAppHistoryWithEvent === 'handled') {
      this.logger.debug(
        `${this._logPrefix()} Ignored ${describeKeyEvent(event, _key, KeyEventBitmapIndex.keyup)} event because React app has already handled it.`
      );

      return false;
    } else {
      if (reactAppHistoryWithEvent === 'seen') {
        this.logger.debug(
          `${this._logPrefix()} ${describeKeyEvent(event, _key, KeyEventBitmapIndex.keyup)} event (that has already passed through React app).`
        );

        return true;

      } else {
        KeyEventCounter.incrementId();

        this.logger.debug(
          `${this._logPrefix()} New ${describeKeyEvent(event, _key, KeyEventBitmapIndex.keyup)} event (that has NOT passed through React app).`
        );
      }

      if (this.eventOptions.ignoreEventsCondition(event)) {
        this.logger.debug(
          `${this._logPrefix()} Ignored ${describeKeyEvent(event, _key, KeyEventBitmapIndex.keyup)} event because ignoreEventsFilter rejected it.`
        );

        return false;
      }

      return true;
    }
  }

  _simulateKeyPressesMissingFromBrowser(event, key) {
    this._handleEventSimulation(
      'simulatePendingKeyPressEvents',
      'handleKeypress',
      this._shouldSimulate(KeyEventBitmapIndex.keypress, key),
      {event, key}
    );
  }

  _simulateKeyUpEventsHiddenByCmd(event, key) {
    if (isCmdKey(key)) {
      Object.keys(this._getCurrentKeyCombination().keys).forEach((keyName) => {
        if (isCmdKey(keyName)) {
          return;
        }

        this._handleEventSimulation(
          'simulatePendingKeyUpEvents',
          'handleKeyup',
          this._shouldSimulate(KeyEventBitmapIndex.keyup, keyName),
          {event, key: keyName}
        );
      });
    }
  }

  _startNewKeyCombination(keyName, eventBitmapIndex) {
    super._startNewKeyCombination(keyName, eventBitmapIndex);

    this.logger.verbose(
      `${this._logPrefix()} Started a new combination with '${keyName}'.`
    );

    this.logger.verbose(
      `${this._logPrefix()} Key history: ${printComponent(this.keyCombinationHistory)}.`
    );
  }

  _addToCurrentKeyCombination(keyName, eventBitmapIndex) {
    super._addToCurrentKeyCombination(keyName, eventBitmapIndex);

    if (eventBitmapIndex === KeyEventBitmapIndex.keydown) {
      this.logger.verbose(
        `${this._logPrefix()} Added '${keyName}' to current combination: '${this._getCurrentKeyCombination().ids[0]}'.`
      );
    }

    this.logger.verbose(
      `${this._logPrefix()} Key history: ${printComponent(this.keyCombinationHistory)}.`
    );
  }

  /********************************************************************************
   * Event simulation
   ********************************************************************************/

  _handleEventSimulation(keyEventManagerHandlerName, handlerName, shouldSimulate, {event, key}) {
    if (shouldSimulate && Configuration.option('simulateMissingKeyPressEvents')) {
      /**
       * We simulate pending key events in the React app before we do it globally
       */
      this.keyEventManager[keyEventManagerHandlerName]();

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

  _callHandlerIfExists(event, keyName, eventBitmapIndex) {
    const eventName = describeKeyEventType(eventBitmapIndex);
    const combinationName = this._describeCurrentKeyCombination();

    if (this.keyMapEventBitmap[eventBitmapIndex]) {
      /**
       * If there is at least one handler for the specified key event type (keydown,
       * keypress, keyup), then attempt to find a handler that matches the current
       * key combination
       */
      this.logger.verbose(
        `${this._logPrefix()} Attempting to find action matching '${combinationName}' ${eventName} . . .`
      );

      this._callMatchingHandlerClosestToEventTarget(
        event,
        keyName,
        eventBitmapIndex
      );
    } else {
      /**
       * If there are no handlers registered for the particular key event type
       * (keydown, keypress, keyup) then skip trying to find a matching handler
       * for the current key combination
       */
      this.logger.debug(
        `${this._logPrefix()} Ignored '${combinationName}' ${eventName} because it doesn't have any ${eventName} handlers.`
      );
    }
  }

  _callMatchingHandlerClosestToEventTarget(event, keyName, eventBitmapIndex) {
    for(let componentPosition = 0; componentPosition < this.componentList.length; componentPosition++) {
      const matchFound = super._callMatchingHandlerClosestToEventTarget(
        event,
        keyName,
        eventBitmapIndex,
        componentPosition,
        0
      );

      if (matchFound) {
        this.logger.debug(
          `${this._logPrefix()} Searching no further, as handler has been found (and called).`
        );

        return;
      }
    }
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
