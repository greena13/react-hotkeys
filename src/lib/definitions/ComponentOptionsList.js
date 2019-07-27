import removeAtIndex from '../../utils/array/removeAtIndex';
import KeyEventStateArrayManager from '../shared/KeyEventStateArrayManager';
import isObject from '../../utils/object/isObject';
import hasKey from '../../utils/object/hasKey';
import arrayFrom from '../../utils/array/arrayFrom';
import isUndefined from '../../utils/isUndefined';
import KeyEventType from '../../const/KeyEventType';
import KeySequenceParser from '../shared/KeySequenceParser';
import KeyEventState from '../../const/KeyEventState';
import ComponentOptionsListIterator from './ComponentOptionsListIterator';

/**
 * @typedef {Object} ComponentOptions a hotkeys component's options in a normalized
 *          format
 * @property {ActionDictionary} actions The dictionary of actions defined by the
 *           component
 */

/**
 * A mapping between ActionName and ActionConfiguration
 * @typedef {Object.<ActionName,ActionConfiguration>} ActionDictionary
 */

/**
 * Standardized format for defining an action
 * @typedef {Object} ActionConfiguration
 * @property {NormalizedKeySequenceId} prefix - String describing the sequence of key
 *          combinations, before the final key combination (an empty string for
 *          sequences that are a single key combination)
 * @property {ActionName} actionName - Name of the action
 * @property {number} sequenceLength - Number of combinations involved in the
 *           sequence
 * @property {KeyCombinationString} id - Serialized description of the key combinations
 *            that make up the sequence
 * @property {Object.<KeyName, Boolean>} keyDictionary - Dictionary of key names involved
 *           in the last key combination of the sequence
 * @property {KeyEventType} keyEventType - Record index for key event that
 *          the matcher should match on
 * @property {number} size - Number of keys involved in the final key combination
 */

/**
 * List of component options that define the application's currently enabled key
 * maps and handlers, starting from the inner-most (most deeply nested) component,
 * that is closest to the DOM element currently in focus, and ending with the options
 * of the root hotkeys component.
 * @class
 */
class ComponentOptionsList {
  constructor() {
    /**
     * List of ComponentOptions for the actions registered by each hot keys component.
     * @type {ComponentOptions[]}
     */
    this._list = [];

    /**
     * Dictionary mapping the ids of the components defining actions, and their
     * position in the list.
     * @type {Object.<ComponentId, Number>}
     */
    this._idToIndex = {};

    /**
     * Counter for the length of the longest sequence currently enabled.
     * @type {number}
     */
    this.longestSequence = 1;

    /**
     * The id of the component with the longest key sequence
     * @type {ComponentId}
     */
    this._longestSequenceComponentId = null;

    /**
     * Record of whether at least one keymap is bound to each event type (keydown,
     * keypress or keyup)
     * @type {KeyEvent}
     */
    this._keyMapEventRecord = KeyEventStateArrayManager.newRecord();
  }

  /**
   * Return a new iterator that can be used to enumerate the list
   * @returns {ComponentOptionsListIterator}
   */
  get iterator() {
    return new ComponentOptionsListIterator(this);
  }

  /**
   * Adds a new hot key component's options, to be parsed and standardised before being
   * added to the list
   * @param {ComponentId} componentId - Id of the component the options belong to
   * @param {KeyMap} actionNameToKeyMap - Map of actions to key maps
   * @param {HandlersMap} actionNameToHandlersMap - Map of actions to handlers
   * @param {Object} options - Hash of options that configure how the key map is built.
   * @param {string} options.defaultKeyEvent - The default key event to use for any
   *        action that does not explicitly define one.
   * @returns {number} The position the component options have in the list
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

    const newIndex = this.length - 1;
    return this._idToIndex[componentId] = newIndex;
  }

  /**
   * Whether the list contains options for a component with the specified id
   * @param {ComponentId} id Id of the component
   * @returns {boolean} True if the list contains options for the component with the
   *        specified id
   */
  containsId(id) {
    return !!this.getById(id);
  }

  /**
   * Retrieves options for a component from the list
   * @param {ComponentId} id Id of the component to retrieve the options for
   * @returns {ComponentOptions} Options for the component with the specified id
   */
  getById(id) {
    return this.getAtPosition(this.getPositionById(id));
  }

  /**
   * Returns the position of the options belonging to the component with the specified
   * id.
   * @param {ComponentId} id Id of the component to retrieve the options for
   * @returns {number} The position of the component options in the list.
   */
  getPositionById(id) {
    return this._idToIndex[id];
  }

