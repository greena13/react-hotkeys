import removeAtIndex from '../utils/array/removeAtIndex';
import KeyEventRecordManager from './KeyEventRecordManager';
import Configuration from './Configuration';
import KeyCombinationSerializer from './KeyCombinationSerializer';
import isObject from '../utils/object/isObject';
import hasKey from '../utils/object/hasKey';
import arrayFrom from '../utils/array/arrayFrom';
import isUndefined from '../utils/isUndefined';
import KeyEventRecordIndex from '../const/KeyEventRecordIndex';
import KeySequenceParser from './KeySequenceParser';

class ComponentOptionsList {
  constructor() {
    /**
     * Object containing a component's defined key maps and handlers
     * @typedef {Object} ComponentOptionsFactory
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
     * @type {ComponentOptionsFactory[]}
     */
    this._list = [];

    /**
     * Set of ComponentOptions indexed by ComponentId to allow efficient retrieval
     * when components need to be updated or unmounted by their ComponentId
     * @type {Object<ComponentId, ComponentOptionsFactory>}
     */
    this._idToIndex = {};

    /**
     * Counter for the longest sequence registered by the HotKeys components currently
     * in focus. Allows setting an upper bound on the length of the key event history
     * that must be kept.
     * @type {Number}
     */
    this._longestSequence = 1;

    /**
     * The component index of the component that defines the longest key sequence, so
     * we can quickly determine if the longest sequence needs to be re-calculated when
     * that component is updated or removed.
     * @type {ComponentId}
     */
    this._longestSequenceComponentId = null;

    /**
     * Record to record whether there is at least one keymap bound to each event type
     * (keydown, keypress or keyup) so that we can skip trying to find a matching keymap
     * on events where we know there is none to find
     * @type {KeyEventRecord}
     */
    this._keyMapEventRecord = KeyEventRecordManager.newRecord();
  }

  getLongestSequenceComponentId() {
    return this._longestSequenceComponentId;
  }

  getLongestSequence() {
    return this._longestSequence;
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
   * @returns {ComponentOptionsFactory} Options for the specified component
   */
  add(componentId, actionNameToKeyMap, actionNameToHandlersMap, options) {
    if (this.containsId(componentId)) {
      return this.update(
        componentId, actionNameToKeyMap, actionNameToHandlersMap, options
      );
    }

    const componentOptions = this._build(
      componentId, actionNameToKeyMap, actionNameToHandlersMap, options
    );

    this._list.push(componentOptions);

    const newIndex = this.getLastIndex();
    return this._idToIndex[componentId] = newIndex;
  }

  get(id) {
    return this.getAtIndex(this.getIndexById(id));
  }

  update(componentId, actionNameToKeyMap, actionNameToHandlersMap, options) {
    /**
     * We record whether we're building new options for the component that
     * currently has the longest sequence, to decide whether we need to recalculate
     * the longest sequence
     */
    const isUpdatingLongestSequenceComponent =
      this._isUpdatingComponentWithLongestSequence(componentId);

    const longestSequenceBefore = this.getLongestSequence();

    const componentOptions = this._build(
      componentId, actionNameToKeyMap, actionNameToHandlersMap, options
    );

    if (isUpdatingLongestSequenceComponent &&
      componentOptions.sequenceLength !== longestSequenceBefore) {
      /**
       * Component with the longest sequence has just had new options registered
       * so we need to reset the longest sequence
       */
      if (componentOptions.sequenceLength > longestSequenceBefore) {
        /**
         * The same component has registered a longer sequence, so we just
         * need to update the sequence length to the new, larger number
         */
        this._longestSequence = componentOptions.sequenceLength;
      } else {
        /**
         * The component may no longer have the longest sequence, so we need to
         * recalculate
         */
        this._recalculateLongestSequence();
      }
    }

    this.updateAtIndex(this.getIndexById(componentId), componentOptions);
  }

  _build(componentId, actionNameToKeyMap, actionNameToHandlersMap, options){
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

  _isUpdatingComponentWithLongestSequence(componentId) {
    return componentId === this.getLongestSequenceComponentId();
  }

  _recalculateLongestSequence() {
    this.forEach(({longestSequence, componentId }) => {
      if (longestSequence > this.getLongestSequence()) {
        this._longestSequenceComponentId = componentId;
        this._longestSequence = longestSequence;
      }
    });
  }

  remove(id) {
    const isUpdatingLongestSequenceComponent =
      this._isUpdatingComponentWithLongestSequence(id);

    this.removeAtIndex(this.getIndexById(id));

    if (isUpdatingLongestSequenceComponent) {
      this._recalculateLongestSequence();
    }
  }

  any() {
    return this.getLength() !== 0;
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

        if (sequence.size > this.getLongestSequence()) {
          this._longestSequence = sequence.size;
          this._longestSequenceComponentId = componentId;
        }

        /**
         * Record that there is at least one key sequence in the focus tree bound to
         * the keyboard event
         */
        this._keyMapEventRecord[eventRecordIndex] = true;

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

  isAtLeastOneActionBoundToEvent(eventRecordIndex) {
    return !!this._keyMapEventRecord[eventRecordIndex];
  }

  forEachKeyEventType(iterator) {
    for(let index = 0; index < this._keyMapEventRecord.length; index++) {
      iterator(index);
    }
  }

  getLastIndex() {
    return this.getLength() - 1;
  }

  getLength() {
    return this._list.length;
  }

  forEach(iterator) {
    this._list.forEach(iterator);
  }

  getAtIndex(index) {
    return this._list[index];
  }

  containsId(id) {
    return !!this.get(id);
  }

  getIndexById(id) {
    return this._idToIndex[id];
  }

  updateAtIndex(index, componentOptions) {
    this._list[index] = componentOptions;
  }

  removeAtIndex(index) {
    this._list = removeAtIndex(this._list, index);

    let counter = index;

    while(counter < this.getLength()) {
      this._idToIndex[this.getAtIndex(counter).componentId] = counter;
      counter++;
    }
  }

  toJSON() {
    return this._list;
  }
}

export default ComponentOptionsList;
