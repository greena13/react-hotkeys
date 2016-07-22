'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var FocusTrap = _react2.default.createClass({
  displayName: 'FocusTrap',


  propTypes: {
    onFocus: _react2.default.PropTypes.func,
    onBlur: _react2.default.PropTypes.func,
    component: _react2.default.PropTypes.any,
    children: _react2.default.PropTypes.node
  },

  getDefaultProps: function getDefaultProps() {
    return {
      component: 'div'
    };
  },
  render: function render() {
    var _props = this.props;
    var Component = _props.component;
    var children = _props.children;

    var props = _objectWithoutProperties(_props, ['component', 'children']);

    return _react2.default.createElement(
      Component,
      _extends({ tabIndex: '-1' }, props),
      children
    );
  }
});

exports.default = FocusTrap;