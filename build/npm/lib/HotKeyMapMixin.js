'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = HotKeyMapMixin;

var _React = require('react');

var _React2 = _interopRequireWildcard(_React);

var _assign = require('lodash/object/assign');

var _assign2 = _interopRequireWildcard(_assign);

var _isEqual = require('lodash/lang/isEqual');

var _isEqual2 = _interopRequireWildcard(_isEqual);

function HotKeyMapMixin() {
  var hotKeyMap = arguments[0] === undefined ? {} : arguments[0];

  return {

    contextTypes: {
      hotKeyMap: _React2['default'].PropTypes.object
    },

    childContextTypes: {
      hotKeyMap: _React2['default'].PropTypes.object
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

      if (!_isEqual2['default'](newMap, this.__hotKeyMap__)) {
        this.__hotKeyMap__ = newMap;
        return true;
      }

      return false;
    },

    buildMap: function buildMap() {
      var parentMap = this.context.hotKeyMap || {};
      var thisMap = this.props.keyMap || {};

      return _assign2['default']({}, parentMap, hotKeyMap, thisMap);
    },

    getMap: function getMap() {
      return this.__hotKeyMap__;
    }

  };
}

;
module.exports = exports['default'];