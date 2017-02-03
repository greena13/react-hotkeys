import React from 'react';

const DOCUMENT_FRAGMENT = 'documentFragment';

const FocusTrap = React.createClass({

  propTypes: {
    onFocus: React.PropTypes.func,
    onBlur: React.PropTypes.func,
    component: React.PropTypes.any,
    children: React.PropTypes.node
  },

  getDefaultProps() {
    return {
      component: DOCUMENT_FRAGMENT
    };
  },

  onFocus(...args) {
    const {children, onFocus} = this.props;

    const child = React.Children.only(children);
    if (child.onFocus) {
      child.onFocus(...args);
    }
    if (onFocus) {
      onFocus(...args);
    }
  },

  onBlur(...args) {
    const {children, onBlur} = this.props;

    const child = React.Children.only(children);
    if (child.onBlur) {
      child.onBlur(...args);
    }
    if (onBlur) {
      onBlur(...args);
    }
  },

  render() {
    const {
      component: Component,
      children,
      ...props
    } = this.props;

    if (Component !== DOCUMENT_FRAGMENT) {
      return (
        <Component tabIndex="-1" {...props}>
          {children}
        </Component>
      );
    }

    props.onFocus = this.onFocus;
    props.onBlur = this.onBlur;
    return React.cloneElement(React.Children.only(children), props);
  }

});

export default FocusTrap;
