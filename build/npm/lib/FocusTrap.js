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

var _reactDom = require('react-dom');

var _reactDom2 = _interopRequireDefault(_reactDom);

var _focusListeners = require('./focusListeners');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var FocusTrap = function (_React$Component) {
  _inherits(FocusTrap, _React$Component);

  function FocusTrap(props) {
    _classCallCheck(this, FocusTrap);

    var _this = _possibleConstructorReturn(this, (FocusTrap.__proto__ || Object.getPrototypeOf(FocusTrap)).call(this, props));

    _this.focusListener;
    _this.blurListener;
    _this.willWrap = !_this.props.noWrapper;
    _this.setupNativeListeners = _this.setupNativeListeners.bind(_this);
    _this.removeNativeListeners = _this.removeNativeListeners.bind(_this);
    return _this;
  }

  _createClass(FocusTrap, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      if (!this.willWrap) {
        this.setupNativeListeners();
      }
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      this.removeNativeListeners();
    }
  }, {
    key: 'setupNativeListeners',
    value: function setupNativeListeners() {
      if (!this.focusListener) {
        var _props = this.props,
            onFocus = _props.onFocus,
            onBlur = _props.onBlur;


        var elem = _reactDom2.default.findDOMNode(this);

        if (elem && !this.focusListener) {
          if (!elem.getAttribute('tabindex')) {
            elem.setAttribute('tabindex', '-1');
          }
          this.focusListener = (0, _focusListeners.addFocusListener)(elem, onFocus);
          this.blurListener = (0, _focusListeners.addBlurListener)(elem, onBlur);
        } else {
          this.willWrap = true;
        }
      }
    }
  }, {
    key: 'removeNativeListeners',
    value: function removeNativeListeners() {
      if (this.focusListener) {
        this.focusListener.remove();
        this.focusListener = null;
      }
      if (this.blurListener) {
        this.blurListener.remove();
        this.blurListener = null;
      }
    }
  }, {
    key: 'render',
    value: function render() {
      var _props2 = this.props,
          Component = _props2.component,
          children = _props2.children,
          props = _objectWithoutProperties(_props2, ['component', 'children']);

      if (this.willWrap) {
        return _react2.default.createElement(
          Component,
          _extends({ tabIndex: '-1' }, props),
          children
        );
      }

      return children;
    }
  }]);

  return FocusTrap;
}(_react2.default.Component);

FocusTrap.propTypes = {
  onFocus: _propTypes2.default.func,
  onBlur: _propTypes2.default.func,
  component: _propTypes2.default.any,
  noWrapper: _propTypes2.default.bool,
  children: _propTypes2.default.node
};
FocusTrap.defaultProps = {
  component: 'div'
};
exports.default = FocusTrap;