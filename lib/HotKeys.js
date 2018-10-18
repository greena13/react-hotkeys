import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import FocusTrap from './FocusTrap';

import isBool from 'lodash.isboolean';
import isObject from 'lodash.isobject';
import isEqual from 'lodash.isequal';
import sequencesFromKeyMap from './utils/sequencesFromKeyMap';
import hasChanged from './utils/hasChanged';

/**
 * A string or list of strings, that represent a sequence of one or more keys
 * @typedef {String | Array.<String>} MouseTrapKeySequence
 * @see {@link https://craig.is/killing/mice} for support key sequences
 */

/**
 * Name of a key event
 * @typedef {'keyup'|'keydown'|'keypress'} KeyEventName
 */

/**
 * Options for the mapping of a key sequence and event
 * @typedef {Object} KeyEventOptions
 * @property {MouseTrapKeySequence} The key sequence required to satisfy a KeyEventMatcher
 * @property {KeyEventName} action The keyboard state required to satisfy a KeyEventMatcher
 */

/**
 * A matcher used on keyboard sequences and events to trigger handler functions
 * when matching sequences occur
 * @typedef {MouseTrapKeySequence | KeyMapOptions | Array<MouseTrapKeySequence>} KeyEventMatcher
 */

/**
 * A unique key to associate with KeyEventMatchers that allows associating handler
 * functions at a later stage
 * @typedef {String} ActionName
 */

/**
 * A mapping from ActionNames to KeyEventMatchers
 * @typedef {Object.<String, KeyEventMatcher>} KeySequence
 */

/**
 * Component that wraps it children in a "focus trap" and allows key events to
 * trigger function handlers when its children are in focus
 */
class HotKeys extends Component {

  static propTypes = {
    /**
     * A map from action names to Mousetrap key sequences
     */
    keyMap: PropTypes.object,

    /**
     * A map from action names to event handler functions
     */
    handlers: PropTypes.object,

    /**
     * Whether HotKeys should behave as if it has focus in the browser,
     * whether it does or not - a way to force focus behaviour
     */
    focused: PropTypes.oneOfType([
      PropTypes.bool,
      PropTypes.func,
    ]),

    /**
     * The DOM element the keyboard listeners should be attached to
     */
    attach: PropTypes.any,

    /**
     * Children to wrap within a focus trap
     */
    children: PropTypes.node,

    /**
     * Function to call when this component gains focus in the browser
     */
    onFocus: PropTypes.func,

    /**
     * Function to call when this component loses focus in the browser
     */
    onBlur: PropTypes.func,

    /**
     * Boolean for whether or not to rernder FocusTrap - focused status will need to be tracked
     * via a function in the focused prop.
     */
    useFocusTrap: PropTypes.bool
  };

  static defaultProps = {
    useFocusTrap: true,
  };

  static childContextTypes = {
    /**
     * Reference to this instance of HotKeys so that any descendents are aware
     * that they are being rendered within another HotKeys component
     */
    hotKeyParent: PropTypes.any,

    /**
     * Reference to this instance's KeyMap so that any descendents may merge it
     * into its own
     */
    hotKeyMap: PropTypes.object
  };

  static contextTypes = {
    /**
     * Reference to the most direct ancestor that is a HotKeys component (if one
     * exists) so that messages may be passed to it when necessary
     */
    hotKeyParent: PropTypes.any,

    /**
     * Reference to the KeyMap of its most direct HotKeys ancestor, so that it may
     * be merged into this components
     */
    hotKeyMap: PropTypes.object
  };

  constructor(props, context) {
    super(props, context);

    /**
     * The focus and blur handlers need access to the current component as 'this'
     * so they need to be bound to it when the component is instantiated
     */

    this.onFocus = this.onFocus.bind(this);
    this.onBlur = this.onBlur.bind(this);
  }

  /**
   * Constructs the context object that contains references to this component
   * and its KeyMap so that they may be accessed by any descendant HotKeys
   * components
   * @returns {{hotKeyParent: HotKeys, hotKeyMap: KeySequence}} Child context object
   */
  getChildContext() {
    return {
      hotKeyParent: this,
      hotKeyMap: this.__hotKeyMap__
    };
  }

  /**
   * Sets this components KeyMap from its keyMap prop and the KeyMap of its
   * ancestor KeyMap component (if one exists)
   */
  componentWillMount() {
    this.updateMap();
  }

  /**
   * Updates this component's KeyMap if either its own keyMap prop has changed
   * or its ancestor's KeyMap has been update
   *
   * @returns {boolean} Whether the KeyMap was updated
   */
  updateMap() {
    const newMap = this.buildMap();

    if (!isEqual(newMap, this.__hotKeyMap__)) {
      this.__hotKeyMap__ = newMap;

      return true;
    }

    return false;
  }

  /**
   * This component's KeyMap merged with that of its most direct ancestor that is a
   * HotKeys component. This component's mappings take precedence over those defined
   * in its ancestor.
   * @returns {KeySequence} This component's KeyMap merged with its HotKeys ancestor's
   */
  buildMap() {
    const parentMap = this.context.hotKeyMap || {};
    const thisMap = this.props.keyMap || {};

    /**
     * TODO: This appears to only merge in the key maps of its most direct
     * ancestor - what about grandparent components' KeyMap's?
     */
    return {...parentMap, ...thisMap};
  }

