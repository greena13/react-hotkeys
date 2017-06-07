import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';
import {addFocusListener, addBlurListener} from './focusListeners';

class FocusTrap extends React.Component {
  constructor(props){
    super(props);

    this.focusListener;
    this.blurListener;
    this.willWrap = !this.props.noWrapper;
    this.setupNativeListeners = this.setupNativeListeners.bind(this);
    this.removeNativeListeners = this.removeNativeListeners.bind(this);
  }

  static propTypes = {
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    component: PropTypes.any,
    noWrapper: PropTypes.bool,
    children: PropTypes.node
  };

  static defaultProps = {
    component: 'div'
  };

  componentDidMount(){
    if(!this.willWrap){
      this.setupNativeListeners();
    }
  }

  componentWillUnmount(){
    this.removeNativeListeners();
  }

  setupNativeListeners() {
    if (!this.focusListener) {
      const {
        onFocus, 
        onBlur, 
      } = this.props;

      const elem = ReactDOM.findDOMNode(this);

      if(elem && !this.focusListener) {
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
      ...props
    } = this.props;

    if(this.willWrap){
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