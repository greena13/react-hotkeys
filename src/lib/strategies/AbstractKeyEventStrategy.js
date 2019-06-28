import KeyEventRecordIndex from '../../const/KeyEventRecordIndex';
import ModifierFlagsDictionary from '../../const/ModifierFlagsDictionary';
import KeyEventRecordState from '../../const/KeyEventRecordState';

import Logger from '../Logger';
import KeyCombinationSerializer from '../KeyCombinationSerializer';
import Configuration from '../Configuration';
import KeyCombinationHistory from '../KeyCombinationHistory';
import KeyCombinationRecord from '../KeyCombinationRecord';
import Registry from '../Registry';
import ComponentRegistry from '../ComponentRegistry';
import ComponentOptionsList from '../ComponentOptionsList';
import ActionResolver from '../ActionResolver';

import arrayFrom from '../../utils/array/arrayFrom';
import isObject from '../../utils/object/isObject';
import isUndefined from '../../utils/isUndefined';
import copyAttributes from '../../utils/object/copyAttributes';
import hasKey from '../../utils/object/hasKey';

import describeKeyEventType from '../../helpers/logging/describeKeyEventType';
import printComponent from '../../helpers/logging/printComponent';
import hasKeyPressEvent from '../../helpers/resolving-handlers/hasKeyPressEvent';
import keyIsCurrentlyTriggeringEvent from '../../helpers/parsing-key-maps/keyIsCurrentlyTriggeringEvent';
import keyupIsHiddenByCmd from '../../helpers/resolving-handlers/keyupIsHiddenByCmd';
import stateFromEvent from '../../helpers/parsing-key-maps/stateFromEvent';

const SEQUENCE_ATTRIBUTES = ['sequence', 'action'];
const KEYMAP_ATTRIBUTES = ['name', 'description', 'group'];

/**
 * Defines common behaviour for key event strategies
 * @abstract
 * @class
 */
class AbstractKeyEventStrategy {
  /********************************************************************************
   * Init & Reset
   ********************************************************************************/

  /**
   * Creates a new instance of a event strategy (this class is an abstract one and
   * not intended to be instantiated directly)
   * @param {Object} options Options for how event strategy should behave
   * @param {Logger} options.logger The Logger to use to report event strategy actions
   * @param {KeyEventManager} keyEventManager KeyEventManager used for passing
   *        messages between key event strategies
   */
  constructor(options = {}, keyEventManager) {
    this.logger = options.logger || new Logger('warn');
    /**
     * @typedef {Number} ComponentId Unique index associated with every HotKeys component
     * as it becomes active.
     *
     * For focus-only components, this happens when the component is focused. The HotKeys
     * component closest to the DOM element in focus gets the smallest number (0) and
     * those further up the render tree get larger (incrementing) numbers. When a different
     * element is focused (triggering the creation of a new focus tree) all component indexes
     * are reset (de-allocated) and re-assigned to the new tree of HotKeys components that
     * are now in focus.
     *
     * For global components, component indexes are assigned when a HotKeys component is
     * mounted, and de-allocated when it unmounts. The component index counter is never reset
     * back to 0 and just keeps incrementing as new components are mounted.
     */

    /**
     * Counter to maintain what the next component index should be
     * @type {ComponentId}
     */
    this.componentId = -1;

    /**
     * Reference to key event manager, so that information may pass between the
     * global strategy and the focus-only strategy
     * @type {KeyEventManager}
     */
    this.keyEventManager = keyEventManager;

    this.keyMapRegistry = new Registry();

    this.componentRegistry = new ComponentRegistry();

    this.rootComponentId = null;

    this.componentList = new ComponentOptionsList();

    this._reset();

    this.resetKeyHistory();
  }

  /**
   * Resets all strategy state to the values it had when it was first created
   * @protected
   */
  _reset() {
    this.componentList.clear();
    this._initHandlerResolutionState();
  }

  _newKeyHistory() {
    const keyHistory = new KeyCombinationHistory({
      maxLength: this.componentList.getLongestSequence()
    });

    keyHistory.init();

    return keyHistory;
  }

  getKeyHistory() {
    if (this._keyHistory) {
      return this._keyHistory;
    } else {
      this._keyHistory = this._newKeyHistory();
    }

    return this._keyHistory;
  }

  /**
   * Resets the state of the values used to resolve which handler function should be
   * called when key events match a registered key map
   * @protected
   */
  _initHandlerResolutionState() {
    if (this.actionResolver && this.actionResolver.isKeyMapsEmpty()) {
      return;
    }

    this.actionResolver = new ActionResolver();
  }

