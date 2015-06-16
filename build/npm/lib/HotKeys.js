'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _FocusTrap = require('./FocusTrap');

var _FocusTrap2 = _interopRequireDefault(_FocusTrap);

var _HotKeyMapMixin = require('./HotKeyMapMixin');

var _HotKeyMapMixin2 = _interopRequireDefault(_HotKeyMapMixin);

var _lodashLangIsArray = require('lodash/lang/isArray');

var _lodashLangIsArray2 = _interopRequireDefault(_lodashLangIsArray);

var _lodashLangIsObject = require('lodash/lang/isObject');

var _lodashLangIsObject2 = _interopRequireDefault(_lodashLangIsObject);

var _lodashCollectionForEach = require('lodash/collection/forEach');

var _lodashCollectionForEach2 = _interopRequireDefault(_lodashCollectionForEach);

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
    focusName: _react2['default'].PropTypes.string, // Currently unused
    keyMap: _react2['default'].PropTypes.object,
    handlers: _react2['default'].PropTypes.object
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
    // import is here to support React's server rendering
    var Mousetrap = require('mousetrap');
    // Not optimal - imagine hundreds of this component. We need a top level
    // delegation point for mousetrap
    this.__mousetrap__ = new Mousetrap(_react2['default'].findDOMNode(this.refs.focusTrap));

    this.updateHotKeys(true);
  },

  componentDidUpdate: function componentDidUpdate() {
    this.updateHotKeys();
  },

  componentWillUnmount: function componentWillUnmount() {
    if (this.context.hotKeyParent) {
      this.context.hotKeyParent.childHandledSequence(null);
    }

    this.__mousetrap__.reset();
  },

  updateHotKeys: function updateHotKeys() {
    var _this = this;

    var force = arguments[0] === undefined ? false : arguments[0];

    // Ensure map is up-to-date to begin with
    // We will only bother continuing if the map was actually updated
    if (!this.updateMap() && !force) {
      return;
    }

    var _props$handlers = this.props.handlers;
    var handlers = _props$handlers === undefined ? {} : _props$handlers;

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
          if (_this.__isFocused__ && sequence !== _this.__lastChildSequence__) {
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
    var sequence = arguments[0] === undefined ? null : arguments[0];

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
      _extends({ ref: 'focusTrap' }, this.props, { onFocus: this.onFocus, onBlur: this.onBlur }),
      this.props.children
    );
  }

});

exports['default'] = HotKeys;
module.exports = exports['default'];