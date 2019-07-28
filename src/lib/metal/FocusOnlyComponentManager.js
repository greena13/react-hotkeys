import Configuration from '../config/Configuration';
import isUndefined from '../../utils/isUndefined';
import KeyEventManager from '../KeyEventManager';
import isEmpty from '../../utils/collection/isEmpty';

function wrapPropInFunction(prop, func){
  if (typeof prop === 'function') {
    return (event) => {
      prop(event);
      func(event);
    }
  } else {
    return func;
  }
}


function getComponentOptions() {
  return {
    defaultKeyEvent: Configuration.option('defaultKeyEvent')
  };
}

function getEventOptions() {
  return {
    ignoreEventsCondition: Configuration.option('ignoreEventsCondition')
  };
}

class FocusOnlyComponentManager {
  constructor(hotKeysOptions, {keyMap}) {
    this._hotKeysOptions = hotKeysOptions;

    this.id = KeyEventManager.getFocusOnlyEventStrategy().registerKeyMap(keyMap);

    /**
     * We maintain a separate instance variable to contain context that will be
     * passed down to descendants of this component so we can have a consistent
     * reference to the same object, rather than instantiating a new one on each
     * render, causing unnecessary re-rendering of descendant components that
     * consume the context.
     *
     * @see https://reactjs.org/docs/context.html#caveats
     */
    this.childContext = { hotKeysParentId: this.id };

    this._focusTreeIds = [];
  }

  get focusTreeId() {
    return this._focusTreeIds[0];
  }

  getComponentProps(props) {
    const componentProps = {
      onFocus: wrapPropInFunction(props.onFocus, () => this.enableHotKeys(props)),
      onBlur: wrapPropInFunction(props.onBlur, () => this.disableHotKeys(props)),
      tabIndex: Configuration.option('defaultTabIndex')
    };

    if (this._shouldBindKeyListeners(props)) {
      componentProps.onKeyDown = (event) => this._delegateEventToManager(event, 'handleKeyDown');
      componentProps.onKeyPress = (event) => this._delegateEventToManager(event, 'handleKeyPress');
      componentProps.onKeyUp = (event) => this._delegateEventToManager(event, 'handleKeyUp');
    }

    return componentProps
  }

  _shouldBindKeyListeners(props) {
    const keyMap = this._getKeyMap(props);

    return !isEmpty(keyMap) || props.root;
  }

  /************************************************************************************
   * Registering key maps
   ************************************************************************************/

  addHotKeys(parentId) {
    const keyEventManager = KeyEventManager.getInstance();
    keyEventManager.registerComponentMount(this.id, parentId);
  }

  /**
   * Handles when the component gains focus by calling onFocus prop, if defined, and
   * registering itself with the KeyEventManager
   * @private
   */
  enableHotKeys(props) {
    if (props.onFocus) {
      props.onFocus(...arguments);
    }

    const focusTreeId =
      KeyEventManager.getFocusOnlyEventStrategy().enableHotKeys(
        this.id,
        this._getKeyMap(props),
        this._getHandlers(props),
        getComponentOptions()
      );

    if (!isUndefined(focusTreeId)) {
      /**
       * focusTreeId should never normally be undefined, but this return state is
       * used to indicate that a component with the same componentId has already
       * registered as focused/enabled (again, a condition that should not normally
       * occur, but apparently can for as-yet unknown reasons).
       *
       * @see https://github.com/greena13/react-hotkeys/issues/173
       */
      this._focusTreeIdsPush(focusTreeId);
    }

    this._setFocused(true);
  }

  updateHotKeys(props) {
    const keyEventManager = KeyEventManager.getFocusOnlyEventStrategy();

    keyEventManager.reregisterKeyMap(this.id, props.keyMap);

    if (this._componentIsFocused() && (props.allowChanges || !Configuration.option('ignoreKeymapAndHandlerChangesByDefault'))) {
      const {keyMap, handlers} = props;

      keyEventManager.updateEnabledHotKeys(
        this.focusTreeId,
        this.id,
        keyMap,
        handlers,
        getComponentOptions()
      );
    }
  }

  /**
   * Handles when the component loses focus by calling the onBlur prop, if defined
   * and removing itself from the KeyEventManager
   * @private
   */
  disableHotKeys(props) {
    if (props.onBlur) {
      props.onBlur(...arguments);
    }

    const retainCurrentFocusTreeId = KeyEventManager.getFocusOnlyEventStrategy().disableHotKeys(this.focusTreeId, this.id);

    if (!retainCurrentFocusTreeId) {
      this._focusTreeIdsShift();
    }

    this._setFocused(false);
  }

  removeKeyMap(props) {
    const keyEventManager = KeyEventManager.getFocusOnlyEventStrategy();

    keyEventManager.deregisterKeyMap(this.id);
    KeyEventManager.getInstance().registerComponentUnmount();

    this.disableHotKeys(props);
  }

  /************************************************************************************
   * Focus and focus tree management
   ************************************************************************************/

  _componentIsFocused() {
    return this._focused === true;
  }

  _focusTreeIdsPush(componentId) {
    this._focusTreeIds.push(componentId);
  }

  _focusTreeIdsShift() {
    this._focusTreeIds.shift();
  }

  _setFocused(focused) {
    this._focused = focused;
  }

  _delegateEventToManager(event, methodName) {
    const discardFocusTreeId =
      KeyEventManager.getFocusOnlyEventStrategy()[methodName](
        event,
        this.focusTreeId,
        this.id,
        getEventOptions()
      );

    if (discardFocusTreeId) {
      this._focusTreeIdsShift();
    }
  }

  _mergeWithOptions(key, props) {
    return {
      ...(this._hotKeysOptions[key] || {}),
      ...(props[key] || {})
    };
  }

  _getHandlers(props) {
    return this._mergeWithOptions('handlers', props);
  }

  _getKeyMap(props) {
    return this._mergeWithOptions('keyMap', props);
  }
}

export default FocusOnlyComponentManager;
