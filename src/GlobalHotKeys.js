import React, { Component } from 'react';
import Configuration from './lib/Configuration';
import KeyEventManager from './lib/KeyEventManager';
import hasChanged from './utils/object/hasChanged';

class GlobalHotKeys extends Component {
  componentWillReceiveProps(nextProps) {
    const nextHandlers = nextProps.handlers;
    const prevHandlers = this.props.handlers;

    const nextKeyMap = nextProps.keyMap;
    const prevKeyMap = this.props.keyMap;

    if (hasChanged(nextHandlers, prevHandlers) || hasChanged(nextKeyMap, prevKeyMap)) {
      /**
       * Component defines global hotkeys, so any changes to props may have changes
       * that should have immediate effect
       */
      KeyEventManager.getInstance().updateGlobalHotKeys(
        this._id,
        nextKeyMap,
        nextHandlers,
        this._getComponentOptions(),
        this._getEventOptions()
      );
    }
  }

  render() {
    return this.props.children || null;
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
