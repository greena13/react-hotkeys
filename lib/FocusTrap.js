import React from 'react';
import omit from 'lodash/lang/omit';

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
      <Component tabIndex="-1" {...omit(this.props, ['keyMap', 'handlers', 'component'])}>
        {this.props.children}
      </Component>
    );
  }

});

export default FocusTrap;
