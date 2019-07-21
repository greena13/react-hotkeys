import Logger from './logging/Logger';
import FocusOnlyKeyEventStrategy from './strategies/FocusOnlyKeyEventStrategy';
import GlobalKeyEventStrategy from './strategies/GlobalKeyEventStrategy';
import Configuration from './config/Configuration';
import EventResponse from '../const/EventResponse';
import ApplicationKeyMapBuilder from './definitions/ApplicationKeyMapBuilder';
import lazyLoadAttribute from '../utils/object/lazyLoadAttribute';

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
    return lazyLoadAttribute(this, 'instance', () => new KeyEventManager(configuration));
  }

  static getFocusOnlyEventStrategy() {
    return this.getInstance().getFocusOnlyEventStrategy();
  }

  static getGlobalEventStrategy() {
    return this.getInstance().getGlobalEventStrategy()
  }

  static clear() {
    delete this.instance;
  }

  /**
   * Creates a new KeyEventManager instance. It is expected that only a single instance
   * will be used with a render tree.
   */
  constructor(configuration = {}) {
    const logLevel = Configuration.option('logLevel');

    this.logger = configuration.logger || new Logger(logLevel);

    this._focusOnlyEventStrategy =
      new FocusOnlyKeyEventStrategy({ configuration, logLevel }, this);

    this._globalEventStrategy =
      new GlobalKeyEventStrategy({ configuration, logLevel }, this);

    this.mountedComponentsCount = 0;
  }

  getFocusOnlyEventStrategy() {
    return this._focusOnlyEventStrategy;
  }

  getGlobalEventStrategy() {
    return this._globalEventStrategy;
  }

  /********************************************************************************
   * Generating key maps
   ********************************************************************************/

  /**
   * Returns a mapping of all of the application's actions and the key sequences
   * needed to trigger them.
   *
   * @returns {ApplicationKeyMap} The application's key map
   */
  getApplicationKeyMap() {
    return [this.getGlobalEventStrategy(), this.getFocusOnlyEventStrategy()].reduce((memo, strategy) => {
      const builder = new ApplicationKeyMapBuilder(strategy.getComponentTree());
      const keyMap = builder.build();

      return { ...memo, ...keyMap };
    }, {});
  }

  /********************************************************************************
   * Registering key maps
   ********************************************************************************/

  /**
   * Registers that a component has now mounted, and declares its parent HotKeys
   * component id so that actions may be properly resolved
   * @param {ComponentId} componentId - Id of the component that has mounted
   * @param {ComponentId} parentId - Id of the parent HotKeys component
   */
  registerComponentMount(componentId, parentId) {
    this._incrementComponentCount();

    return this.getFocusOnlyEventStrategy().registerComponentMount(componentId, parentId);
  }

  registerComponentUnmount() {
    this._decrementComponentCount();
  }

  _incrementComponentCount(){
    const preMountedComponentCount = this.mountedComponentsCount;
    this.mountedComponentsCount += 1;

    if (preMountedComponentCount === 0 && this.mountedComponentsCount === 1) {
      window.onblur = () => this._clearKeyHistory();
    }
  }

  _decrementComponentCount(){
    const preMountedComponentCount = this.mountedComponentsCount;
    this.mountedComponentsCount -= 1;

    if (preMountedComponentCount === 1 && this.mountedComponentsCount === 0) {
      delete window.onblur;
    }
  }

  _clearKeyHistory() {
    this.logger.info('HotKeys: Window focused - clearing key history');

    this.getFocusOnlyEventStrategy().resetKeyHistory({ force: true });
    this.getGlobalEventStrategy().resetKeyHistory({ force: true });
  }

  registerGlobalComponentUnmount() {
    this._decrementComponentCount();
  }

  /**
   * Registers that a component has now mounted, and declares its parent GlobalHotKeys
   * component id so that actions may be properly resolved
   * @param {ComponentId} componentId - Id of the component that has mounted
   * @param {ComponentId} parentId - Id of the parent GlobalHotKeys component
   */
  registerGlobalComponentMount(componentId, parentId) {
    this._incrementComponentCount();

    return this.getGlobalEventStrategy().registerComponentMount(componentId, parentId);
  }

  /********************************************************************************
   * Recording key combination
   ********************************************************************************/

  /**
   * Adds a listener function that will be called the next time a key combination completes
   * @param {keyCombinationListener} callbackFunction Listener function to be called
   * @returns {function} Function to call to cancel listening to the next key combination
   */
  addKeyCombinationListener(callbackFunction) {
    return this.getGlobalEventStrategy().addKeyCombinationListener(callbackFunction);
  }

  /********************************************************************************
   * Global key events
   ********************************************************************************/

  /**
   * Ignores the next keyboard event immediately, rather than waiting for it to
   * match the ignoreEventsCondition
   * @param {KeyboardEvent} event keyboard event to ignore
   * @see Configuration.ignoreEventsCondition
   */
  ignoreEvent(event) {
    this.getFocusOnlyEventStrategy().getEventPropagator().ignoreEvent(event);
  }

  /**
   * Forces the observation of the next keyboard event immediately, disregarding whether
   * the event matches the ignoreKeyEventsCondition
   * @param {KeyboardEvent} event keyboard event to force the observation of
   * @see Configuration.ignoreEventsCondition
   */
  observeIgnoredEvents(event) {
    this.getFocusOnlyEventStrategy().getEventPropagator().observeIgnoredEvents(event);
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
    this.getFocusOnlyEventStrategy().closeHangingKeyCombination(keyName, recordIndex);
  }

  reactAppHistoryWithEvent(key, type) {
    const previousPropagation =
      this.getFocusOnlyEventStrategy().eventPropagator.getPreviousPropagation();

    if (previousPropagation.isForKey(key) && previousPropagation.isForEventType(type)) {
      if (previousPropagation.isHandled()) {
        return EventResponse.handled;
      } else if (previousPropagation.isIgnoringEvent()) {
        return EventResponse.ignored;
      } else {
        return EventResponse.seen;
      }
    } else {
      return EventResponse.unseen;
    }
  }

  simulatePendingKeyPressEvents() {
    this.getFocusOnlyEventStrategy().simulatePendingKeyPressEvents();
  }

  simulatePendingKeyUpEvents() {
    this.getFocusOnlyEventStrategy().simulatePendingKeyUpEvents();
  }

  isGlobalListenersBound() {
    return this.getGlobalEventStrategy().isListenersBound();
  }
}

export default KeyEventManager;
