"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var React = _interopRequire(require("react"));

var FocusTrap = React.createClass({
  displayName: "FocusTrap",

  propTypes: {
    onFocus: React.PropTypes.func,
    onBlur: React.PropTypes.func,
    focusName: React.PropTypes.string // Currently unused
  },

  render: function render() {
    return React.createElement(
      "div",
      _extends({ tabIndex: "0" }, this.props),
      this.props.children
    );
  }

});

module.exports = FocusTrap;