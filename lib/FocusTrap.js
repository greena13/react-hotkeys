import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { addFocusListener, addBlurListener } from './focusListeners';

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

  static defaultProps = {
    component: 'div'
  };

  constructor(props) {
    super(props);

    this.focusListener;
    this.blurListener;
    this.willWrap = !this.props.noWrapper;
    this.setupNativeListeners = this.setupNativeListeners.bind(this);
    this.removeNativeListeners = this.removeNativeListeners.bind(this);
  }  

  componentDidMount() {
    if (!this.willWrap) {
      this.setupNativeListeners();
    }
  }

  componentWillUnmount() {
    this.removeNativeListeners();
  }

  setupNativeListeners() {
    if (!this.focusListener) {
      const {
        onFocus,
        onBlur,
      } = this.props;

      const elem = ReactDOM.findDOMNode(this);

      if (elem && !this.focusListener) {
        if (!elem.getAttribute('tabindex')) {
          elem.setAttribute('tabindex', '-1');
        }
        this.focusListener = addFocusListener(elem, onFocus);
        this.blurListener = addBlurListener(elem, onBlur);
      } else {
        this.willWrap = true;
      }
    }
  }
  
  removeNativeListeners() {
    if (this.focusListener) {
      this.focusListener.remove();
      this.focusListener = null;
    }
    if (this.blurListener) {
      this.blurListener.remove();
      this.blurListener = null;
    }
  }

  render() {
    const {
      component: Component,
      children,
      noWrapper,
      ...props
    } = this.props;

    if (this.willWrap) {
      return (
        <Component tabIndex="-1" {...props}>
          {children}
        </Component>
      );
    }

    return children;
  }
}

export default FocusTrap;
