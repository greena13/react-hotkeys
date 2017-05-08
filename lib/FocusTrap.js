import PropTypes from 'prop-types';
import React from 'react';

class FocusTrap extends React.Component {
  static propTypes = {
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    component: PropTypes.any,
    children: PropTypes.node
  };

  static defaultProps = {
    component: 'div'
  };

  render() {
    const {
      component: Component,
      children,
      ...props
    } = this.props;

    return (
      <Component tabIndex="-1" {...props}>
        {children}
      </Component>
    );
  }
}

export default FocusTrap;
