import React from 'react';

const FocusTrap = React.createClass({

  propTypes: {
    onTrapFocus: React.PropTypes.func,
    onTrapBlur: React.PropTypes.func,
    focusName: React.PropTypes.string
  },

  contextTypes {
    focusManager: React.PropTypes.any
  },

  childContextTypes {
    focusManager: React.PropTypes.any
  },

  componentDidMount() {
    this.__focusTrapId__ = this.context.focusManager.registerTrap(this.props.focusName);
  },

  componentWillUnmount() {
    this.context.focusManager.unregisterTrap(this.__focusTrapId__);
  },

  getChildContext() {
    return {
      focusManager: this.context.focusManager || this
    };
  },

  render() {
    return (
      <div {...this.props}>
        {this.props.children}
      </div>
    );
  }

});

export default FocusTrap;
