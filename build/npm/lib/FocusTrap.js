"use strict";

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { "default": obj }; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _React = require("react");

var _React2 = _interopRequireWildcard(_React);

var FocusTrap = _React2["default"].createClass({
  displayName: "FocusTrap",

  propTypes: {
    onFocus: _React2["default"].PropTypes.func,
    onBlur: _React2["default"].PropTypes.func,
    focusName: _React2["default"].PropTypes.string // Currently unused
  },

  render: function render() {
    return _React2["default"].createElement(
      "div",
      _extends({ tabIndex: "-1" }, this.props),
      this.props.children
    );
  }

});

exports["default"] = FocusTrap;
module.exports = exports["default"];