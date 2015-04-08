"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var React = _interopRequire(require("react"));

var FocusTrap = _interopRequire(require("./FocusTrap"));

var HotKeyMapMixin = _interopRequire(require("./HotKeyMapMixin"));

var Mousetrap = _interopRequire(require("mousetrap"));

var isArray = _interopRequire(require("lodash/lang/isArray"));

var forEach = _interopRequire(require("lodash/collection/forEach"));

function getSequencesFromMap(hotKeyMap, hotKeyName) {
  var sequences = hotKeyMap[hotKeyName];

  // If no sequence is found with this name we assume
  // the user is passing a hard-coded sequence as a key
  if (!sequences) {
    return [hotKeyName];
  }

  if (isArray(sequences)) {
    return sequences;
  }

  return [sequences];
}

var HotKeys = React.createClass({
  displayName: "HotKeys",

  mixins: [HotKeyMapMixin()],

  propTypes: {
    onFocus: React.PropTypes.func,
    onBlur: React.PropTypes.func,
    focusName: React.PropTypes.string, // Currently unused
    keyMap: React.PropTypes.object,
    handlers: React.PropTypes.object
  },

  componentDidMount: function componentDidMount() {
    // Not optimal - imagine hundreds of this component. We need a top level
    // delegation point for mousetrap
    this.__mousetrap__ = new Mousetrap(React.findDOMNode(this.refs.focusTrap));

    this.updateHotKeys();
  },

  componentWillReceiveProps: function componentWillReceiveProps() {
    this.updateHotKeys();
  },

  componentWillUnmount: function componentWillUnmount() {
    this.__mousetrap__.reset();
  },

  updateHotKeys: function updateHotKeys() {
    var _this = this;

    // Ensure map is up-to-date to begin with
    this.updateMap();

    var _props$handlers = this.props.handlers;
    var handlers = _props$handlers === undefined ? {} : _props$handlers;

    var hotKeyMap = this.getMap();
    var sequenceHandlers = {};
    var mousetrap = this.__mousetrap__;

    // Group all our handlers by sequence
    forEach(handlers, function (handler, hotKey) {
      var handlerSequences = getSequencesFromMap(hotKeyMap, hotKey);

      // Could be optimized as every handler will get called across every bound
      // component - imagine making a node a focus point and then having hundreds!
      forEach(handlerSequences, function (sequence) {
        sequenceHandlers[sequence] = function (event) {
          if (_this.__isFocused__) {
            // Stopping propagation breaks long key sequences if a portion is handled
            // up the tree. We need the central manager/delegator!
            event.stopPropagation();
            return handler(event);
          }
        };
      });
    });

    // Hard reset our handlers (probably could be more efficient)
    mousetrap.reset();
    forEach(sequenceHandlers, function (handler, sequence) {
      return mousetrap.bind(sequence, handler);
    });
  },

  onFocus: function onFocus() {
    this.__isFocused__ = true;

    if (this.props.onFocus) {
      var _props;

      (_props = this.props).onFocus.apply(_props, arguments);
    }
  },

  onBlur: function onBlur() {
    this.__isFocused__ = false;

    if (this.props.onBlur) {
      var _props;

      (_props = this.props).onBlur.apply(_props, arguments);
    }
  },

  render: function render() {
    return React.createElement(
      FocusTrap,
      _extends({ ref: "focusTrap" }, this.props, { onFocus: this.onFocus, onBlur: this.onBlur }),
      this.props.children
    );
  }

});

module.exports = HotKeys;