import KeyEventRecordManager from '../KeyEventRecordManager';
import KeyEventRecordIndex from '../../const/KeyEventRecordIndex';
import Logger from '../Logger';
import KeyCombinationSerializer from '../KeyCombinationSerializer';
import arrayFrom from '../../utils/array/arrayFrom';
import indexFromEnd from '../../utils/array/indexFromEnd';
import isObject from '../../utils/object/isObject';
import isUndefined from '../../utils/isUndefined';
import isEmpty from '../../utils/collection/isEmpty';
import describeKeyEventType from '../../helpers/logging/describeKeyEventType';
import KeyEventSequenceIndex from '../../const/KeyEventSequenceIndex';
import KeySequenceParser from '../KeySequenceParser';
import printComponent from '../../helpers/logging/printComponent';
import resolveUnaltShiftedAlias from '../../helpers/resolving-handlers/resolveUnaltShiftedAlias';
import resolveUnshiftedAlias from '../../helpers/resolving-handlers/resolveUnshiftedAlias';
import resolveUnaltedAlias from '../../helpers/resolving-handlers/resolveUnaltedAlias';
import resolveKeyAlias from '../../helpers/resolving-handlers/resolveKeyAlias';
import resolveAltShiftedAlias from '../../helpers/resolving-handlers/resolveAltShiftedAlias';
import resolveShiftedAlias from '../../helpers/resolving-handlers/resolveShiftedAlias';
import resolveAltedAlias from '../../helpers/resolving-handlers/resolveAltedAlias';
import Configuration from '../Configuration';
import ModifierFlagsDictionary from '../../const/ModifierFlagsDictionary';
import without from '../../utils/collection/without';
import hasKeyPressEvent from '../../helpers/resolving-handlers/hasKeyPressEvent';
import keyIsCurrentlyTriggeringEvent from '../../helpers/parsing-key-maps/keyIsCurrentlyTriggeringEvent';
import isMatchPossibleBasedOnNumberOfKeys from '../../helpers/resolving-handlers/isMatchPossibleBasedOnNumberOfKeys';
import copyAttributes from '../../utils/object/copyAttributes';
import hasKey from '../../utils/object/hasKey';
import keyupIsHiddenByCmd from '../../helpers/resolving-handlers/keyupIsHiddenByCmd';
import KeyEventRecordState from '../../const/KeyEventRecordState';

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
   * Returns a new, empty key combination
   * @returns {KeyCombinationRecord} A new, empty key combination
   */
  static emptyKeyCombination() {
    return {
      keys: {},
      ids: [ '' ],
      keyAliases: {}
    };
  }

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

    this.keyMapRegistry = {};

    this.componentRegistry = {};

    this.rootComponentId = null;

    this._reset();
    this.resetKeyCombinationHistory();
  }

  /**
   * Resets all strategy state to the values it had when it was first created
   * @protected
   */
  _reset() {
    this._initRegisteredKeyMapsState();
    this._initHandlerResolutionState();
  }

  /**
   * Resets all state used to record information about the keymaps that HotKey
   * components have registered.
   *
   * After initialization, this state is generally maintained manually by
   * the _buildKeyMatcherMap() method and this method should not be called.
   */
  _initRegisteredKeyMapsState() {
    /**
     * Object containing a component's defined key maps and handlers
     * @typedef {Object} ComponentOptions
     * @property {ActionDictionary} actions - Dictionary of actions the component
     *          has defined in its keymap
     * @property {HandlersMap} handlers - Dictionary of handler functions the
     *          component has defined
     * @property {ComponentId} componentId - Index of the component the options
     *          correspond with
     */

    /**
     * List of actions and handlers registered by each component currently in focus.
     * The component closest to the element in focus is last in the list.
     * @type {ComponentOptions[]}
     */
    this.componentList = [];

    /**
     * Counter for the longest sequence registered by the HotKeys components currently
     * in focus. Allows setting an upper bound on the length of the key event history
     * that must be kept.
     * @type {Number}
     */
    this.longestSequence = 1;

    /**
     * The component index of the component that defines the longest key sequence, so
     * we can quickly determine if the longest sequence needs to be re-calculated when
     * that component is updated or removed.
     * @type {ComponentId}
     */
    this.longestSequenceComponentIndex = null;

    /**
     * Record to record whether there is at least one keymap bound to each event type
     * (keydown, keypress or keyup) so that we can skip trying to find a matching keymap
     * on events where we know there is none to find
     * @type {KeyEventRecord}
     */
    this.keyMapEventRecord = KeyEventRecordManager.newRecord();

    /**
     * Set of ComponentOptions indexed by ComponentId to allow efficient retrieval
     * when components need to be updated or unmounted by their ComponentId
     * @type {Object<ComponentId, ComponentOptions>}
     */
    this.componentIdDict = {};
  }

  /**
   * Resets the state of the values used to resolve which handler function should be
   * called when key events match a registered key map
   * @protected
   */
  _initHandlerResolutionState() {
    if (this.keyMaps === null) {
      /**
       * If this.keyMaps is already set to null, then the state has already been reset
       * and we need not do it again
       */
      return;
    }

    /**
     * List of mappings from key sequences to handlers that is constructed on-the-fly
     * as key events propagate up the render tree
     */
    this.keyMaps = null;

    /**
     * Index marking the number of places from the end of componentList for which the
     * keyMaps have been matched with event handlers. Used to build this.keyMaps as
     * key events propagate up the React tree.
     * @type {Number}
     */
    this.handlerResolutionSearchIndex =  0;

    /**
     * Array of counters - one for each component - to keep track of how many handlers
     * for that component still need actions assigned to them
     * @type {Number[]}
     */
    this.unmatchedHandlerStatus = null;

    /**
     * A dictionary of handlers to the components that register them. This is populated
     * as this.handlerResolutionSearchIndex increases, moving from the end of this.componentList to the
     * front, populating this.keyMaps as needed
     * @type {Object<ActionName, ComponentId>}
     */
    this.handlersDictionary = {};

    /**
     * A dictionary of sequences already encountered in the process of building the
     * list of keyMaps on the fly, as key events propagate up the component tree
     */
    this.keySequencesDictionary = {};
  }

  /**
   * Reset the state values that record the current and recent state of key events
   * @param {Object} options An options hash
   * @param {Boolean} options.force Whether to force a hard reset of the key
   *        combination history.
   */
  resetKeyCombinationHistory(options = {}) {
    /**
     * Whether the current key combination includes at least one keyup event - indicating
     * that the current combination is ending (and keys are being released)
     */
    this.keyCombinationIncludesKeyUp = false;

    this.keypressEventsToSimulate = [];

    this.keyupEventsToSimulate = [];

    if (!this.keyCombinationHistory || this.keyCombinationHistory.length < 1 || options.force) {
      this.keyCombinationHistory = [];
    } else {
      const currentKeyCombination = this._getCurrentKeyCombination();

      const keysStillPressed = Object.keys(currentKeyCombination.keys).reduce((memo, keyName) => {
        const keyState = currentKeyCombination.keys[keyName];
        const currentKeyState = keyState[KeyEventSequenceIndex.current];

        if (currentKeyState[KeyEventRecordIndex.keydown] && !currentKeyState[KeyEventRecordIndex.keyup]) {
          memo[keyName] = keyState;
        }

        return memo;
      }, {});

      this.keyCombinationHistory = [
        {
          keys: keysStillPressed,
          ids: KeyCombinationSerializer.serialize(keysStillPressed),
          keyAliases: this._buildCombinationKeyAliases(keysStillPressed)
        }
      ]
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
      const component = this.componentRegistry[componentId];
      const keyMap = this.keyMapRegistry[componentId];

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

    this.keyMapRegistry[this.componentId] = keyMap;

    this.logger.verbose(
      this._logPrefix(this.componentId),
      'Registered keyMap:\n',
      `${printComponent(keyMap)}`
    );

    this.componentRegistry[this.componentId] = newComponentRegistryItem();

    this.logger.verbose(
      this._logPrefix(this.componentId),
      'Registered component:\n',
      `${printComponent(this.componentRegistry[this.componentId])}`
    );

    return this.componentId;
  }

  /**
   * Re-registers (updates) a mounted component's key map
   * @param {ComponentId} componentId - Id of the component that the keyMap belongs to
   * @param {KeyMap} keyMap - Map of actions to key expressions
   */
  reregisterKeyMap(componentId, keyMap) {
    this.keyMapRegistry[componentId] = keyMap;
  }

  /**
   * Registers that a component has now mounted, and declares its parent hot keys
   * component id so that actions may be properly resolved
   * @param {ComponentId} componentId - Id of the component that has mounted
   * @param {ComponentId} parentId - Id of the parent hot keys component
   */
  registerComponentMount(componentId, parentId) {
    if (!isUndefined(parentId)) {
      this.componentRegistry[componentId].parentId = parentId;
      this.componentRegistry[parentId].childIds.push(componentId);
    } else {
      this.rootComponentId = componentId;
    }

    this.logger.verbose(
      this._logPrefix(componentId),
      'Registered component mount:\n',
      `${printComponent(this.componentRegistry[componentId])}`
    );
  }

  /**
   * De-registers (removes) a mounted component's key map from the registry
   * @param {ComponentId} componentId - Id of the component that the keyMap
   *        belongs to
   */
  deregisterKeyMap(componentId) {
    const parentId = this.componentRegistry[componentId].parentId;
    const parent = this.componentRegistry[parentId];

    if (parent) {
      parent.childIds = without(parent.childIds, componentId);
    }

    delete this.componentRegistry[componentId];

    this.logger.verbose(
      this._logPrefix(componentId),
      'De-registered component. Remaining component Registry:\n',
      `${printComponent(this.componentRegistry)}`
    );

    delete this.keyMapRegistry[componentId];

    this.logger.verbose(
      this._logPrefix(componentId),
      'De-registered key map. Remaining key map Registry:\n',
      `${printComponent(this.keyMapRegistry)}`
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
  _addComponentToList(componentId, actionNameToKeyMap = {}, actionNameToHandlersMap = {}, options) {
    const componentOptions = this._buildComponentOptions(
      componentId,
      actionNameToKeyMap,
      actionNameToHandlersMap,
      options
    );

    this.componentList.push(componentOptions);

    this._setComponentPosition(componentId, this.componentList.length - 1);
  }

  /**
   * Builds the internal representation that described the options passed to a HotKeys
   * component
   * @param {ComponentId} componentId - Index of the component
   * @param {KeyMap} actionNameToKeyMap - Definition of actions and key maps defined
   *        in the HotKeys component
   * @param {HandlersMap} actionNameToHandlersMap - Map of ActionNames to handlers
   *        defined in the HotKeys component
   * @param {Object} options - Hash of options that configure how the key map is built.
   * @param {String} options.defaultKeyEvent - The default key event to use for any
   *        action that does not explicitly define one.
   * @returns {ComponentOptions} Options for the specified component
   * @protected
   */
  _buildComponentOptions(componentId, actionNameToKeyMap, actionNameToHandlersMap, options) {
    const { keyMap: hardSequenceKeyMap, handlers: includingHardSequenceHandlers } =
      this._applyHardSequences(actionNameToKeyMap, actionNameToHandlersMap);

    return {
      actions: this._buildActionDictionary(
        {
          ...actionNameToKeyMap,
          ...hardSequenceKeyMap
        },
        options,
        componentId
      ),
      handlers: includingHardSequenceHandlers,
      componentId,
      options
    };
  }

  /**
   * Applies hard sequences (handlers attached to actions with names that are valid
   * KeySequenceStrings) that implicitly define a corresponding action name.
   * @param {KeyMap} actionNameToKeyMap - KeyMap specified by HotKeys component
   * @param {HandlersMap} actionNameToHandlersMap - HandlersMap specified by HotKeys
   *        component
   * @returns {{keyMap: {}, handlers: {}}} Object containing keymap and handlers map
   *        with the hard sequence actions applied
   * @private
   */
  _applyHardSequences(actionNameToKeyMap, actionNameToHandlersMap) {
    if (Configuration.option('enableHardSequences')) {
      return Object.keys(actionNameToHandlersMap).reduce((memo, actionNameOrKeyExpression) => {
        const actionNameIsInKeyMap = !!actionNameToKeyMap[actionNameOrKeyExpression];

        if (!actionNameIsInKeyMap && KeyCombinationSerializer.isValidKeySerialization(actionNameOrKeyExpression)) {
          memo.keyMap[actionNameOrKeyExpression] = actionNameOrKeyExpression;
        }

        memo.handlers[actionNameOrKeyExpression] =
          actionNameToHandlersMap[actionNameOrKeyExpression];

        return memo;
      }, {keyMap: {}, handlers: {}});
    } else {
      return { keyMap: actionNameToKeyMap, handlers: actionNameToHandlersMap };
    }
  }

  /**
   * Object containing all the information required to match a key event to an action
   * @typedef {Object} ActionConfiguration
   * @property {KeyCombinationString} id - String description of keys involved in the
   *          final key combination in the sequence
   * @property {ActionName} actionName - Name of the action associated with the key map
   * @property {NormalizedKeySequenceId} prefix - String describing sequence of key
   *          combinations involved key map, before the final key combination
   * @property {Number} sequenceLength - Number of combinations involved in the
   *           sequence
   * @property {Number} size - Number of keys involved in the combination
   * @property {Object.<KeyName, Boolean>} keyDictionary - Dictionary of key names involved
   *           in the key combination
   * @property {KeyEventRecordIndex} eventRecordIndex - Record index for key event that
   *          the matcher should match on
   */

  /**
   * A mapping between ActionNames and FullKeyEventOptions
   * @typedef {Object<ActionName,ActionConfiguration>} ActionDictionary
   */

  /**
   * Returns a mapping between ActionNames and FullKeyEventOptions
   * @param {KeyMap} actionNameToKeyMap - Mapping of ActionNames to key sequences.
   * @param {Object} options - Hash of options that configure how the key map is built.
   * @param {String} options.defaultKeyEvent - The default key event to use for any
   *        action that does not explicitly define one.
   * @param {ComponentId} componentId Index of the component the matcher belongs to
   * @return {ActionDictionary} Map from ActionNames to FullKeyEventOptions
   * @private
   */
  _buildActionDictionary(actionNameToKeyMap, options, componentId) {
    return Object.keys(actionNameToKeyMap).reduce((keyMapMemo, actionName) => {
      const keyMapConfig = actionNameToKeyMap[actionName];

      const keyMapOptions = function(){
        if (isObject(keyMapConfig) && hasKey(keyMapConfig, 'sequences')) {
          return arrayFrom(keyMapConfig.sequences)
        } else {
          return arrayFrom(keyMapConfig);
        }
      }();

      keyMapOptions.forEach((keyMapOption) => {
        const { keySequence, eventRecordIndex } = function(){
          if (isObject(keyMapOption)) {
            const { sequence, action } = keyMapOption;

            return {
              keySequence: sequence,
              eventRecordIndex: isUndefined(action) ? KeyEventRecordIndex[options.defaultKeyEvent] : KeyEventRecordIndex[action]
            };
          } else {
            return {
              keySequence: keyMapOption,
              eventRecordIndex: KeyEventRecordIndex[options.defaultKeyEvent]
            }
          }
        }();

        const { sequence, combination } = KeySequenceParser.parse(keySequence, { eventRecordIndex });

        if (sequence.size > this.longestSequence) {
          this.longestSequence = sequence.size;
          this.longestSequenceComponentIndex = componentId;
        }

        /**
         * Record that there is at least one key sequence in the focus tree bound to
         * the keyboard event
         */
        this.keyMapEventRecord[eventRecordIndex] = true;

        if (!keyMapMemo[actionName]) {
          keyMapMemo[actionName] = [];
        }

        keyMapMemo[actionName].push({
          prefix: sequence.prefix,
          actionName,
          sequenceLength: sequence.size,
          ...combination,
        });
      });

      return keyMapMemo;
    }, {});
  }

  /********************************************************************************
   * Recording key events
   ********************************************************************************/

  /**
   * Record of the combination of keys that are currently being pressed
   * @typedef {Object} KeyCombinationRecord
   * @property {Object<ReactKeyName, KeyEventRecord[]>} keys - A dictionary
   * of keys that have been pressed down at once. The keys of the map are the lowercase
   * names of the keyboard keys. May contain 1 or more keyboard keys.
   * @property {KeySequenceString} ids - Serialization of keys currently pressed in
   *        combination
   * @property {Object<ReactKeyName, ReactKeyName>} keyAliases - Dictionary of key
   *      aliases, when modifier keys like alt or shift are pressed.
   */

  /**
   * Returns the current key combination, i.e. the key combination that represents
   * the current key events.
   * @returns {KeyCombinationRecord} The current key combination
   * @protected
   */
  _getCurrentKeyCombination() {
    if (this.keyCombinationHistory.length > 0) {
      return this.keyCombinationHistory[this.keyCombinationHistory.length - 1];
    } else {
      return this.constructor.emptyKeyCombination();
    }
  }

  /**
   * Adds a key event to the current key combination (as opposed to starting a new
   * keyboard combination).
   * @param {ReactKeyName} keyName - Name of the key to add to the current combination
   * @param {KeyEventRecordIndex} recordIndex - Index in record to set to true
   * @param {KeyEventRecordState} keyEventState The state to set the key event to
   * @protected
   */
  _addToCurrentKeyCombination(keyName, recordIndex, keyEventState) {
    if (this.keyCombinationHistory.length === 0) {
      this.keyCombinationHistory.push(this.constructor.emptyKeyCombination());
    }

    const keyCombination = this._getCurrentKeyCombination();
    const keyAlias = getKeyAlias(keyCombination, keyName);

    const existingRecord = getKeyState(keyCombination, keyName);

    if (!existingRecord) {
      keyCombination.keys[keyAlias] = [
        KeyEventRecordManager.newRecord(),
        KeyEventRecordManager.newRecord(recordIndex, keyEventState)
      ];

    } else {
      const previous = KeyEventRecordManager.clone(existingRecord[1]);
      const current = KeyEventRecordManager.clone(previous);

      KeyEventRecordManager.setBit(current, recordIndex, keyEventState);

      keyCombination.keys[keyAlias] = [previous, current];
    }

    keyCombination.ids = KeyCombinationSerializer.serialize(keyCombination.keys);
    keyCombination.keyAliases = this._buildCombinationKeyAliases(keyCombination.keys);

    if (recordIndex === KeyEventRecordIndex.keyup) {
      this.keyCombinationIncludesKeyUp = true;
    }
  }

  /**
   * Adds a new KeyCombinationRecord to the event history and resets the
   * keyCombinationIncludesKeyUp flag to false.
   * @param {ReactKeyName} keyName - Name of the keyboard key to add to the new
   *        KeyCombinationRecord
   * @param {KeyEventRecordIndex} eventRecordIndex - Index of bit to set to true in new
   *        KeyEventRecord
   * @param {KeyEventRecordState} keyEventState The state to set the key event to
   * @protected
   */
  _startNewKeyCombination(keyName, eventRecordIndex, keyEventState) {
    if (this.keyCombinationHistory.length > this.longestSequence) {
      /**
       * We know the longest key sequence registered for the currently focused
       * components, so we don't need to keep a record of history longer than
       * that
       */
      this.keyCombinationHistory.shift();
    }

    const lastKeyCombination = this._getCurrentKeyCombination();

    const keys = {
      ...this._withoutKeyUps(lastKeyCombination),
      [keyName]: [
        KeyEventRecordManager.newRecord(),
        KeyEventRecordManager.newRecord(eventRecordIndex, keyEventState)
      ]
    };

    this.keyCombinationHistory.push({
      keys,
      ids: KeyCombinationSerializer.serialize(keys),
      keyAliases: this._buildCombinationKeyAliases(keys)
    });

    this.keyCombinationIncludesKeyUp = false;
  }

  /**
   * Whether there are any keys in the current combination still being pressed
   * @return {Boolean} True if all keys in the current combination are released
   * @protected
   */
  _allKeysAreReleased() {
    const currentCombination = this._getCurrentKeyCombination();

    return Object.keys(currentCombination.keys).every((keyName) => {
      return !this._keyIsCurrentlyDown(keyName);
    });
  }

  /**
   * Returns a new KeyCombinationRecord without the keys that have been
   * released (had the keyup event recorded). Essentially, the keys that are
   * currently still pressed down at the time a key event is being handled.
   * @param {KeyCombinationRecord} keyCombinationRecord Record of keys currently
   *        pressed down that should have the release keyed omitted from
   * @returns {KeyCombinationRecord} New KeyCombinationRecord with all of the
   *        keys with keyup events omitted
   * @private
   */
  _withoutKeyUps(keyCombinationRecord) {
    return Object.keys(keyCombinationRecord.keys).reduce((memo, keyName) => {
      const keyState = keyCombinationRecord.keys[keyName];

      if (!keyState[KeyEventSequenceIndex.current][KeyEventRecordIndex.keyup]) {
        memo[keyName] = keyState;
      }

      return memo;
    }, {});
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
    if (!this.keyMaps || !this.unmatchedHandlerStatus) {
      this.keyMaps = [];

      this.unmatchedHandlerStatus = [];

      this.componentList.forEach(({ handlers }) => {
        this.unmatchedHandlerStatus.push( [ Object.keys(handlers).length, {} ]);
        this.keyMaps.push({});
      });
    }

    while (componentSearchIndex <= componentPosition) {
      const unmatchedHandlersStatus = this.unmatchedHandlerStatus[componentSearchIndex];
      let unmatchedHandlersCount = unmatchedHandlersStatus[0];

      if (unmatchedHandlersCount > 0) {
        /**
         * Component currently handling key event has handlers that have not yet been
         * associated with a key sequence. We need to continue walking up the component
         * tree in search of the matching actions that describe the applicable key
         * sequence.
         */

        while (this.handlerResolutionSearchIndex < this.componentList.length && unmatchedHandlersCount > 0) {
          const { handlers, actions } = this.componentList[this.handlerResolutionSearchIndex];

          /**
           * Add current component's handlers to the handlersDictionary so we know
           * which component has defined them
           */
          Object.keys(handlers).forEach((actionName) => {
            if (!this.handlersDictionary[actionName]) {
              this.handlersDictionary[actionName] = [];
            }

            this.handlersDictionary[actionName].push(this.handlerResolutionSearchIndex);
          });

          /**
           * Iterate over the actions of a component (starting with the current component
           * and working through its ancestors), matching them to the current component's
           * handlers
           */
          Object.keys(actions).forEach((actionName) => {
            const handlerComponentIndexArray = this.handlersDictionary[actionName];

            if (handlerComponentIndexArray) {
              /**
               * Get action handler closest to the event target
               */
              const handlerComponentIndex = handlerComponentIndexArray[0];

              const handler =
                this.componentList[handlerComponentIndex].handlers[actionName];

              /**
               * Get key map that corresponds with the component that defines the handler
               * closest to the event target
               */
              const keyMap = this.keyMaps[handlerComponentIndex];

              /**
               * Store the key sequence with the handler that it should call at
               * a given component level
               */
              if (!keyMap.sequences) {
                keyMap.sequences = {};
              }

              /**
               * At least one child HotKeys component (or the component itself) has
               * defined a handler for the action, so now we need to associate them
               */
              const keyMatchers = actions[actionName];

              keyMatchers.forEach((keyMatcher) => {
                const keySequence = [keyMatcher.prefix, keyMatcher.id].join(' ');

                const closestSequenceHandlerAlreadyFound =
                  this.keySequencesDictionary[keySequence] &&
                  this.keySequencesDictionary[keySequence].some((dictEntry) => {
                    return dictEntry[1] === keyMatcher.eventRecordIndex
                  });

                if (closestSequenceHandlerAlreadyFound) {
                  /**
                   * Return if there is already a component with handlers for the current
                   * key sequence closer to the event target
                   */
                  return;
                }

                if (!keyMap.sequences[keyMatcher.prefix]) {
                  keyMap.sequences[keyMatcher.prefix] = { combinations: {} };
                }

                const {
                  prefix, sequenceLength, id, keyDictionary, size,
                  eventRecordIndex: matcherEventRecordIndex,
                  actionName
                } = keyMatcher;

                const combination =
                  keyMap.sequences[keyMatcher.prefix].combinations[keyMatcher.id];

                if (!combination) {
                  keyMap.sequences[keyMatcher.prefix].combinations[keyMatcher.id] = {
                    prefix, sequenceLength, id, keyDictionary, size,
                    events: {
                      [matcherEventRecordIndex]: {
                        actionName, eventRecordIndex: matcherEventRecordIndex, handler
                      }
                    }
                  };
                } else {
                  keyMap.sequences[keyMatcher.prefix].combinations[keyMatcher.id] = {
                    ...combination,
                    events: {
                      ...combination.events,
                      [matcherEventRecordIndex]: {
                        actionName, eventRecordIndex: matcherEventRecordIndex, handler
                      }
                    }
                  }
                }

                /**
                 * Merge event records so we can quickly determine if a given component
                 * has any handlers bound to particular key events
                 */
                if (!keyMap.eventRecord) {
                  keyMap.eventRecord = KeyEventRecordManager.newRecord();
                }

                KeyEventRecordManager.setBit(
                  keyMap.eventRecord,
                  keyMatcher.eventRecordIndex,
                  this._stateFromEvent(event)
                );

                /**
                 * Record the longest sequence length so we know to only check for sequences
                 * of that length or shorter for a particular component
                 */
                if (!keyMap.longestSequence || keyMap.longestSequence < keyMatcher.sequenceLength) {
                  keyMap.longestSequence = keyMatcher.sequenceLength;
                }

                /**
                 * Record that we have already found a handler for the current action so
                 * that we do not override handlers for an action closest to the event target
                 * with handlers further up the tree
                 */
                if (!this.keySequencesDictionary[keySequence]) {
                  this.keySequencesDictionary[keySequence] = [];
                }

                this.keySequencesDictionary[keySequence].push([
                  handlerComponentIndex,
                  keyMatcher.eventRecordIndex
                ]);
              });

              handlerComponentIndexArray.forEach((handlerComponentIndex) => {
                const handlerComponentStatus = this.unmatchedHandlerStatus[handlerComponentIndex];

                if (!handlerComponentStatus[1][actionName]) {
                  handlerComponentStatus[1][actionName] = true;

                  /**
                   * Decrement the number of remaining unmatched handlers for the
                   * component currently handling the propagating key event, so we know
                   * when all handlers have been matched to sequences and we can move on
                   * to matching them against the current key event
                   */
                  handlerComponentStatus[0]--;
                }
              });
            }
          });

          /**
           * Search next component up in the hierarchy for actions that match outstanding
           * handlers
           */
          this.handlerResolutionSearchIndex++;
        }
      }

      const keyMap = this.keyMaps[componentSearchIndex];

      this.logger.verbose(
        this._logPrefix(componentSearchIndex),
        'Internal key mapping:\n',
        `${printComponent(keyMap)}`
      );

      if (!keyMap || isEmpty(keyMap.sequences) || !keyMap.eventRecord[eventRecordIndex]) {
        /**
         * Component doesn't define any matchers for the current key event
         */

        this.logger.debug(
          this._logPrefix(componentSearchIndex),
          `Doesn't define a handler for '${this._describeCurrentKeyCombination()}' ${describeKeyEventType(eventRecordIndex)}.`
        );
      } else {
        const { sequences, longestSequence } = keyMap;

        const currentKeyState = this._getCurrentKeyCombination();
        const normalizedKeyName = getKeyAlias(currentKeyState, keyName);

        let sequenceLengthCounter = longestSequence;

        while(sequenceLengthCounter >= 0) {
          const sequenceHistory = this.keyCombinationHistory.slice(-sequenceLengthCounter, -1);
          const sequenceHistoryIds = sequenceHistory.map(({ ids }) => ids );

          const matchingSequence = this._tryMatchSequenceWithKeyAliases(sequences, sequenceHistoryIds);

          if (matchingSequence) {
            if (!matchingSequence.order) {
              /**
               * The first time the component that is currently handling the key event has
               * its handlers searched for a match, order the combinations based on their
               * size so that they may be applied in the correct priority order
               */

              const combinationsPartitionedBySize = Object.values(matchingSequence.combinations).reduce((memo, { id, size }) => {
                if (!memo[size]) {
                  memo[size] = [];
                }

                memo[size].push(id);

                return memo;
              }, {});

              matchingSequence.order = Object.keys(combinationsPartitionedBySize).sort((a, b) => b-a ).reduce((memo, key) => {
                return memo.concat(combinationsPartitionedBySize[key]);
              }, []);
            }

            const combinationOrder = matchingSequence.order;

            let combinationIndex = 0;

            while(combinationIndex < combinationOrder.length) {
              const combinationId = combinationOrder[combinationIndex];
              const combinationMatcher = matchingSequence.combinations[combinationId];

              const cmdKeyIsPressed =
                this._getCurrentKeyState('Meta') && !keyIsCurrentlyTriggeringEvent(this._getCurrentKeyState('Meta'), KeyEventRecordIndex.keyup);

              const keyupIsHidden = cmdKeyIsPressed && Object.keys(combinationMatcher.keyDictionary).some((keyName) => {
                return keyupIsHiddenByCmd(keyName);
              });

              if (isMatchPossibleBasedOnNumberOfKeys(currentKeyState, combinationMatcher, keyupIsHidden)) {
                if (this._combinationMatchesKeys(normalizedKeyName, currentKeyState, combinationMatcher, eventRecordIndex)) {

                  if (Configuration.option('allowCombinationSubmatches')) {
                    const subMatchDescription = KeyCombinationSerializer.serialize(combinationMatcher.keyDictionary);

                    this.logger.debug(
                      this._logPrefix(componentSearchIndex),
                      `Found action that matches '${this._describeCurrentKeyCombination()}' (sub-match: '${subMatchDescription}'): ${combinationMatcher.events[eventRecordIndex].actionName}. Calling handler . . .`
                    );
                  } else {
                    this.logger.debug(
                      this._logPrefix(componentSearchIndex),
                      `Found action that matches '${this._describeCurrentKeyCombination()}': ${combinationMatcher.events[eventRecordIndex].actionName}. Calling handler . . .`
                    );
                  }

                  combinationMatcher.events[eventRecordIndex].handler(event);

                  this._stopEventPropagationAfterHandlingIfEnabled(event, componentSearchIndex);

                  return true;
                }
              }

              combinationIndex++;
            }
          }

          sequenceLengthCounter--;
        }

        const eventName = describeKeyEventType(eventRecordIndex);

        this.logger.debug(
          this._logPrefix(componentSearchIndex),
          `No matching actions found for '${this._describeCurrentKeyCombination()}' ${eventName}.`
        );
      }

      componentSearchIndex++;
    }
  }

  _stateFromEvent(event) {
    return event.simulated ? KeyEventRecordState.simulated : KeyEventRecordState.seen;
  }

  _stopEventPropagationAfterHandlingIfEnabled(event, componentId) {
    if (Configuration.option('stopEventPropagationAfterHandling')) {
      this._stopEventPropagation(event, componentId);

      return true;
    }

    return false;
  }

  _stopEventPropagationAfterIgnoringIfEnabled(event, componentId) {
    if (Configuration.option('stopEventPropagationAfterIgnoring')) {
      this._stopEventPropagation(event, componentId);

      return true;
    }

    return false;
  }

  _describeCurrentKeyCombination() {
    return this._getCurrentKeyCombination().ids[0];
  }

  _tryMatchSequenceWithKeyAliases(keyMatcher, sequenceIds) {
    if (sequenceIds.length === 0) {
      return keyMatcher[''];
    }

    const idSizes = sequenceIds.map((ids) => ids.length);
    const indexCounters = sequenceIds.map(() => 0);

    let triedAllPossiblePermutations = false;

    while (!triedAllPossiblePermutations) {
      const sequenceIdPermutation = indexCounters.map((sequenceIdIndex, index) => {
        return sequenceIds[index][sequenceIdIndex];
      });

      const candidateId = sequenceIdPermutation.join(' ');

      if (keyMatcher[candidateId]) {
        return keyMatcher[candidateId];
      }

      let incrementer = 0;
      let carry = true;

      while (carry && incrementer < indexCounters.length) {
        const count = indexFromEnd(indexCounters, incrementer);

        const newIndex = (count + 1) % (indexFromEnd(idSizes, incrementer) || 1);

        indexCounters[indexCounters.length - (incrementer + 1)] = newIndex;

        carry = newIndex === 0;

        if (carry) {
          incrementer++;
        }
      }

      triedAllPossiblePermutations = incrementer === indexCounters.length;
    }
  }

  _combinationMatchesKeys(keyBeingPressed, keyCombination, combinationMatch, eventRecordIndex) {
    const combinationHasHandlerForEventType =
      combinationMatch.events[eventRecordIndex];

    if (!combinationHasHandlerForEventType) {
      /**
       * If the combination does not have any actions bound to the key event we are
       * currently processing, we skip checking if it matches the current keys being
       * pressed.
       */
      return false;
    }

    let keyCompletesCombination = false;

    const combinationMatchesKeysPressed = Object.keys(combinationMatch.keyDictionary).every((candidateKeyName) => {
      const keyState = getKeyState(keyCombination, candidateKeyName);

      if (keyState) {
        if (keyIsCurrentlyTriggeringEvent(keyState, eventRecordIndex)) {
          if (keyBeingPressed && (keyBeingPressed === getKeyAlias(keyCombination, candidateKeyName))) {
            keyCompletesCombination =
              !keyAlreadyTriggeredEvent(keyState, eventRecordIndex);
          }

          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    });

    return combinationMatchesKeysPressed && keyCompletesCombination;
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
           this._addToCurrentKeyCombination(
             modifierKey,
             KeyEventRecordIndex.keyup,
             this._stateFromEvent(event)
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
    const currentCombination = this._getCurrentKeyCombination();

    return getKeyState(currentCombination, keyName);
  }

  _buildCombinationKeyAliases(keyDictionary) {
    const aliasFunctions = (() => {
      if (keyDictionary['Shift']) {
        if (keyDictionary['Alt']) {
          return [resolveAltShiftedAlias, resolveUnaltShiftedAlias];
        } else {
          return [resolveShiftedAlias, resolveUnshiftedAlias];
        }
      } else {
        if (keyDictionary['Alt']) {
          return [resolveAltedAlias, resolveUnaltedAlias];
        } else {
          const nop = (keyName) => [keyName];
          return [nop, nop];
        }
      }
    })();

    return Object.keys(keyDictionary).reduce((memo, keyName) => {
      resolveKeyAlias(keyName).forEach((normalizedKey) => {
        aliasFunctions.forEach((aliasFunction) => {
          aliasFunction(normalizedKey).forEach((keyAlias) => {
            if (keyAlias !== keyName || keyName !== normalizedKey) {
              memo[keyAlias] = keyName;
            }
          });
        })
      });

      return memo;
    }, {});
  }

  _setComponentPosition(componentId, position) {
    this.componentIdDict[componentId] = position;
  }

  _getComponentPosition(componentId){
    return this.componentIdDict[componentId];
  }

  _getComponent(componentId){
    const componentPosition = this._getComponentPosition(componentId);
    return this.componentList[componentPosition];
  }

  _getComponentAndPosition(componentId){
    const componentPosition = this._getComponentPosition(componentId);
    return [ this.componentList[componentPosition], componentPosition ];
  }

  /**
   * Returns a prefix for all log entries related to the current event strategy
   * @protected
   * @abstract
   */
  _logPrefix() {

  }
}

function getKeyAlias(keyCombination, keyName) {
  const keyState = keyCombination.keys[keyName];

  if (keyState) {
    return keyName;
  } else {
    const keyAlias = keyCombination.keyAliases[keyName];

    if (keyAlias) {
      return keyAlias;
    } else {
      return keyName;
    }
  }
}

function getKeyState(keyCombination, keyName) {
  const keyState = keyCombination.keys[keyName];

  if (keyState) {
    return keyState;
  } else {
    const keyAlias = keyCombination.keyAliases[keyName];

    if (keyAlias) {
      return keyCombination.keys[keyAlias];
    }
  }
}


function newComponentRegistryItem() {
  return {
    childIds: [],
    parentId: null
  };
}

function keyAlreadyTriggeredEvent(keyState, eventRecordIndex) {
  return keyState && keyState[KeyEventSequenceIndex.previous][eventRecordIndex];
}

export default AbstractKeyEventStrategy;
