'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var FocusTrap = function (_React$Component) {
  _inherits(FocusTrap, _React$Component);

  function FocusTrap() {
    _classCallCheck(this, FocusTrap);

    return _possibleConstructorReturn(this, (FocusTrap.__proto__ || Object.getPrototypeOf(FocusTrap)).apply(this, arguments));
  }

  _createClass(FocusTrap, [{
    key: 'render',
    value: function render() {
      var _props = this.props,
          Component = _props.component,
          children = _props.children,
          props = _objectWithoutProperties(_props, ['component', 'children']);

      return _react2.default.createElement(
        Component,
        _extends({ tabIndex: '-1' }, props),
        children
      );
    }
  }]);

  return FocusTrap;
}(_react2.default.Component);

FocusTrap.propTypes = {
  onFocus: _propTypes2.default.func,
  onBlur: _propTypes2.default.func,
  component: _propTypes2.default.any,
  children: _propTypes2.default.node
};
FocusTrap.defaultProps = {
  component: 'div'
};
exports.default = FocusTrap;