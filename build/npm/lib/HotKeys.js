'use strict';

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { 'default': obj }; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _React = require('react');

var _React2 = _interopRequireWildcard(_React);

var _FocusTrap = require('./FocusTrap');

var _FocusTrap2 = _interopRequireWildcard(_FocusTrap);

var _HotKeyMapMixin = require('./HotKeyMapMixin');

var _HotKeyMapMixin2 = _interopRequireWildcard(_HotKeyMapMixin);

var _isArray = require('lodash/lang/isArray');

var _isArray2 = _interopRequireWildcard(_isArray);

var _isObject = require('lodash/lang/isObject');

var _isObject2 = _interopRequireWildcard(_isObject);

var _forEach = require('lodash/collection/forEach');

var _forEach2 = _interopRequireWildcard(_forEach);

var _isEqual = require('lodash/lang/isEqual');

var _isEqual2 = _interopRequireWildcard(_isEqual);

function getSequencesFromMap(hotKeyMap, hotKeyName) {
  var sequences = hotKeyMap[hotKeyName];

  // If no sequence is found with this name we assume
  // the user is passing a hard-coded sequence as a key
  if (!sequences) {
    return [hotKeyName];
  }

  if (_isArray2['default'](sequences)) {
    return sequences;
  }

  return [sequences];
}

var HotKeys = _React2['default'].createClass({
  displayName: 'HotKeys',

  mixins: [_HotKeyMapMixin2['default']()],

  propTypes: {
    onFocus: _React2['default'].PropTypes.func,
    onBlur: _React2['default'].PropTypes.func,
    focusName: _React2['default'].PropTypes.string, // Currently unused
    keyMap: _React2['default'].PropTypes.object,
    handlers: _React2['default'].PropTypes.object
  },

  contextTypes: {
    hotKeyParent: _React2['default'].PropTypes.any
  },

  childContextTypes: {
    hotKeyParent: _React2['default'].PropTypes.any
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
    this.__mousetrap__ = new Mousetrap(_React2['default'].findDOMNode(this.refs.focusTrap));

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

    var force = arguments[0] === undefined ? false : arguments[0];
    var prevProps = arguments[1] === undefined ? {} : arguments[1];
    var _props$handlers = this.props.handlers;
    var handlers = _props$handlers === undefined ? {} : _props$handlers;
    var _prevProps$handlers = prevProps.handlers;
    var prevHandlers = _prevProps$handlers === undefined ? handlers : _prevProps$handlers;

    // Ensure map is up-to-date to begin with
    // We will only bother continuing if the map was actually updated
    if (!force && _isEqual2['default'](handlers, prevHandlers) && !this.updateMap()) {
      return;
    }

    var hotKeyMap = this.getMap();
    var sequenceHandlers = [];
    var mousetrap = this.__mousetrap__;

    // Group all our handlers by sequence
    _forEach2['default'](handlers, function (handler, hotKey) {
      var handlerSequences = getSequencesFromMap(hotKeyMap, hotKey);

      // Could be optimized as every handler will get called across every bound
      // component - imagine making a node a focus point and then having hundreds!
      _forEach2['default'](handlerSequences, function (sequence) {
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

        if (_isObject2['default'](sequence)) {
          action = sequence.action;
          sequence = sequence.sequence;
        }

        sequenceHandlers.push({ callback: callback, action: action, sequence: sequence });
      });
    });

    // Hard reset our handlers (probably could be more efficient)
    mousetrap.reset();
    _forEach2['default'](sequenceHandlers, function (handler) {
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
    return _React2['default'].createElement(
      _FocusTrap2['default'],
      _extends({ ref: 'focusTrap' }, this.props, { onFocus: this.onFocus, onBlur: this.onBlur }),
      this.props.children
    );
  }

});

exports['default'] = HotKeys;
module.exports = exports['default'];