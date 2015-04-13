import React from 'react';
import FocusTrap from './FocusTrap';
import HotKeyMapMixin from './HotKeyMapMixin';
import Mousetrap from 'mousetrap';
import isArray from 'lodash/lang/isArray';
import forEach from 'lodash/collection/forEach';

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

const HotKeys = React.createClass({

  mixins: [HotKeyMapMixin()],

  propTypes: {
    onFocus: React.PropTypes.func,
    onBlur: React.PropTypes.func,
    focusName: React.PropTypes.string, // Currently unused
    keyMap: React.PropTypes.object,
    handlers: React.PropTypes.object
  },

  contextTypes: {
    hotKeyParent: React.PropTypes.any
  },

  childContextTypes: {
    hotKeyParent: React.PropTypes.any
  },

  getChildContext() {
    return {
      hotKeyParent: this
    };
  },

  componentDidMount() {
    // Not optimal - imagine hundreds of this component. We need a top level
    // delegation point for mousetrap
    this.__mousetrap__ = new Mousetrap(
      React.findDOMNode(this.refs.focusTrap)
    );

    this.updateHotKeys(true);
  },

  componentDidUpdate() {
    this.updateHotKeys();
  },

  componentWillUnmount() {
    if (this.context.hotKeyParent) {
      this.context.hotKeyParent.childHandledSequence(null);
    }

    this.__mousetrap__.reset();
  },

  updateHotKeys(force = false) {
    // Ensure map is up-to-date to begin with
    // We will only bother continuing if the map was actually updated
    if (!this.updateMap() && !force) {
      return;
    }

    const {handlers = {}} = this.props;
    const hotKeyMap = this.getMap();
    const sequenceHandlers = {};
    const mousetrap = this.__mousetrap__;

    // Group all our handlers by sequence
    forEach(handlers, (handler, hotKey) => {
      const handlerSequences = getSequencesFromMap(hotKeyMap, hotKey);

      // Could be optimized as every handler will get called across every bound
      // component - imagine making a node a focus point and then having hundreds!
      forEach(handlerSequences, (sequence) => {
        sequenceHandlers[sequence] = (event, sequence) => {
          // Check we are actually in focus and that a child hasn't already handled this sequence
          if (this.__isFocused__ && sequence !== this.__lastChildSequence__) {
            if (this.context.hotKeyParent) {
              this.context.hotKeyParent.childHandledSequence(sequence);
            }

            return handler(event, sequence);
          }
        }
      });
    });

    // Hard reset our handlers (probably could be more efficient)
    mousetrap.reset();
    forEach(sequenceHandlers, (handler, sequence) =>
      mousetrap.bind(sequence, handler));
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
  },

  render() {
    return (
      <FocusTrap ref="focusTrap" {...this.props} onFocus={this.onFocus} onBlur={this.onBlur}>
        {this.props.children}
      </FocusTrap>
    )
  }

});

export default HotKeys;
