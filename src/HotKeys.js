import PropTypes from 'prop-types';
import React, { Component } from 'react';
import FocusTrap from './FocusTrap';

import KeyEventManager from './lib/KeyEventManager';
import ignoreEventsCondition from './helpers/resolving-handlers/ignoreEventsCondition';
import Logger from './lib/Logger';
import isUndefined from './utils/isUndefined';
import Configuration from './lib/Configuration';
import hasChanged from './utils/object/hasChanged';

/**
 * Component that wraps it children in a "focus trap" and allows key events to
 * trigger function handlers when its children are in focus
 * @class
 */
class HotKeys extends Component {
  /**
   * @callback IgnoreEventsConditionCallback
   * @param {KeyboardEvent} event Keyboard event
   * @return {Boolean} Whether to ignore the event
   */

  /**
   * Sets the function used to determine whether a keyboard event should be ignored.
   *
   * The function passed as an argument accepts the KeyboardEvent as its only argument.
   * @param {IgnoreEventsConditionCallback} func Function to use to decide whether to
   *        ignore keyboard events
   */
  static setIgnoreEventsCondition(func) {
    Configuration.set('ignoreEventsCondition', func);
  }

  /**
   * Sets the ignoreEventsCondition function back to its default value
   */
  static resetIgnoreEventsCondition(){
    Configuration.set('ignoreEventsCondition', ignoreEventsCondition);
  }

  /**
   * Configure the behaviour of HotKeys
   * @param {Object} configuration Configuration object
   * @see Configuration.init
   */
  static configure(configuration = {}) {
    Configuration.init(configuration);
  }

  static propTypes = {
    /**
     * A unique key to associate with KeyEventMatchers that allows associating handler
     * functions at a later stage
     * @typedef {String} ActionName
     */

    /**
     * Name of a key event
     * @typedef {'keyup'|'keydown'|'keypress'} KeyEventName
     */

    /**
     * A string or list of strings, that represent a sequence of one or more keys
     * @typedef {String | Array.<String>} MouseTrapKeySequence
     * @see {@link https://craig.is/killing/mice} for support key sequences
     */

    /**
     * Options for the mapping of a key sequence and event
     * @typedef {Object} KeyEventOptions
     * @property {MouseTrapKeySequence} sequence - The key sequence required to satisfy a
     *           KeyEventDescription
     * @property {KeyEventName} action - The keyboard state required to satisfy a
     *           KeyEventDescription
     */

    /**
     * A description of key sequence of one or more key combinations
     * @typedef {MouseTrapKeySequence|KeyMapOptions|Array<MouseTrapKeySequence>} KeyEventDescription
     */

    /**
     * A mapping from ActionName to KeyEventDescription
     * @typedef {Object.<ActionName, KeyEventDescription>} KeyMap
     */

    /**
     * A map from action names to Mousetrap key sequences
     * @type {KeyMap}
     */
    keyMap: PropTypes.object,

    /**
     * A map from action names to event handler functions
     * @typedef {Object<ActionName, Function>} HandlersMap
     */

    /**
     * A map from action names to event handler functions
     * @type {HandlersMap}
     */
    handlers: PropTypes.object,

    /**
     * Whether the hotkeys should be applied globally (the current
     * component or indeed the React app need not be in focus for
     * the keys be matched)
     * @type {Boolean}
     */
    global: PropTypes.bool,

    /**
     * Children to wrap within a focus trap
     */
    children: PropTypes.node,

    /**
     * Function to call when this component gains focus in the browser
     * @type {Function}
     */
    onFocus: PropTypes.func,

    /**
     * Function to call when this component loses focus in the browser
     * @type {Function}
     */
    onBlur: PropTypes.func,
  };

  /**
   * Returns a KeyEventManager singleton
   * @returns {KeyEventManager}
   */
  static getKeyEventManager() {
    return KeyEventManager.getInstance({
      logger: new Logger(Configuration.option('logLevel'))
    });
  }

  constructor(props, context) {
    super(props, context);

    /**
     * The focus and blur handlers need access to the current component as 'this'
     * so they need to be bound to it when the component is instantiated
     */

    this._handleFocus = this._handleFocus.bind(this);
    this._handleBlur = this._handleBlur.bind(this);

    this._handleKeyDown = this._handleKeyDown.bind(this);
    this._handleKeyPress = this._handleKeyPress.bind(this);
    this._handleKeyUp = this._handleKeyUp.bind(this);
    this._isGlobalComponent = this._isGlobalComponent.bind(this);
    this._componentIsFocused = this._componentIsFocused.bind(this);
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
      keyMap, handlers, global,

      children,
      ...props
    } = this.props;