  /**
   * Reset the state values that record the current and recent state of key events
   * @param {Object} options An options hash
   * @param {Boolean} options.force Whether to force a hard reset of the key
   *        combination history.
   */
  resetKeyHistory(options = {}) {
    this.keypressEventsToSimulate = [];

    this.keyupEventsToSimulate = [];

    const keyHistory = this.getKeyHistory();
    const prevHistoryNonEmpty = keyHistory.any();
    const keyCombinationRecord = this.getCurrentCombination();

    this._keyHistory = this._newKeyHistory();

    if (prevHistoryNonEmpty && !options.force) {
      keyHistory.push(
        new KeyCombinationRecord(keyCombinationRecord.keysStillPressedDict())
      );
    }
  }

  /********************************************************************************
   * Generating key maps
   ********************************************************************************/

  /**
   * Returns a mapping of all of the application's actions and the key sequences
   * needed to trigger them.
   *
   * @returns {ApplicationKeyMap} The application's key map
   */
  getApplicationKeyMap() {
    if (this.rootComponentId === null) {
      return {};
    }

    return this._buildApplicationKeyMap([this.rootComponentId], {});
  }

  _buildApplicationKeyMap(componentIds, keyMapSummary) {
    componentIds.forEach((componentId) => {
      const component = this.componentRegistry.get(componentId);
      const keyMap = this.keyMapRegistry.get(componentId);

      if (keyMap) {
        Object.keys(keyMap).forEach((actionName) => {
          const keyMapConfig = keyMap[actionName];

          keyMapSummary[actionName] = {};

          if (isObject(keyMapConfig)) {
            if (hasKey(keyMapConfig, 'sequences')) {
              /**
               * Support syntax:
               *  {
               *    sequences: [ {sequence: 'a+b', action: 'keyup' }],
               *    name: 'My keymap',
               *    description: 'Key to press for something special',
               *    group: 'Vanity'
               *  }
               */
              copyAttributes(
                keyMapConfig,
                keyMapSummary[actionName],
                KEYMAP_ATTRIBUTES
              );

              keyMapSummary[actionName].sequences =
                this._createSequenceFromConfig(keyMapConfig.sequences);
            } else {
              /**
               * Support syntax:
               * {
               *   sequence: 'a+b', action: 'keyup',
               *   name: 'My keymap',
               *   description: 'Key to press for something special',
               *   group: 'Vanity'
               * }
               */
              copyAttributes(keyMapConfig, keyMapSummary[actionName], KEYMAP_ATTRIBUTES);

              keyMapSummary[actionName].sequences = [
                copyAttributes(keyMapConfig, {}, SEQUENCE_ATTRIBUTES)
              ]
            }
          } else {
            keyMapSummary[actionName].sequences =
              this._createSequenceFromConfig(keyMapConfig)
          }
        });
      }

      this._buildApplicationKeyMap(component.childIds, keyMapSummary);
    });

    return keyMapSummary;
  }

  _createSequenceFromConfig(keyMapConfig) {
    return arrayFrom(keyMapConfig).map((sequenceOrKeyMapOptions) => {
      if (isObject(sequenceOrKeyMapOptions)) {
        /**
         * Support syntax:
         * [
         *   { sequence: 'a+b', action: 'keyup' },
         *   { sequence: 'c' }
         * ]
         */
        return copyAttributes(sequenceOrKeyMapOptions, {}, SEQUENCE_ATTRIBUTES);
      } else {
        /**
         * Support syntax:
         * 'a+b'
         */
        return { sequence: sequenceOrKeyMapOptions };
      }
    })
  }

  /********************************************************************************
   * Registering key maps
   ********************************************************************************/

  /**
   * Registers a new mounted component's key map so that it can be included in the
   * application's key map
   * @param {KeyMap} keyMap - Map of actions to key expressions
   * @returns {ComponentId} Unique component ID to assign to the focused HotKeys
   *          component and passed back when handling a key event
   */
  registerKeyMap(keyMap) {
    this.componentId += 1;

    this.keyMapRegistry.set(this.componentId, keyMap);

    this.logger.verbose(
      this._logPrefix(this.componentId),
      'Registered keyMap:\n',
      `${printComponent(keyMap)}`
    );

    this.componentRegistry.add(this.componentId);

    this.logger.verbose(
      this._logPrefix(this.componentId),
      'Registered component:\n',
      `${printComponent(this.componentRegistry.get(this.componentId))}`
    );

    return this.componentId;
  }

  /**
   * Re-registers (updates) a mounted component's key map
   * @param {ComponentId} componentId - Id of the component that the keyMap belongs to
   * @param {KeyMap} keyMap - Map of actions to key expressions
   */
  reregisterKeyMap(componentId, keyMap) {
    this.keyMapRegistry.set(componentId, keyMap);
  }

