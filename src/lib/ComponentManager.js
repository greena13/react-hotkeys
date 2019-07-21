import Configuration from './config/Configuration';
import isUndefined from '../utils/isUndefined';
import KeyEventManager from './KeyEventManager';
import isEmpty from '../utils/collection/isEmpty';
import KeyCombinationSerializer from './shared/KeyCombinationSerializer';
import lazyLoadAttribute from '../utils/object/lazyLoadAttribute';

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

class ComponentManager {
  constructor(hotKeysOptions, {keyMap}) {
    this._hotKeysOptions = hotKeysOptions;

    this._id = KeyEventManager.getFocusOnlyEventStrategy().registerKeyMap(keyMap);
  }

  getId() {
    return this._id;
  }

  getFocusTreeId() {
    if (this._focusTreeIds) {
      return this._focusTreeIds[0];
    }
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

    return !isEmpty(keyMap) || props.root || (
      Configuration.option('enableHardSequences') && this._handlersIncludeHardSequences(keyMap, this._getHandlers(props))
    );
  }

  /************************************************************************************
   * Registering key maps
   ************************************************************************************/

  addHotKeys(parentId) {
    const keyEventManager = KeyEventManager.getInstance();
    keyEventManager.registerComponentMount(this.getId(), parentId);
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
        this._id,
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

    keyEventManager.reregisterKeyMap(this.getId(), props.keyMap);

    if (this._componentIsFocused() && (props.allowChanges || !Configuration.option('ignoreKeymapAndHandlerChangesByDefault'))) {
      const {keyMap, handlers} = props;

      keyEventManager.updateEnabledHotKeys(
        this.getFocusTreeId(),
        this.getId(),
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

    const retainCurrentFocusTreeId = KeyEventManager.getFocusOnlyEventStrategy().disableHotKeys(this.getFocusTreeId(), this.getId());

    if (!retainCurrentFocusTreeId) {
      this._focusTreeIdsShift();
    }

    this._setFocused(false);
  }

  removeKeyMap(props) {
    const keyEventManager = KeyEventManager.getFocusOnlyEventStrategy();

    keyEventManager.deregisterKeyMap(this.getId());
    KeyEventManager.getInstance().registerComponentUnmount();

    this.disableHotKeys(props);
  }

  /************************************************************************************
   * Focus and focus tree management
   ************************************************************************************/

  _componentIsFocused() {
    return this._focused === true;
  }

  _handlersIncludeHardSequences(keyMap, handlers) {
    return Object.keys(handlers).some((action) => {
      return !keyMap[action] && KeyCombinationSerializer.isValidKeySerialization(action);
    });
  }

  _focusTreeIdsPush(componentId) {
    lazyLoadAttribute(this, '_focusTreeIds', []);

    this._focusTreeIds.push(componentId);
  }

  _focusTreeIdsShift() {
    if (this._focusTreeIds) {
      this._focusTreeIds.shift();
    }
  }

  _setFocused(focused) {
    this._focused = focused;
  }

  _delegateEventToManager(event, methodName) {
    const discardFocusTreeId =
      KeyEventManager.getFocusOnlyEventStrategy()[methodName](
        event,
        this.getFocusTreeId(),
        this.getId(),
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

export default ComponentManager;
