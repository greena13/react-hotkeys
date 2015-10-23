'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = HotKeyMapMixin;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _lodashObjectAssign = require('lodash/object/assign');

var _lodashObjectAssign2 = _interopRequireDefault(_lodashObjectAssign);

var _lodashLangIsEqual = require('lodash/lang/isEqual');

var _lodashLangIsEqual2 = _interopRequireDefault(_lodashLangIsEqual);

function HotKeyMapMixin() {
  var hotKeyMap = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

  return {

    contextTypes: {
      hotKeyMap: _react2['default'].PropTypes.object
    },

    childContextTypes: {
      hotKeyMap: _react2['default'].PropTypes.object
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

      if (!(0, _lodashLangIsEqual2['default'])(newMap, this.__hotKeyMap__)) {
        this.__hotKeyMap__ = newMap;
        return true;
      }

      return false;
    },

    buildMap: function buildMap() {
      var parentMap = this.context.hotKeyMap || {};
      var thisMap = this.props.keyMap || {};

      return (0, _lodashObjectAssign2['default'])({}, parentMap, hotKeyMap, thisMap);
    },

    getMap: function getMap() {
      return this.__hotKeyMap__;
    }

  };
}

;
module.exports = exports['default'];