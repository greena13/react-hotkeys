'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _createReactClass = require('create-react-class');

var _createReactClass2 = _interopRequireDefault(_createReactClass);

var _reactDom = require('react-dom');

var _reactDom2 = _interopRequireDefault(_reactDom);

var _FocusTrap = require('./FocusTrap');

var _FocusTrap2 = _interopRequireDefault(_FocusTrap);

var _HotKeyMapMixin = require('./HotKeyMapMixin');

var _HotKeyMapMixin2 = _interopRequireDefault(_HotKeyMapMixin);

var _isBoolean = require('lodash/isBoolean');

var _isBoolean2 = _interopRequireDefault(_isBoolean);

var _isArray = require('lodash/isArray');

var _isArray2 = _interopRequireDefault(_isArray);

var _isObject = require('lodash/isObject');

var _isObject2 = _interopRequireDefault(_isObject);

var _forEach = require('lodash/forEach');

var _forEach2 = _interopRequireDefault(_forEach);

var _isEqual = require('lodash/isEqual');

var _isEqual2 = _interopRequireDefault(_isEqual);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function getSequencesFromMap(hotKeyMap, hotKeyName) {
  var sequences = hotKeyMap[hotKeyName];

  // If no sequence is found with this name we assume
  // the user is passing a hard-coded sequence as a key
  if (!sequences) {
    return [hotKeyName];
  }

  if ((0, _isArray2.default)(sequences)) {
    return sequences;
  }

  return [sequences];
}

var HotKeys = (0, _createReactClass2.default)({
  displayName: 'HotKeys',
  mixins: [(0, _HotKeyMapMixin2.default)()],

  propTypes: {
    children: _propTypes2.default.node,
    onFocus: _propTypes2.default.func,
    onBlur: _propTypes2.default.func,
    keyMap: _propTypes2.default.object,
    handlers: _propTypes2.default.object,
    focused: _propTypes2.default.bool, // externally controlled focus
    attach: _propTypes2.default.any // dom element to listen for key events
  },

  contextTypes: {
    hotKeyParent: _propTypes2.default.any
  },

  childContextTypes: {
    hotKeyParent: _propTypes2.default.any
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
    this.__mousetrap__ = new Mousetrap(this.props.attach || _reactDom2.default.findDOMNode(this));

    this.updateHotKeys(true);
  },
  componentDidUpdate: function componentDidUpdate(prevProps) {
    this.updateHotKeys(false, prevProps);
  },
  componentWillUnmount: function componentWillUnmount() {
    if (this.context.hotKeyParent) {
      this.context.hotKeyParent.childHandledSequence(null);
    }

    if (this.__mousetrap__) {
      this.__mousetrap__.reset();
    }
  },
  updateHotKeys: function updateHotKeys() {
    var _this = this;

    var force = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
    var prevProps = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var _props$handlers = this.props.handlers,
        handlers = _props$handlers === undefined ? {} : _props$handlers;
    var _prevProps$handlers = prevProps.handlers,
        prevHandlers = _prevProps$handlers === undefined ? handlers : _prevProps$handlers;

    // Ensure map is up-to-date to begin with
    // We will only bother continuing if the map was actually updated

    if (!force && !this.updateMap() && (0, _isEqual2.default)(handlers, prevHandlers)) {
      return;
    }

    var hotKeyMap = this.getMap();
    var sequenceHandlers = [];
    var mousetrap = this.__mousetrap__;

    // Group all our handlers by sequence
    (0, _forEach2.default)(handlers, function (handler, hotKey) {
      var handlerSequences = getSequencesFromMap(hotKeyMap, hotKey);

      // Could be optimized as every handler will get called across every bound
      // component - imagine making a node a focus point and then having hundreds!
      (0, _forEach2.default)(handlerSequences, function (sequence) {
        var action = void 0;

        var callback = function callback(event, sequence) {
          // Check we are actually in focus and that a child hasn't already handled this sequence
          var isFocused = (0, _isBoolean2.default)(_this.props.focused) ? _this.props.focused : _this.__isFocused__;

          if (isFocused && sequence !== _this.__lastChildSequence__) {
            if (_this.context.hotKeyParent) {
              _this.context.hotKeyParent.childHandledSequence(sequence);
            }

            return handler(event, sequence);
          }
        };

        if ((0, _isObject2.default)(sequence)) {
          action = sequence.action;
          sequence = sequence.sequence;
        }

        sequenceHandlers.push({ callback: callback, action: action, sequence: sequence });
      });
    });

    // Hard reset our handlers (probably could be more efficient)
    mousetrap.reset();
    (0, _forEach2.default)(sequenceHandlers, function (handler) {
      return mousetrap.bind(handler.sequence, handler.callback, handler.action);
    });
  },
  childHandledSequence: function childHandledSequence() {
    var sequence = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

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
    if (this.context.hotKeyParent) {
      this.context.hotKeyParent.childHandledSequence(null);
    }
  },
  render: function render() {
    var _props3 = this.props,
        children = _props3.children,
        keyMap = _props3.keyMap,
        handlers = _props3.handlers,
        focused = _props3.focused,
        attach = _props3.attach,
        props = _objectWithoutProperties(_props3, ['children', 'keyMap', 'handlers', 'focused', 'attach']);

    return _react2.default.createElement(
      _FocusTrap2.default,
      _extends({}, props, { onFocus: this.onFocus, onBlur: this.onBlur }),
      children
    );
  }
});

exports.default = HotKeys;