import KeyEventManager from '../KeyEventManager';
import Configuration from '../config/Configuration';

class GlobalComponentManager {
  static _getComponentOptions() {
    return {
      defaultKeyEvent: Configuration.option('defaultKeyEvent')
    };
  }

  static _getEventOptions() {
    return {
      ignoreEventsCondition: Configuration.option('ignoreEventsCondition')
    };
  }

  constructor(keyMap) {
    this.id = KeyEventManager.getGlobalEventStrategy().registerKeyMap(keyMap);

    /**
     * We maintain a separate instance variable to contain context that will be
     * passed down to descendants of this component so we can have a consistent
     * reference to the same object, rather than instantiating a new one on each
     * render, causing unnecessary re-rendering of descendant components that
     * consume the context.
     *
     * @see https://reactjs.org/docs/context.html#caveats
     */
    this.childContext = { globalHotKeysParentId: this.id };
  }

  addHotKeys(props, context) {
    const {keyMap, handlers} = props;
    const {globalHotKeysParentId} = context;

    KeyEventManager.getInstance().registerGlobalComponentMount(this.id, globalHotKeysParentId);

    KeyEventManager.getGlobalEventStrategy().enableHotKeys(
      this.id,
      keyMap,
      handlers,
      GlobalComponentManager._getComponentOptions(),
      GlobalComponentManager._getEventOptions()
    );
  }

  updateHotKeys(props) {
    const keyEventManager = KeyEventManager.getGlobalEventStrategy();

    keyEventManager.reregisterKeyMap(this.id, props.keyMap);

    if (props.allowChanges || !Configuration.option('ignoreKeymapAndHandlerChangesByDefault')) {
      const {keyMap, handlers} = props;
      /**
       * Component defines global hotkeys, so any changes to props may have changes
       * that should have immediate effect
       */
      keyEventManager.updateEnabledHotKeys(
        this.id,
        keyMap,
        handlers,
        GlobalComponentManager._getComponentOptions(),
        GlobalComponentManager._getEventOptions()
      );
    }
  }


  removeKeyMap() {
    const keyEventManager = KeyEventManager.getGlobalEventStrategy();

    keyEventManager.deregisterKeyMap(this.id);
    keyEventManager.disableHotKeys(this.id);

    KeyEventManager.getInstance().registerGlobalComponentUnmount();
  }
}

export default GlobalComponentManager;
