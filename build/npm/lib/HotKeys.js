'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactDom = require('react-dom');

var _reactDom2 = _interopRequireDefault(_reactDom);

var _FocusTrap = require('./FocusTrap');

var _FocusTrap2 = _interopRequireDefault(_FocusTrap);

var _HotKeyMapMixin = require('./HotKeyMapMixin');

var _HotKeyMapMixin2 = _interopRequireDefault(_HotKeyMapMixin);

var _lodashLangIsBoolean = require('lodash/lang/isBoolean');

var _lodashLangIsBoolean2 = _interopRequireDefault(_lodashLangIsBoolean);

var _lodashLangIsArray = require('lodash/lang/isArray');

var _lodashLangIsArray2 = _interopRequireDefault(_lodashLangIsArray);

var _lodashLangIsObject = require('lodash/lang/isObject');

var _lodashLangIsObject2 = _interopRequireDefault(_lodashLangIsObject);

var _lodashCollectionForEach = require('lodash/collection/forEach');

var _lodashCollectionForEach2 = _interopRequireDefault(_lodashCollectionForEach);

var _lodashLangIsEqual = require('lodash/lang/isEqual');

var _lodashLangIsEqual2 = _interopRequireDefault(_lodashLangIsEqual);

function getSequencesFromMap(hotKeyMap, hotKeyName) {
  var sequences = hotKeyMap[hotKeyName];

  // If no sequence is found with this name we assume
  // the user is passing a hard-coded sequence as a key
  if (!sequences) {
    return [hotKeyName];
  }

  if ((0, _lodashLangIsArray2['default'])(sequences)) {
    return sequences;
  }

  return [sequences];
}

var HotKeys = _react2['default'].createClass({
  displayName: 'HotKeys',

  mixins: [(0, _HotKeyMapMixin2['default'])()],

  propTypes: {
    onFocus: _react2['default'].PropTypes.func,
    onBlur: _react2['default'].PropTypes.func,
    keyMap: _react2['default'].PropTypes.object,
    handlers: _react2['default'].PropTypes.object,
    focused: _react2['default'].PropTypes.bool, // externally controlled focus
    attach: _react2['default'].PropTypes.any // dom element to listen for key events
  },

  contextTypes: {
    hotKeyParent: _react2['default'].PropTypes.any
  },

  childContextTypes: {
    hotKeyParent: _react2['default'].PropTypes.any
  },

  getChildContext: function getChildContext() {
    return {
      hotKeyParent: this
    };
  },

  componentDidMount: function componentDidMount() {
    // import is here to support React's server rendering as Mousetrap immediately
    // calls itself with window and it fails in Node environment
    var Mousetrap = require('mousetrap');
    // Not optimal - imagine hundreds of this component. We need a top level
    // delegation point for mousetrap
    this.__mousetrap__ = new Mousetrap(this.props.attach || _reactDom2['default'].findDOMNode(this));

    this.updateHotKeys(true);
  },

  componentDidUpdate: function componentDidUpdate(prevProps) {
    this.updateHotKeys(false, prevProps);
  },

  componentWillUnmount: function componentWillUnmount() {
    if (this.context.hotKeyParent) {
      this.context.hotKeyParent.childHandledSequence(null);
    }

    this.__mousetrap__.reset();
  },

  updateHotKeys: function updateHotKeys() {
    var _this = this;

    var force = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];
    var prevProps = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
    var _props$handlers = this.props.handlers;
    var handlers = _props$handlers === undefined ? {} : _props$handlers;
    var _prevProps$handlers = prevProps.handlers;
    var prevHandlers = _prevProps$handlers === undefined ? handlers : _prevProps$handlers;

    // Ensure map is up-to-date to begin with
    // We will only bother continuing if the map was actually updated
    if (!force && (0, _lodashLangIsEqual2['default'])(handlers, prevHandlers) && !this.updateMap()) {
      return;
    }

    var hotKeyMap = this.getMap();
    var sequenceHandlers = [];
    var mousetrap = this.__mousetrap__;

    // Group all our handlers by sequence
    (0, _lodashCollectionForEach2['default'])(handlers, function (handler, hotKey) {
      var handlerSequences = getSequencesFromMap(hotKeyMap, hotKey);

      // Could be optimized as every handler will get called across every bound
      // component - imagine making a node a focus point and then having hundreds!
      (0, _lodashCollectionForEach2['default'])(handlerSequences, function (sequence) {
        var action = undefined;

        var callback = function callback(event, sequence) {
          // Check we are actually in focus and that a child hasn't already handled this sequence
          var isFocused = (0, _lodashLangIsBoolean2['default'])(_this.props.focused) ? _this.props.focused : _this.__isFocused__;

          if (isFocused && sequence !== _this.__lastChildSequence__) {
            if (_this.context.hotKeyParent) {
              _this.context.hotKeyParent.childHandledSequence(sequence);
            }

            return handler(event, sequence);
          }
        };

        if ((0, _lodashLangIsObject2['default'])(sequence)) {
          action = sequence.action;
          sequence = sequence.sequence;
        }

        sequenceHandlers.push({ callback: callback, action: action, sequence: sequence });
      });
    });

    // Hard reset our handlers (probably could be more efficient)
    mousetrap.reset();
    (0, _lodashCollectionForEach2['default'])(sequenceHandlers, function (handler) {
      return mousetrap.bind(handler.sequence, handler.callback, handler.action);
    });
  },

  childHandledSequence: function childHandledSequence() {
    var sequence = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];

    this.__lastChildSequence__ = sequence;

    // Traverse up any hot key parents so everyone is aware a child has handled a certain sequence
    if (this.context.hotKeyParent) {
      this.context.hotKeyParent.childHandledSequence(sequence);
    }
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
      var _props2;

      (_props2 = this.props).onBlur.apply(_props2, arguments);
    }
  },

  render: function render() {
    return _react2['default'].createElement(
      _FocusTrap2['default'],
      _extends({}, this.props, { onFocus: this.onFocus, onBlur: this.onBlur }),
      this.props.children
    );
  }

});

exports['default'] = HotKeys;
module.exports = exports['default'];