  /**
   * Replaces the options of a component already in the list with new values
   * @param {ComponentId} componentId - Id of the component to replace the options of
   * @param {KeyMap} actionNameToKeyMap - Map of actions to key maps
   * @param {HandlersMap} actionNameToHandlersMap - Map of actions to handlers
   * @param {Object} options - Hash of options that configure how the key map is built.
   * @param {string} options.defaultKeyEvent - The default key event to use for any
   *        action that does not explicitly define one.
   * @returns {number} The position the component options have in the list
   */
  update(componentId, actionNameToKeyMap, actionNameToHandlersMap, options) {
    /**
     * We record whether we're building new options for the component that currently
     * has the longest sequence, to decide whether we need to recalculate the longest
     * sequence.
     */
    const isUpdatingLongestSequenceComponent =
      this._isUpdatingComponentWithLongestSequence(componentId);

    const longestSequenceBefore = this.longestSequence;

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
        this.longestSequence = componentOptions.sequenceLength;
      } else {
        /**
         * The component may no longer have the longest sequence, so we need to
         * recalculate
         */
        this._recalculateLongestSequence();
      }
    }

    this._list[this.getPositionById(componentId)] = componentOptions;
  }

  /**
   * Removes the options of a component from the list
   * @param {ComponentId} id The id of the component whose options are removed
   * @returns {void}
   */
  remove(id) {
    const isUpdatingLongestSequenceComponent =
      this._isUpdatingComponentWithLongestSequence(id);

    this.removeAtPosition(this.getPositionById(id));

    if (isUpdatingLongestSequenceComponent) {
      this._recalculateLongestSequence();
    }
  }

  /**
   * Whether a component is the root component (the last one in the list)
   * @param {ComponentId} id Id of the component to query if it is the root
   * @returns {boolean} true if the component is the last in the list
   */
  isRoot(id) {
    return this.getPositionById(id) >= this.length - 1;
  }

  /**
   * Whether the list contains at least one component with an action bound to a
   * particular keyboard event type.
   * @param {KeyEventType} keyEventType Index of the keyboard event type
   * @returns {boolean} true when the list contains a component with an action bound
   *          to the event type
   */
  anyActionsForEventType(keyEventType) {
    return !!this._keyMapEventRecord[keyEventType];
  }

  /**
   * The number of components in the list
   * @type {number} Number of components in the list
   */
  get length() {
    return this._list.length;
  }

  /**
   * The component options at particular position in the list
   * @param {number} position The position in the list
   * @returns {ComponentOptions} The component options at the position in the list
   */
  getAtPosition(position) {
    return this._list[position];
  }

  /**
   * Remove the component options at a position in the list
   * @param {number} position The position in the list to remove the options
   * return {void}
   */
  removeAtPosition(position) {
    this._list = removeAtIndex(this._list, position);

    let counter = position;

    while(counter < this.length) {
      this._idToIndex[this.getAtPosition(counter).componentId] = counter;
      counter++;
    }
  }

  /**
   * A plain JavaScript object representation of the component options list that can
   * be used for serialization or debugging
   * @returns {ComponentOptions[]} plain JavaScript object representation of the list
   */
  toJSON() {
    return this._list;
  }
  
  /**
   * Builds the internal representation that described the options passed to a hot keys
   * component
   * @param {ComponentId} componentId - Id of the component the options belong to
   * @param {KeyMap} actionNameToKeyMap - Map of actions to key maps
   * @param {HandlersMap} actionNameToHandlersMap - Map of actions to handlers
   * @param {Object} options - Hash of options that configure how the key map is built.
   * @returns {ComponentOptions} Options for the specified component
   * @private
   */
  _build(componentId, actionNameToKeyMap, actionNameToHandlersMap, options){
    const actions =
      this._buildActionDictionary(actionNameToKeyMap, options, componentId);

    return {
      actions, handlers: actionNameToHandlersMap, componentId, options
    };
  }

  _isUpdatingComponentWithLongestSequence(componentId) {
    return componentId === this._getLongestSequenceComponentId();
  }

  _getLongestSequenceComponentId() {
    return this._longestSequenceComponentId;
  }

  _recalculateLongestSequence() {
    const iterator = this.iterator;

    while(iterator.next()) {
      const {longestSequence, componentId } = iterator.getComponent();

      if (longestSequence > this.longestSequence) {
        this._longestSequenceComponentId = componentId;
        this.longestSequence = longestSequence;
      }
    }
  }

  /**
   * Returns a mapping between ActionNames and ActionConfiguration
   * @param {KeyMap} actionNameToKeyMap - Mapping of ActionNames to key sequences.
   * @param {Object} options - Hash of options that configure how the key map is built.
   * @param {string} options.defaultKeyEvent - The default key event to use for any
   *        action that does not explicitly define one.
   * @param {ComponentId} componentId Index of the component the matcher belongs to
   * @returns {ActionDictionary} Map from ActionNames to ActionConfiguration
   * @private
   */
  _buildActionDictionary(actionNameToKeyMap, options, componentId) {
    return Object.keys(actionNameToKeyMap).reduce((memo, actionName) => {
      const keyMapConfig = actionNameToKeyMap[actionName];

      const keyMapOptions = function(){
        if (isObject(keyMapConfig) && hasKey(keyMapConfig, 'sequences')) {
          return arrayFrom(keyMapConfig.sequences)
        } else {
          return arrayFrom(keyMapConfig);
        }
      }();

      keyMapOptions.forEach((keyMapOption) => {
        const { keySequence, keyEventType } =
          normalizeActionOptions(keyMapOption, options);

        this._addActionOptions(
          memo, componentId, actionName, keySequence, keyEventType
        );
      });

      return memo;
    }, {});
  }

  _addActionOptions(memo, componentId, actionName, keySequence, keyEventType) {
    const {sequence, combination} = KeySequenceParser.parse(keySequence, {keyEventType});

    if (sequence.size > this.longestSequence) {
      this.longestSequence = sequence.size;
      this._longestSequenceComponentId = componentId;
    }

    /**
     * Record that there is at least one key sequence in the focus tree bound to
     * the keyboard event
     */
    this._keyMapEventRecord[keyEventType] = KeyEventState.seen;

    if (!memo[actionName]) {
      memo[actionName] = [];
    }

    memo[actionName].push({
      prefix: sequence.prefix,
      actionName,
      sequenceLength: sequence.size,
      ...combination,
    });
  }
}

function normalizeActionOptions(keyMapOption, options) {
  if (isObject(keyMapOption)) {
    const {sequence, action} = keyMapOption;

    return {
      keySequence: sequence,
      keyEventType: isUndefined(action) ? KeyEventType[options.defaultKeyEvent] : KeyEventType[action]
    };
  } else {
    return {
      keySequence: keyMapOption,
      keyEventType: KeyEventType[options.defaultKeyEvent]
    };
  }
}

export default ComponentOptionsList;
