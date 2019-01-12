import PropTypes from 'prop-types';
import { Component } from 'react';
import Configuration from './lib/Configuration';
import KeyEventManager from './lib/KeyEventManager';

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
     * Function to call when this component gains focus in the browser
     * @type {Function}
     */
    onFocus: PropTypes.func,

    /**
     * Function to call when this component loses focus in the browser
     * @type {Function}
     */
    onBlur: PropTypes.func,

    /**
     * Whether the keyMap or handlers are permitted to change after the
     * component mounts. If false, changes to the keyMap and handlers
     * props will be ignored
     */
    allowChanges: PropTypes.bool
  };

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

    const keyEventManager = KeyEventManager.getInstance();

    this._id = keyEventManager.registerGlobalKeyMap(
      this.props.keyMap
    );

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
    keyEventManager.disableGlobalHotKeys(this._id)
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

export default GlobalHotKeys;
