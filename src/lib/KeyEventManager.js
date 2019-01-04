import Logger from './Logger';
import FocusOnlyKeyEventStrategy from './strategies/FocusOnlyKeyEventStrategy';
import GlobalKeyEventStrategy from './strategies/GlobalKeyEventStrategy';
import isFromFocusOnlyComponent from '../helpers/resolving-handlers/isFromFocusOnlyComponent';
import Configuration from './Configuration';

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
    this.logger = configuration.logger || new Logger(Configuration.option('logLevel'));

    this.focusOnlyEventStrategy =
      new FocusOnlyKeyEventStrategy({ configuration, logger: this.logger }, this);

    this.globalEventStrategy =
      new GlobalKeyEventStrategy({ configuration, logger: this.logger }, this);

    this.lastEventSeen = null;
  }

  /********************************************************************************
   * Focus key events
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
    return this.focusOnlyEventStrategy.addHotKeys(
      actionNameToKeyMap,
      actionNameToHandlersMap,
      options
    );
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
    return this.focusOnlyEventStrategy.updateHotKeys(
      focusTreeId,
      componentId,
      actionNameToKeyMap,
      actionNameToHandlersMap,
      options
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
    return this.focusOnlyEventStrategy.removeHotKeys(
      focusTreeId, componentId
    )
  }

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
    if (isFromFocusOnlyComponent(focusTreeId)) {
      return this.focusOnlyEventStrategy.handleKeydown(event, focusTreeId, componentId, options);
    }

    this._recordLastSeenEvent(event);
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
    if (isFromFocusOnlyComponent(focusTreeId)) {
      return this.focusOnlyEventStrategy.handleKeypress(event, focusTreeId, componentId, options);
    }

    this._recordLastSeenEvent(event);
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
    if (isFromFocusOnlyComponent(focusTreeId)) {
      return this.focusOnlyEventStrategy.handleKeyup(event, focusTreeId, componentId, options);
    }

    this._recordLastSeenEvent(event);
  }

  _recordLastSeenEvent({key, type, nativeEvent}) {
    this.lastEventSeen = {
      key, type, nativeEvent
    }
  }

  /********************************************************************************
   * Global key events
   ********************************************************************************/

  /**
   * Registers the actions and handlers of a HotKeys component that has mounted
   * @param {KeyMap} actionNameToKeyMap - Map of actions to key expressions
   * @param {HandlersMap} actionNameToHandlersMap - Map of actions to handler functions
   * @param {Object} options Hash of options that configure how the actions
   *        and handlers are associated and called.
   * @param {Object} eventOptions - Options for how the event should be handled
   * @returns {ComponentId} A unique component ID to assign to the focused HotKeys
   *        component and passed back when handling a key event
   */
  addGlobalHotKeys(actionNameToKeyMap = {}, actionNameToHandlersMap = {}, options, eventOptions) {
    return this.globalEventStrategy.addHotKeys(
      actionNameToKeyMap,
      actionNameToHandlersMap,
      options,
      eventOptions
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
  updateGlobalHotKeys(componentId, actionNameToKeyMap = {}, actionNameToHandlersMap = {}, options, eventOptions) {
    return this.globalEventStrategy.updateHotKeys(
      componentId,
      actionNameToKeyMap,
      actionNameToHandlersMap,
      options,
      eventOptions
    );
  }

  /**
   * Handles when a component is unmounted
   * @param {ComponentId} componentId - Index of component that is being unmounted
   */
  removeGlobalHotKeys(componentId) {
    return this.globalEventStrategy.removeHotKeys(componentId);
  }

  /**
   * Records a keydown keyboard event and matches it against the list of pre-registered
   * event handlers, calling the first matching handler with the highest priority if
   * one exists.
   *
   * This method is called once when a keyboard event bubbles up to document, and checks
   * the keymaps for all of the mounted global HotKey components.
   * @param {KeyboardEvent} event - Event containing the key name and state
   */
  handleGlobalKeydown(event) {
    return this.globalEventStrategy.handleKeydown(event);
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
  handleGlobalKeypress(event) {
    return this.globalEventStrategy.handleKeypress(event);
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
  handleGlobalKeyup(event) {
    return this.globalEventStrategy.handleKeyup(event);
  }

  reactAppHistoryWithEvent(key, type) {
    const { currentEvent } = this.focusOnlyEventStrategy;

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

  simulatePendingKeyPressEvents() {
    this.focusOnlyEventStrategy.simulatePendingKeyPressEvents();
  }

  isGlobalListenersBound() {
    return this.globalEventStrategy.listenersBound;
  }
}

export default KeyEventManager;
