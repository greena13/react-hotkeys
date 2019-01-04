import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import hasChanged from './utils/object/hasChanged';
import isUndefined from './utils/isUndefined';
import Configuration from './lib/Configuration';
import KeyEventManager from './lib/KeyEventManager';
import Logger from './lib/Logger';

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

  function getGlobal(props) {
    return props.global || hotKeysOptions.global;
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
       * Whether the hotkeys should be applied globally (the current
       * component or indeed the React app need not be in focus for
       * the keys be matched)
       * @type {Boolean}
       */
      global: PropTypes.bool,

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
      this._isGlobalComponent = this._isGlobalComponent.bind(this);
      this._componentIsFocused = this._componentIsFocused.bind(this);
    }

    render() {
      const {
        /**
         * Props used by HotKeys that should not be passed down to its focus trap
         * component
         */
        keyMap, handlers, global,

        ...props
      } = this.props;


      if (getGlobal(this.props) && !this.props.children) {
        return <Component{ ...props }/>;
      } else {

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

    componentDidMount() {
      if (getGlobal(this.props)) {
        this._globalIndex =
          this.constructor.getKeyEventManager().addGlobalHotKeys(
            getKeyMap(this.props),
            getHandlers(this.props),
            this._getComponentOptions(),
            this._getEventOptions()
          );
      }
    }

    componentWillReceiveProps(nextProps) {
      const nextHandlers = getHandlers(nextProps);
      const prevHandlers = getHandlers(this.props);

      const nextKeyMap = getKeyMap(nextProps);
      const prevKeyMap = getKeyMap(this.props);

      if (hasChanged(nextHandlers, prevHandlers) || hasChanged(nextKeyMap, prevKeyMap)) {
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
            nextKeyMap,
            nextHandlers,
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
              nextKeyMap,
              nextHandlers,
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
      return !isUndefined(getGlobal(props));
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
            getKeyMap(this.props),
            getHandlers(this.props),
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
}

export default withHotKeys;
