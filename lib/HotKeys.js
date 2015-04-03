import React from 'react';
import FocusTrap from './FocusTrap';

const HotKeys = React.createClass({

  propTypes: {
    onTrapFocus: React.PropTypes.func,
    onTrapBlur: React.PropTypes.func,
    focusName: React.PropTypes.string
    map: React.PropTypes.object,
    handlers: React.PropTypes.object
  },

  contextTypes {
    hotKeyManager: React.PropTypes.any
  },

  childContextTypes {
    hotKeyManager: React.PropTypes.any
  },

  componentDidMount() {
    this.__hotKeyId__ = this.context.hotKeyManager.register(this.props.focusName, this.onHotKeyFired);
  },

  componentWillUnmount() {
    this.context.hotKeyManager.register(this.__hotKeyId__);
  },

  onHotKeyFired(hotKeyName, keySequence) {
    if (this.__focused__) {
      // handle
    }
  },

  onTrapFocus() {
    this.__focused__ = true;

    if (this.props.onTrapFocus) {
      this.props.onTrapFocus(...arguments);
    }
  },

  onTrapBlur() {
    this.__focused__ = false;

    if (this.props.onTrapBlur) {
      this.props.onTrapBlur(...arguments);
    }
  },

  render() {
    return (
      <FocusTrap {...this.props} onTrapFocus={this.onTrapFocus} onTrapBlur={this.onTrapBlur}>
        {this.props.children}
      </FocusTrap>
    )
  }

});

export default HotKeys;
