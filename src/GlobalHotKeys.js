import PropTypes from 'prop-types';
import { Component } from 'react';
import Configuration from './lib/Configuration';
import KeyEventManager from './lib/KeyEventManager';
import backwardsCompatibleContext from './utils/backwardsCompatibleContext';

class GlobalHotKeys extends Component {
  static propTypes = {
    /**
     * A map from action names to Mousetrap or Browser key sequences
     * @type {KeyMap}
     */
    keyMap: PropTypes.object,

    /**
     * A map from action names to event handler functions
     * @typedef {Object<ActionName, Function>} HandlersMap
     */

    /**
     * A map from action names to event handler functions
     * @type {HandlersMap}
     */
    handlers: PropTypes.object,

    /**
     * Whether the keyMap or handlers are permitted to change after the
     * component mounts. If false, changes to the keyMap and handlers
     * props will be ignored
     */
    allowChanges: PropTypes.bool
  };

  constructor(props) {
    super(props);

    this._id = KeyEventManager.getInstance().registerGlobalKeyMap(props.keyMap);

    /**
     * We maintain a separate instance variable to contain context that will be
     * passed down to descendants of this component so we can have a consistent
     * reference to the same object, rather than instantiating a new one on each
     * render, causing unnecessary re-rendering of descendant components that
     * consume the context.
     *
     * @see https://reactjs.org/docs/context.html#caveats
     */
    this._childContext = { globalHotKeysParentId: this._id };
  }

  render() {
    return this.props.children || null;
  }

  componentDidUpdate() {
    const keyEventManager = KeyEventManager.getInstance();

    keyEventManager.reregisterGlobalKeyMap(this._id, this.props.keyMap);

    if (this.props.allowChanges || !Configuration.option('ignoreKeymapAndHandlerChangesByDefault')) {
      const {keyMap, handlers} = this.props;
      /**
       * Component defines global hotkeys, so any changes to props may have changes
       * that should have immediate effect
       */
      keyEventManager.updateEnabledGlobalHotKeys(
        this._id,
        keyMap,
        handlers,
        this._getComponentOptions(),
        this._getEventOptions()
      );
    }
  }

  componentDidMount() {
    const {keyMap, handlers} = this.props;
    const {globalHotKeysParentId} = this.context;

    const keyEventManager = KeyEventManager.getInstance();

    keyEventManager.registerGlobalComponentMount(this._id, globalHotKeysParentId);

    keyEventManager.enableGlobalHotKeys(
      this._id,
      keyMap,
      handlers,
      this._getComponentOptions(),
      this._getEventOptions()
    );
  }

  componentWillUnmount(){
    const keyEventManager = KeyEventManager.getInstance();

    keyEventManager.deregisterGlobalKeyMap(this._id);
    keyEventManager.disableGlobalHotKeys(this._id);

    keyEventManager.registerGlobalComponentUnmount();
  }

  _getComponentOptions() {
    return {
      defaultKeyEvent: Configuration.option('defaultKeyEvent')
    };
  }

  _getEventOptions() {
    return {
      ignoreEventsCondition: Configuration.option('ignoreEventsCondition')
    };
  }
}

export default backwardsCompatibleContext(GlobalHotKeys, {
  deprecatedAPI: {
    contextTypes: {
      globalHotKeysParentId: PropTypes.number,
    },
    childContextTypes: {
      globalHotKeysParentId: PropTypes.number,
    },
  },
  newAPI: {
    contextType: { globalHotKeysParentId: undefined },
  }
});
