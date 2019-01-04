import React, { Component } from 'react';
import Configuration from './lib/Configuration';
import KeyEventManager from './lib/KeyEventManager';

class GlobalHotKeys extends Component {
  render() {
    return this.props.children || null;
  }

  componentDidUpdate() {
    const {keyMap, handlers} = this.props;
    /**
     * Component defines global hotkeys, so any changes to props may have changes
     * that should have immediate effect
     */
    KeyEventManager.getInstance().updateGlobalHotKeys(
      this._id,
      keyMap,
      handlers,
      this._getComponentOptions(),
      this._getEventOptions()
    );
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
