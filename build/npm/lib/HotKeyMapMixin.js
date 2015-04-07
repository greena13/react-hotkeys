"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

module.exports = HotKeyMapMixin;

var React = _interopRequire(require("react"));

var assign = _interopRequire(require("lodash/object/assign"));

function HotKeyMapMixin() {
  var hotKeyMap = arguments[0] === undefined ? {} : arguments[0];

  return {

    contextTypes: {
      hotKeyMap: React.PropTypes.object
    },

    childContextTypes: {
      hotKeyMap: React.PropTypes.object
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
      this.__hotKeyMap__ = this.buildMap();
    },

    buildMap: function buildMap() {
      var parentMap = this.context.hotKeyMap || {};
      var thisMap = this.props.keyMap || {};

      return assign({}, parentMap, hotKeyMap, thisMap);
    },

    getMap: function getMap() {
      return this.__hotKeyMap__;
    }

  };
}