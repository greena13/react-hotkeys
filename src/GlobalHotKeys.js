import PropTypes from 'prop-types';
import { Component } from 'react';
import backwardsCompatibleContext from './utils/backwardsCompatibleContext';
import GlobalComponentManager from './lib/metal/GlobalComponentManager';

class GlobalHotKeys extends Component {
  static propTypes = {
    /**
     * A map from action names to Mousetrap or Browser key sequences
     * @type {KeyMap}
     */
    keyMap: PropTypes.object,

    /**
     * A map from action names to event handler functions
     * @typedef {Object.<ActionName, Function>} HandlersMap
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

    this._manager = new GlobalComponentManager(props.keyMap);
  }

  render() {
    return this.props.children || null;
  }

  componentDidMount() {
    this._manager.addHotKeys(this.props, this.context);
  }

  componentDidUpdate() {
    this._manager.updateHotKeys(this.props);
  }

  componentWillUnmount(){
    this._manager.removeKeyMap();
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
