import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import Configuration from './lib/Configuration';
import KeyEventManager from './lib/KeyEventManager';

/**
 * Wraps a React component in a HotKeysEnabled component, which passes down the
 * callbacks and options necessary for React Hotkeys to work as a single prop value,
 * hotkeys. These must be unwrapped and applied to a DOM-mountable element within
 * the wrapped component (e.g. div, span, input, etc) in order for the key events
 * to be recorded.
 *
 * @param {React.Component} Component - Component class to wrap
 * @param {Object} hotKeysOptions - Options that become the wrapping
 * @returns {React.Component} Wrapped component that is passed all of the React hotkeys
 * props in a single value, hotkeys.
 */
function withHotKeys(Component, hotKeysOptions = {}) {
  function mergeWithOptions(key, props) {
    return {
      ...(hotKeysOptions[key] || {}),
      ...(props[key] || {})
    };
  }

  function getHandlers(props) {
    return mergeWithOptions('handlers', props);
  }

  function getKeyMap(props) {
    return mergeWithOptions('keyMap', props);
  }

  return class HotKeysEnabled extends PureComponent {
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
       * A map from action names to Mousetrap or Browser key sequences
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
       * Function to call when this component gains focus in the browser
       * @type {Function}
       */
      onFocus: PropTypes.func,

      /**
       * Function to call when this component loses focus in the browser
       * @type {Function}
       */
      onBlur: PropTypes.func,

      /**
       * Whether the keyMap or handlers are permitted to change after the
       * component mounts. If false, changes to the keyMap and handlers
       * props will be ignored
       */
      allowChanges: PropTypes.bool
    };

    /**
     * Configure the behaviour of HotKeys
     * @param {Object} configuration Configuration object
     * @see Configuration.init
     */
    static configure(configuration = {}) {
      Configuration.init(configuration);
    };

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
      this._componentIsFocused = this._componentIsFocused.bind(this);
    }

    render() {
      const {
        /**
         * Props used by HotKeys that should not be passed down to its focus trap
         * component
         */
        keyMap, handlers, allowChanges,

        ...props
      } = this.props;


      const hotKeys = {
        onFocus: this._wrapFunction('onFocus', this._handleFocus),
        onBlur: this._wrapFunction('onBlur', this._handleBlur),
        onKeyDown: this._handleKeyDown,
        onKeyPress: this._handleKeyPress,
        onKeyUp: this._handleKeyUp,
        tabIndex: Configuration.option('defaultTabIndex')
      };

      return (
        <Component
          hotKeys={ hotKeys }
          { ...props }
        />
      );
    }

    _wrapFunction(propName, func){
      if (typeof this.props[propName] === 'function') {
        return (event) => {
          this.props[propName](event);
          func(event);
        }
      } else {
        return func;
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

    componentDidUpdate(previousProps) {
      if (this._componentIsFocused() && (this.props.allowChanges || !Configuration.option('ignoreKeymapAndHandlerChangesByDefault'))) {
        const {keyMap, handlers} = this.props;

        KeyEventManager.getInstance().updateHotKeys(
          this._getFocusTreeId(),
          this._componentId,
          keyMap,
          handlers,
          this._getComponentOptions()
        );
      }
    }

    componentWillUnmount(){
      this._handleBlur();
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

      const [ focusTreeId, componentId ] =
        KeyEventManager.getInstance().addHotKeys(
          getKeyMap(this.props),
          getHandlers(this.props),
          this._getComponentOptions()
        );

      this._componentId = componentId;
      this._focusTreeIdsPush(focusTreeId);

      this._focused = true;
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

      const retainCurrentFocusTreeId = KeyEventManager.getInstance().removeHotKeys(this._getFocusTreeId(), this._componentId);

      if (!retainCurrentFocusTreeId) {
        this._focusTreeIdsShift();
      }

      this._focused = false;
    }

    /**
     * Delegates handing the keydown event to the KeyEventManager
     * @param {KeyboardEvent} event Key board event containing key name and state
     * @private
     */
    _handleKeyDown(event) {
      const discardFocusTreeId =
        KeyEventManager.getInstance().handleKeydown(
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
        KeyEventManager.getInstance().handleKeypress(
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
        KeyEventManager.getInstance().handleKeyup(
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
}

export default withHotKeys;
