import PropTypes from 'prop-types';
import React from 'react';
import createReactClass from 'create-react-class';
import ReactDOM from 'react-dom';
import FocusTrap from './FocusTrap';
import HotKeyMapMixin from './HotKeyMapMixin';
import isBool from 'lodash/isBoolean';
import isArray from 'lodash/isArray';
import isObject from 'lodash/isObject';
import forEach from 'lodash/forEach';
import isEqual from 'lodash/isEqual';

function getSequencesFromMap(hotKeyMap, hotKeyName) {
  const sequences = hotKeyMap[hotKeyName];

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

const HotKeys = createReactClass({
  displayName: 'HotKeys',
  mixins: [HotKeyMapMixin()],

  propTypes: {
    children: PropTypes.node,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    keyMap: PropTypes.object,
    handlers: PropTypes.object,
    focused: PropTypes.bool, // externally controlled focus
    attach: PropTypes.any // dom element to listen for key events
  },

  contextTypes: {
    hotKeyParent: PropTypes.any
  },

  childContextTypes: {
    hotKeyParent: PropTypes.any
  },

  getChildContext() {
    return {
      hotKeyParent: this
    };
  },

  componentDidMount() {
    // import is here to support React's server rendering as Mousetrap immediately
    // calls itself with window and it fails in Node environment
    const Mousetrap = require('mousetrap');
    // Not optimal - imagine hundreds of this component. We need a top level
    // delegation point for mousetrap
    this.__mousetrap__ = new Mousetrap(
      this.props.attach || ReactDOM.findDOMNode(this)
    );

    this.updateHotKeys(true);
  },

  componentDidUpdate(prevProps) {
    this.updateHotKeys(false, prevProps);
  },

  componentWillUnmount() {
    if (this.context.hotKeyParent) {
      this.context.hotKeyParent.childHandledSequence(null);
    }

    if (this.__mousetrap__) {
      this.__mousetrap__.reset();
    }
  },

  updateHotKeys(force = false, prevProps = {}) {
    const {handlers = {}} = this.props;
    const {handlers: prevHandlers = handlers} = prevProps;

    // Ensure map is up-to-date to begin with
    // We will only bother continuing if the map was actually updated
    if (!force && !this.updateMap() && isEqual(handlers, prevHandlers)) {
      return;
    }

    const hotKeyMap = this.getMap();
    const sequenceHandlers = [];
    const mousetrap = this.__mousetrap__;

    // Group all our handlers by sequence
    forEach(handlers, (handler, hotKey) => {
      const handlerSequences = getSequencesFromMap(hotKeyMap, hotKey);

      // Could be optimized as every handler will get called across every bound
      // component - imagine making a node a focus point and then having hundreds!
      forEach(handlerSequences, (sequence) => {
        let action;

        const callback = (event, sequence) => {
          // Check we are actually in focus and that a child hasn't already handled this sequence
          const isFocused = isBool(this.props.focused)
            ? this.props.focused
            : this.__isFocused__;

          if (isFocused && sequence !== this.__lastChildSequence__) {
            if (this.context.hotKeyParent) {
              this.context.hotKeyParent.childHandledSequence(sequence);
            }

            return handler(event, sequence);
          }
        };

        if (isObject(sequence)) {
          action = sequence.action;
          sequence = sequence.sequence;
        }

        sequenceHandlers.push({callback, action, sequence});
      });
    });

    // Hard reset our handlers (probably could be more efficient)
    mousetrap.reset();
    forEach(sequenceHandlers, (handler) =>
      mousetrap.bind(handler.sequence, handler.callback, handler.action));
  },

  childHandledSequence(sequence = null) {
    this.__lastChildSequence__ = sequence;

    // Traverse up any hot key parents so everyone is aware a child has handled a certain sequence
    if (this.context.hotKeyParent) {
      this.context.hotKeyParent.childHandledSequence(sequence);
    }
  },

  onFocus() {
    this.__isFocused__ = true;

    if (this.props.onFocus) {
      this.props.onFocus(...arguments);
    }
  },

  onBlur() {
    this.__isFocused__ = false;

    if (this.props.onBlur) {
      this.props.onBlur(...arguments);
    }
    if (this.context.hotKeyParent) {
      this.context.hotKeyParent.childHandledSequence(null);
    }
  },

  render() {
    const {children, keyMap, handlers, focused, attach, ...props} = this.props;

    return (
      <FocusTrap {...props} onFocus={this.onFocus} onBlur={this.onBlur}>
        {children}
      </FocusTrap>
    );
  },
});

export default HotKeys;
