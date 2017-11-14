import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';
import {addFocusListener, addBlurListener} from './focusListeners';

class FocusTrap extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      willWrap: this.props.useFocusWrap,
    };

    this.setupNativeListeners = this.setupNativeListeners.bind(this);
    this.removeNativeListeners = this.removeNativeListeners.bind(this);
  }

  static propTypes = {
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    component: PropTypes.any,
    useFocusWrap: PropTypes.bool,
    children: PropTypes.node
  };

  static defaultProps = {
    component: 'div',
    useFocusWrap: true,
  };

  componentDidMount() {
    if (!this.state.willWrap) {
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

      if (elem) {
        if (!elem.getAttribute('tabindex')) {
          elem.setAttribute('tabindex', '-1');
        }
        this.focusListener = addFocusListener(elem, onFocus);
        this.blurListener = addBlurListener(elem, onBlur);
      } else {
        this.setState({
          willWrap: true,
        });
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
      useFocusWrap,
      ...props
    } = this.props;

    if (this.state.willWrap) {
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