  /**
   * Registers that a component has now mounted, and declares its parent hot keys
   * component id so that actions may be properly resolved
   * @param {ComponentId} componentId - Id of the component that has mounted
   * @param {ComponentId} parentId - Id of the parent hot keys component
   */
  registerComponentMount(componentId, parentId) {
    if (!isUndefined(parentId)) {
      this.componentRegistry.setParent(componentId, parentId);
    } else {
      this.rootComponentId = componentId;
    }

    this.logger.verbose(
      this._logPrefix(componentId),
      'Registered component mount:\n',
      `${printComponent(this.componentRegistry.get(componentId))}`
    );
  }

  /**
   * De-registers (removes) a mounted component's key map from the registry
   * @param {ComponentId} componentId - Id of the component that the keyMap
   *        belongs to
   */
  deregisterKeyMap(componentId) {
    this.componentRegistry.remove(componentId);

    this.logger.verbose(
      this._logPrefix(componentId),
      'De-registered component. Remaining component Registry:\n',
      `${printComponent(this.componentRegistry.toJSON())}`
    );

    this.keyMapRegistry.remove(componentId);

    this.logger.verbose(
      this._logPrefix(componentId),
      'De-registered key map. Remaining key map Registry:\n',
      `${printComponent(this.keyMapRegistry.toJSON())}`
    );

    if (componentId === this.rootComponentId) {
      this.rootComponentId = null;
    }
  }

  /********************************************************************************
   * Registering key maps and handlers
   ********************************************************************************/

  /**
   * Registers the hotkeys defined by a HotKeys component
   * @param {ComponentId} componentId - Index of the component
   * @param {KeyMap} actionNameToKeyMap - Definition of actions and key maps defined
   *        in the HotKeys component
   * @param {HandlersMap} actionNameToHandlersMap - Map of ActionNames to handlers
   *        defined in the HotKeys component
   * @param {Object} options - Hash of options that configure how the key map is built.
   * @protected
   */
  _addComponent(componentId, actionNameToKeyMap = {}, actionNameToHandlersMap = {}, options) {
    this.componentList.add(componentId,
      actionNameToKeyMap,
      actionNameToHandlersMap,
      options
    );

    this.getKeyHistory().setMaxLength(this.componentList.getLongestSequence());
  }

  /********************************************************************************
   * Recording key events
   ********************************************************************************/

  /**
   * Whether there are any keys in the current combination still being pressed
   * @return {Boolean} True if all keys in the current combination are released
   * @protected
   */
  _allKeysAreReleased() {
    return this.getCurrentCombination().hasEnded();
  }

  getCurrentCombination() {
    return this.getKeyHistory().getCurrentCombination();
  }

  _shouldSimulate(eventType, keyName) {
    const keyHasNativeKeypress = hasKeyPressEvent(keyName);

    if (eventType === KeyEventRecordIndex.keypress) {
      return !keyHasNativeKeypress || (keyHasNativeKeypress && this._keyIsCurrentlyDown('Meta'));
    } else if (eventType === KeyEventRecordIndex.keyup) {
      return (keyupIsHiddenByCmd(keyName) && keyIsCurrentlyTriggeringEvent(
        this._getCurrentKeyState('Meta'),
        KeyEventRecordIndex.keyup)
      );
    }

    return false
  }

  _cloneAndMergeEvent(event, extra) {
    const eventAttributes = Object.keys(ModifierFlagsDictionary).reduce((memo, eventAttribute) => {
      memo[eventAttribute] = event[eventAttribute];

      return memo;
    }, {});

    return { ...eventAttributes, ...extra };
  }

  _alreadySimulatedEvent(recordIndex, keyName) {
    const keyState = this._getCurrentKeyState(keyName);

    return keyIsCurrentlyTriggeringEvent(keyState, recordIndex) === KeyEventRecordState.simulated;
  }

  /********************************************************************************
   * Matching and calling handlers
   ********************************************************************************/

