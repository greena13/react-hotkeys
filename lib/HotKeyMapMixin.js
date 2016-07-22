import React from 'react';
import assign from 'lodash/assign';
import isEqual from 'lodash/isEqual';

export default function HotKeyMapMixin(hotKeyMap = {}) {

  return {

    contextTypes: {
      hotKeyMap: React.PropTypes.object
    },

    childContextTypes: {
      hotKeyMap: React.PropTypes.object
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

      return assign({}, parentMap, hotKeyMap, thisMap);
    },

    getMap() {
      return this.__hotKeyMap__;
    }

  };

};
