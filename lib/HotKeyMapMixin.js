import React from 'react';
import assign from 'lodash/object/assign';

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
      this.__hotKeyMap__ = this.buildMap();
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