  _callMatchingHandlerClosestToEventTarget(event, keyName, eventRecordIndex, componentPosition, componentSearchIndex) {
    while (componentSearchIndex <= componentPosition) {
      this.actionResolver.matchHandlersToActions(this.componentList, { upTo: componentSearchIndex, event });

      const keyMapMatcher = this.actionResolver.getKeyMapMatcher(componentSearchIndex);

      this.logger.verbose(
        this._logPrefix(componentSearchIndex),
        'Internal key mapping:\n',
        `${printComponent(keyMapMatcher)}`
      );

      if (keyMapMatcher && keyMapMatcher.hasMatchesForEventType(eventRecordIndex)) {
        const normalizedKeyName = this.getCurrentCombination().getNormalizedKeyName(keyName);

        let sequenceLengthCounter = keyMapMatcher.getLongestSequence();

        while (sequenceLengthCounter >= 0) {
          const combinationSchema = keyMapMatcher.findMatch(
            this.getKeyHistory(),
            normalizedKeyName,
            eventRecordIndex
          );

          if (combinationSchema) {
            const eventSchema = combinationSchema.events[eventRecordIndex];

            if (Configuration.option('allowCombinationSubmatches')) {
              const subMatchDescription = KeyCombinationSerializer.serialize(combinationSchema.keyDictionary);

              this.logger.debug(
                this._logPrefix(componentSearchIndex),
                `Found action that matches '${this.getCurrentCombination().describe()}' (sub-match: '${subMatchDescription}'): ${eventSchema.actionName}. Calling handler . . .`
              );
            } else {
              this.logger.debug(
                this._logPrefix(componentSearchIndex),
                `Found action that matches '${this.getCurrentCombination().describe()}': ${eventSchema.actionName}. Calling handler . . .`
              );
            }

            eventSchema.handler(event);

            this._stopEventPropagationAfterHandlingIfEnabled(event, componentSearchIndex);

            return true;
          }

          sequenceLengthCounter--;
        }

        const eventName = describeKeyEventType(eventRecordIndex);

        this.logger.debug(
          this._logPrefix(componentSearchIndex),
          `No matching actions found for '${this.getCurrentCombination().describe()}' ${eventName}.`
        );
      } else {
        /**
         * Component doesn't define any matchers for the current key event
         */

        this.logger.debug(
          this._logPrefix(componentSearchIndex),
          `Doesn't define a handler for '${this.getCurrentCombination().describe()}' ${describeKeyEventType(eventRecordIndex)}.`
        );
      }

      componentSearchIndex++;
    }
  }

  _stopEventPropagationAfterHandlingIfEnabled(event, componentId) {
    if (Configuration.option('stopEventPropagationAfterHandling')) {
      this._stopEventPropagation(event, componentId);

      return true;
    }

    return false;
  }

  _stopEventPropagation(event, componentId) {
    throw new Error('_stopEventPropagation must be overridden by a subclass');
  }

  /**
   * Synchronises the key combination history to match the modifier key flag attributes
   * on new key events
   * @param {KeyboardEvent} event - Event to check the modifier flags for
   * @param {String} key - Name of key that events relates to
   * @param {KeyEventRecordIndex} keyEventRecordIndex - The record index of the current
   *        key event type
   * @protected
   */
  _checkForModifierFlagDiscrepancies(event, key, keyEventRecordIndex) {
    /**
     * If a new key event is received with modifier key flags that contradict the
     * key combination history we are maintaining, we can surmise that some keyup events
     * for those modifier keys have been lost (possibly because the window lost focus).
     * We update the key combination to match the modifier flags
     */
    Object.keys(ModifierFlagsDictionary).forEach((modifierKey) => {
      /**
       * When a modifier key is being released (keyup), it sets its own modifier flag
       * to false. (e.g. On the keyup event for Command, the metaKey attribute is false).
       * If this the case, we want to handle it using the main algorithm and skip the
       * reconciliation algorithm.
       */
      if (key === modifierKey && keyEventRecordIndex === KeyEventRecordIndex.keyup) {
        return;
      }

      const modifierStillPressed = this._keyIsCurrentlyDown(modifierKey);

       ModifierFlagsDictionary[modifierKey].forEach((attributeName) => {
         if (event[attributeName] === false && modifierStillPressed) {
           this.getCurrentCombination().setKeyState(
             modifierKey,
             KeyEventRecordIndex.keyup,
             stateFromEvent(event)
           );
         }
       });
     })
  }

  _keyIsCurrentlyDown(keyName) {
    const keyState = this._getCurrentKeyState(keyName);

    const keyIsDown = keyIsCurrentlyTriggeringEvent(keyState, KeyEventRecordIndex.keypress) &&
        !keyIsCurrentlyTriggeringEvent(keyState, KeyEventRecordIndex.keyup);

    return !!keyIsDown;
  }

  _getCurrentKeyState(keyName) {
    return this.getCurrentCombination().getKeyState(keyName);
  }

  /**
   * Returns a prefix for all log entries related to the current event strategy
   * @protected
   * @abstract
   */
  _logPrefix() {

  }
}

export default AbstractKeyEventStrategy;
