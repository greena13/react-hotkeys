import Logger from './Logger';
import FocusKeyEventManager from './FocusKeyEventManager';
import GlobalKeyEventManager from './GlobalKeyEventManager';
import HotKeys from '../HotKeys';

/**
 * Provides a registry for keyboard sequences and events, and the handlers that should
 * be called when they are detected. Also contains the interface for processing and
 * matching keyboard events against its list of registered actions and handlers.
 * @class
 */
class KeyEventManager {
  /**
   * Creates a new KeyEventManager instance if one does not already exist or returns the
   * instance that already exists.
   * @param {Object} configuration Configuration object
   * @param {Logger} configuration.logger Logger instance
   * @returns {KeyEventManager} The key event manager instance
   */
  static getInstance(configuration = {}) {
    if (!this.instance) {
      this.instance = new KeyEventManager(configuration);
    }

    return this.instance;
  }

  static clear() {
    delete this.instance;
  }

  /**
   * Creates a new KeyEventManager instance. It is expected that only a single instance
   * will be used with a render tree.
   */
  constructor(configuration = {}) {
    this.logger = configuration.logger || new Logger('warn');

    this.focusEventManager = new FocusKeyEventManager({ configuration, logger: this.logger });
    this.globalEventManager = new GlobalKeyEventManager({ configuration, logger: this.logger }, this);
  }

  /********************************************************************************
   * Focus key events
   ********************************************************************************/

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
    return this.focusEventManager.addHotKeys(
      actionNameToKeyMap,
      actionNameToHandlersMap,
      options
    );
  }

  updateHotKeys(focusTreeId, componentIndex, actionNameToKeyMap = {}, actionNameToHandlersMap = {}, options) {
    return this.focusEventManager.updateHotKeys(
      focusTreeId,
      componentIndex,
      actionNameToKeyMap,
      actionNameToHandlersMap,
      options
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
    return this.focusEventManager.removeHotKeys(
      focusTreeId, componentIndex
    )
  }

  handleKeydown(event, focusTreeId, componentIndex, options) {
    return this.focusEventManager.handleKeydown(event, focusTreeId, componentIndex, options);
  }

  handleKeypress(event, focusTreeId, componentIndex, options) {
    return this.focusEventManager.handleKeypress(event, focusTreeId, componentIndex, options);
  }

  handleKeyup(event, focusTreeId, componentIndex, options) {
    return this.focusEventManager.handleKeyup(event, focusTreeId, componentIndex, options);
  }

  /********************************************************************************
   * Global key events
   ********************************************************************************/

  addGlobalHotKeys(actionNameToKeyMap = {}, actionNameToHandlersMap = {}, options) {
    return this.globalEventManager.addHotKeys(
      actionNameToKeyMap,
      actionNameToHandlersMap,
      options
    );
  }

  updateGlobalHotKeys(componentIndex, actionNameToKeyMap = {}, actionNameToHandlersMap = {}, options) {
    return this.globalEventManager.updateHotKeys(
      componentIndex,
      actionNameToKeyMap,
      actionNameToHandlersMap,
      options
    );
  }

  removeGlobalHotKeys(componentIndex) {
    return this.globalEventManager.removeHotKeys(componentIndex);
  }

  handleGlobalKeydown(event) {
    return this.globalEventManager.handleKeydown(event, this._getGlobalEventOptions());
  }

  handleGlobalKeypress(event) {
    return this.globalEventManager.handleKeypress(event, this._getGlobalEventOptions());
  }

  handleGlobalKeyup(event) {
    return this.globalEventManager.handleKeyup(event, this._getGlobalEventOptions());
  }

  _getGlobalEventOptions() {
    return {
      ignoreEventsCondition: HotKeys.ignoreEventsCondition
    }
  }

  reactAppHistoryWithEvent(key, type) {
    const { currentEvent } = this.focusEventManager;

    if (currentEvent.key === key && currentEvent.type === type) {
      if (currentEvent.handled) {
        return 'handled';
      } else {
        return 'seen';
      }
    } else {
      return 'unseen';
    }
  }
}

export default KeyEventManager;
