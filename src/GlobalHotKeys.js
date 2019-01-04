import React, { Component } from 'react';
import Configuration from './lib/Configuration';
import KeyEventManager from './lib/KeyEventManager';
import hasChanged from './utils/object/hasChanged';

class GlobalHotKeys extends Component {
  render() {
    return this.props.children || null;
  }

  componentDidUpdate(previousProps) {
    const newHandlers = this.props.handlers;
    const prevHandlers = previousProps.handlers;

    const newKeyMaps = this.props.keyMap;
    const prevKeyMap = previousProps.keyMaps;

    if (hasChanged(newHandlers, prevHandlers) || hasChanged(newKeyMaps, prevKeyMap)) {
        /**
       * Component defines global hotkeys, so any changes to props may have changes
       * that should have immediate effect
       */
      KeyEventManager.getInstance().updateGlobalHotKeys(
        this._id,
        newKeyMaps,
        newHandlers,
        this._getComponentOptions(),
        this._getEventOptions()
      );
    }
  }

  componentDidMount() {
    const {keyMap, handlers} = this.props;

    this._id =
      KeyEventManager.getInstance().addGlobalHotKeys(
        keyMap,
        handlers,
        this._getComponentOptions(),
        this._getEventOptions()
      );
  }

  componentWillUnmount(){
    KeyEventManager.getInstance().removeGlobalHotKeys(this._id)
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
