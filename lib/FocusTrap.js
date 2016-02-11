import React from 'react';

const FocusTrap = React.createClass({

  propTypes: {
    onFocus: React.PropTypes.func,
    onBlur: React.PropTypes.func,
    focusName: React.PropTypes.string, // Currently unused
    component: React.PropTypes.any
  },

  getDefaultProps() {
    return {
      component: 'div'
    };
  },

  render() {
    const Component = this.props.component;

    return (
      <Component tabIndex="-1" {...this.props}>
        {this.props.children}
      </Component>
    );
  }

});

export default FocusTrap;
