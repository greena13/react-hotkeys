import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Configuration from './lib/Configuration';

/**
 * Component to wrap its children in a parent that has a tabIndex of -1,
 * making it programmatically focusable and with focus and blur handlers
 */
class FocusTrap extends Component {
  static propTypes = {
    /**
     * Function to call when this component gains focus in the browser
     */
    onFocus: PropTypes.func,

    /**
     * Function to call when this component loses focus in the browser
     */
    onBlur: PropTypes.func,

    /**
     * Component (or component type as a string) to use as a wrapper or
     * parent of this component's children
     */
    component: PropTypes.oneOfType([ PropTypes.func, PropTypes.string ]),

    /**
     * Children to place in the wrapper or parent
     */
    children: PropTypes.node
  };

  render() {
    const {
      children,
      ...props
    } = this.props;

    const Component = this.props.component || Configuration.option('defaultComponent');

    return (
      <Component tabIndex={Configuration.option('defaultTabIndex')} {...props}>
        {children}
      </Component>
    );
  }
}

export default FocusTrap;