    if (global && !children) {
      /**
       * There is no need to render the FocusTrap is component is global and
       * without any children
       */
      return null;
    } else {
      return (
        <FocusTrap
          { ...props }
          onFocus={ this._handleFocus }
          onBlur={ this._handleBlur }
          onKeyDown={ this._handleKeyDown }
          onKeyPress={ this._handleKeyPress }
          onKeyUp={ this._handleKeyUp }
        >
          { children }
        </FocusTrap>
      );
    }
  }

  _focusTreeIdsPush(componentId) {
    if (!this._focusTreeIds) {
      this._focusTreeIds = [];
    }

    this._focusTreeIds.push(componentId);
  }

  _focusTreeIdsShift() {
    if (this._focusTreeIds) {
      this._focusTreeIds.shift();
    }
  }

  _getFocusTreeId() {
    if (this._focusTreeIds) {
      return this._focusTreeIds[0];
    }
  }

  componentDidMount() {
    const { global, keyMap, handlers } = this.props;

    if (global) {
      this._globalIndex =
        this.constructor.getKeyEventManager().addGlobalHotKeys(
          keyMap,
          handlers,
          this._getComponentOptions(),
          this._getEventOptions()
        );
    }
  }

  componentWillReceiveProps(nextProps) {
    if (hasChanged(nextProps.handlers, this.props.handlers)
      || hasChanged(nextProps.keyMap, this.props.keyMap)) {
      /**
       * NB: We are not supporting changing a component's global prop - once a component
       * is mounted as global or non-global, it must remain that way.
       */
      if (this._isGlobalComponent(nextProps)) {
        /**
         * Component defines global hotkeys, so any changes to props may have changes
         * that should have immediate effect
         */
        this.constructor.getKeyEventManager().updateGlobalHotKeys(
          this._globalIndex,
          nextProps.keyMap,
          nextProps.handlers,
          this._getComponentOptions(),
          this._getEventOptions()
        );
      } else {
        if (this._componentIsFocused()) {
          /**
           * Component is in focus and non-global, so update key map as it may have
           * changes that should have immediate effect
           */
          this.constructor.getKeyEventManager().updateHotKeys(
            this._getFocusTreeId(),
            this._componentId,
            nextProps.keyMap,
            nextProps.handlers,
            this._getComponentOptions()
          );
        }
      }
    }
  }

  componentWillUnmount(){
    if (this._isGlobalComponent()) {
      this.constructor.getKeyEventManager().removeGlobalHotKeys(this._globalIndex)
    } else {
      this._handleBlur();
    }
  }

  _isGlobalComponent(props = this.props) {
    const {global} = props;
    return !isUndefined(global);
  }

  _isFocusOnlyComponent(props = this.props) {
    return !this._isGlobalComponent(props);
  }

  _componentIsFocused() {
    return this._focused === true;
  }

  /**
   * Handles when the component gains focus by calling onFocus prop, if defined, and
   * registering itself with the KeyEventManager
   * @private
   */
  _handleFocus() {
    if (this.props.onFocus) {
      this.props.onFocus(...arguments);
    }

    if (this._isFocusOnlyComponent()) {
      const [ focusTreeId, componentId ] =
        this.constructor.getKeyEventManager().addHotKeys(
          this.props.keyMap,
          this.props.handlers,
          this._getComponentOptions()
        );

      this._componentId = componentId;
      this._focusTreeIdsPush(focusTreeId);

      this._focused = true;
    }
  }

  /**
   * Handles when the component loses focus by calling the onBlur prop, if defined
   * and removing itself from the KeyEventManager
   * @private
   */
  _handleBlur() {
    if (this.props.onBlur) {
      this.props.onBlur(...arguments);
    }

    if (this._isFocusOnlyComponent()) {
      const retainCurrentFocusTreeId = this.constructor.getKeyEventManager().removeHotKeys(this._getFocusTreeId(), this._componentId);

      if (!retainCurrentFocusTreeId) {
        this._focusTreeIdsShift();
      }

      this._focused = false;
    }
  }

  /**
   * Delegates handing the keydown event to the KeyEventManager
   * @param {KeyboardEvent} event Key board event containing key name and state
   * @private
   */
  _handleKeyDown(event) {
    const discardFocusTreeId =
      this.constructor.getKeyEventManager().handleKeydown(
        event,
        this._getFocusTreeId(),
        this._componentId,
        this._getEventOptions()
      );

    if (discardFocusTreeId) {
      this._focusTreeIdsShift();
    }
  }

  /**
   * Delegates handing the keypress event to the KeyEventManager
   * @param {KeyboardEvent} event Key board event containing key name and state
   * @private
   */
  _handleKeyPress(event) {
    const discardFocusTreeId =
      this.constructor.getKeyEventManager().handleKeypress(
        event,
        this._getFocusTreeId(),
        this._componentId,
        this._getEventOptions()
      );

    if (discardFocusTreeId) {
      this._focusTreeIdsShift();
    }
  }

  /**
   * Delegates handing the keyup event to the KeyEventManager
   * @param {KeyboardEvent} event Key board event containing key name and state
   * @private
   */
  _handleKeyUp(event) {
    const discardFocusTreeId =
      this.constructor.getKeyEventManager().handleKeyup(
        event,
        this._getFocusTreeId(),
        this._componentId,
        this._getEventOptions()
      );

    if (discardFocusTreeId) {
      this._focusTreeIdsShift();
    }
  }

  _getComponentOptions() {
    return {
      defaultKeyEvent: Configuration.option('defaultKeyEvent')
    };
  }

  _getEventOptions() {
    return {
      ignoreEventsCondition: Configuration.option('ignoreEventsCondition')
    };
  }
}

export default HotKeys;
