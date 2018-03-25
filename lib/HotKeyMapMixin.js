import PropTypes from 'prop-types';
import isEqual from 'lodash.isequal';

export default function HotKeyMapMixin(hotKeyMap = {}) {

  return {

    contextTypes: {
      hotKeyMap: PropTypes.object
    },

    childContextTypes: {
      hotKeyMap: PropTypes.object
    },

    getChildContext() {
      return {
        hotKeyMap: this.__hotKeyMap__
      };
    },

    componentWillMount() {
      this.updateMap();
    },

    updateMap() {
      const newMap = this.buildMap();

      if (!isEqual(newMap, this.__hotKeyMap__)) {
        this.__hotKeyMap__ = newMap;
        return true;
      }

      return false;
    },

    buildMap() {
      const parentMap = this.context.hotKeyMap || {};
      const thisMap = this.props.keyMap || {};

      return {...parentMap, ...hotKeyMap, ...thisMap};
    },

    getMap() {
      return this.__hotKeyMap__;
    }

  };

}
