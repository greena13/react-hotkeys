'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = HotKeyMapMixin;

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _assign = require('lodash/assign');

var _assign2 = _interopRequireDefault(_assign);

var _isEqual = require('lodash/isEqual');

var _isEqual2 = _interopRequireDefault(_isEqual);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function HotKeyMapMixin() {
  var hotKeyMap = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};


  return {

    contextTypes: {
      hotKeyMap: _propTypes2.default.object
    },

    childContextTypes: {
      hotKeyMap: _propTypes2.default.object
    },

    getChildContext: function getChildContext() {
      return {
        hotKeyMap: this.__hotKeyMap__
      };
    },
    componentWillMount: function componentWillMount() {
      this.updateMap();
    },
    updateMap: function updateMap() {
      var newMap = this.buildMap();

      if (!(0, _isEqual2.default)(newMap, this.__hotKeyMap__)) {
        this.__hotKeyMap__ = newMap;
        return true;
      }

      return false;
    },
    buildMap: function buildMap() {
      var parentMap = this.context.hotKeyMap || {};
      var thisMap = this.props.keyMap || {};

      return (0, _assign2.default)({}, parentMap, hotKeyMap, thisMap);
    },
    getMap: function getMap() {
      return this.__hotKeyMap__;
    }
  };
}