  /**
   * This component's KeyMap
   * @returns {KeySequence} This component's KeyMap
   */
  getMap() {
    return this.__hotKeyMap__;
  }

  /**
   * Imports mousetrap and stores a reference to it on the this component
   */
  componentDidMount() {
    // import is here to support React's server rendering as Mousetrap immediately
    // calls itself with window and it fails in Node environment
    const Mousetrap = require('mousetrap');

    /**
     * TODO: Not optimal - imagine hundreds of this component. We need a top level
     * delegation point for mousetrap
     */
    this.__mousetrap__ = new Mousetrap(
      this.props.attach || ReactDOM.findDOMNode(this)
    );

    this.updateHotKeys(true);
  }

  /**
   * Updates this component's KeyMap and synchronises the handlers across to
   * Mousetrap after the component has been updated (passed new prop values)
   * @param {Object} prevProps The props used on the component's last render
   */
  componentDidUpdate(prevProps) {
    this.updateHotKeys(false, prevProps);
  }

  componentWillUnmount() {
    if (this.context.hotKeyParent) {
      this.context.hotKeyParent.childHandledSequence(null);
    }

    if (this.__mousetrap__) {
      this.__mousetrap__.reset();
    }
  }

  /**
   * Updates this component's KeyMap and synchronises the changes across
   * to Mouestrap
   * @param {Boolean} force Whether to force an update of the KeyMap and sync
   *        to Mousetrap, even if no relevant values appear to have changed
   *        since the last time
   * @param {Object} prevProps The props used on the component's last render
   */
  updateHotKeys(force = false, prevProps = {}) {
    const {handlers = {}} = this.props;
    const {handlers: prevHandlers = handlers} = prevProps;

    const keyMapHasChanged = this.updateMap();

    if (force || keyMapHasChanged || hasChanged(handlers, prevHandlers)) {
      if (this.context.hotKeyParent) {
        this.context.hotKeyParent.childHandledSequence(null);
      }
      this.syncHandlersToMousetrap();
    }
  }

  /**
   * Synchronises the KeyMap and handlers applied to this component over to
   * Mousetrap
   */
  syncHandlersToMousetrap() {
    const { handlers = {} } = this.props;

    const hotKeyMap = this.getMap();
    const sequenceHandlers = [];
    const mousetrap = this.__mousetrap__;

    // Group all our handlers by sequence
    Object.keys(handlers).forEach((hotKey) => {
      const handler = handlers[hotKey];

      const sequencesAsArray = sequencesFromKeyMap(hotKeyMap, hotKey);

      /**
       * TODO: Could be optimized as every handler will get called across every bound
       * component - imagine making a node a focus point and then having hundreds!
       */
      sequencesAsArray.forEach((sequence) => {
        let action;

        const callback = (event, sequence) => {
          /**
           * Check we are actually in focus and that a child hasn't already
           * handled this sequence
           */
          let isFocused = this.__isFocused__;
          if (typeof this.props.focused === 'function') {
            isFocused = this.props.focused();
          } else if (this.props.focused) {
            isFocused = this.props.focused;
          }

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

    /**
     * TODO: Hard reset our handlers (probably could be more efficient)
     */
    mousetrap.reset();

    sequenceHandlers.forEach(({ sequence, callback, action }) =>
      mousetrap.bind(sequence, callback, action));
  }

  /**
   * Stores a reference to the last key sequence handled by the most direct
   * descendant HotKeys component, and passes that sequence to its own most
   * direct HotKeys ancestor for it to do the same.
   *
   * This reference is stored so that parent HotKeys components do not try
   * to handle a sequence that has already been handled by one of its
   * descendants.
   *
   * @param {KeyEventMatcher} sequence The sequence handled most recently by
   * a child HotKeys component
   */
  childHandledSequence(sequence = null) {
    this.__lastChildSequence__ = sequence;

    /**
     * Traverse up any hot key parents so everyone is aware a child has
     * handled a certain sequence
     */
    if (this.context.hotKeyParent) {
      this.context.hotKeyParent.childHandledSequence(sequence);
    }
  }

  /**
   * Renders the component's children wrapped in a FocusTrap with the necessary
   * props to capture keyboard events
   *
   * @returns {FocusTrap} FocusTrap with necessary props to capture keyboard events
   */
  render() {
    const {
      /**
       * Props used by HotKeys that should not be passed down to its focus trap
       * component
       */
      keyMap, handlers, focused, attach,

      children,
      useFocusTrap,
      ...props
    } = this.props;

    if (useFocusTrap) {
      return (
        <FocusTrap { ...props } onFocus={ this.onFocus } onBlur={ this.onBlur }>
          { children }
        </FocusTrap>
      );
    }

    return children;

  }

  /**
   * Updates the internal focused state and calls the onFocus prop if it is
   * defined
   */
  onFocus() {
    this.__isFocused__ = true;

    if (this.props.onFocus) {
      this.props.onFocus(...arguments);
    }
  }

  /**
   * Updates the internal focused state and calls the onBlur prop if it is
   * defined.
   *
   * Also registers a null sequence as being handled by this component with
   * its ancestor HotKeys.
   */
  onBlur() {
    this.__isFocused__ = false;

    if (this.props.onBlur) {
      this.props.onBlur(...arguments);
    }

    if (this.context.hotKeyParent) {
      this.context.hotKeyParent.childHandledSequence(null);
    }
  }
}


export default HotKeys;
