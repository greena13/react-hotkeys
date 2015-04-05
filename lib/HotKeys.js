import React from 'react';
import FocusTrap from './FocusTrap';
import Mousetrap from 'mousetrap';
import isArray from 'lodash/lang/isArray';
import assign from 'lodash/object/assign';
import forEach from 'lodash/collection/forEach';

function getSequencesFromMap(hotKeyMap, hotKeyName) {
    const sequences = hotKeyMap[hotKeyName];
    
    if (!sequences) {
      return undefined;
    }
    
    if (isArray(sequences)) {
      return sequences;
    }
    
    return [sequences];
  }

const HotKeys = React.createClass({

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
    return {hotKeyParent: this};
  },

  componentDidMount() {
    // Not optimal - imagine hundreds of this component. We need a top level
    // delegation point for mousetrap - UNLESS MOUSETRAP IS CLEVER ABOUT THIS UNDER THE HOOD :O
    this.__mousetrap__ = new Mousetrap(
      React.findDOMNode(this.refs.focusTrap)
    );
    
    this.updateMap();
    this.updateHotKeys();
  },
  
  componentWillReceiveProps() {
    this.updateMap();
    this.updateHotKeys();
  },
  
  componentWillUnmount() {
    this.__mousetrap__.reset();
  },
  
  updateMap() {
    this.__hotKeyMap__ = this.buildMap();
  },
  
  buildMap() {
    const parentMap = this.context.hotKeyParent ? this.context.hotKeyParent.getMap() : {};
    const thisMap = this.props.keyMap || {};
    
    return assign({}, parentMap, thisMap);
  },
  
  getMap() {
    return this.__hotKeyMap__;
  },
  
  updateHotKeys() {
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
        sequenceHandlers[sequence] = (event) => {
          if (this.__isFocused__) {
            return handler(event);
          }
        }
      });
    });
    
    // Hard reset our handlers (probably could be more efficient)
    mousetrap.reset();
    forEach(sequenceHandlers, (handler, sequence) =>
      mousetrap.bind(sequence, handler));
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
