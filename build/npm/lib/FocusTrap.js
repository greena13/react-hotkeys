"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var FocusTrap = _react2["default"].createClass({
  displayName: "FocusTrap",

  propTypes: {
    onFocus: _react2["default"].PropTypes.func,
    onBlur: _react2["default"].PropTypes.func,
    focusName: _react2["default"].PropTypes.string // Currently unused
  },

  render: function render() {
    return _react2["default"].createElement(
      "div",
      _extends({ tabIndex: "-1" }, this.props),
      this.props.children
    );
  }

});

exports["default"] = FocusTrap;
module.exports = exports["default"];