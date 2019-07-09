import KeyHistoryMatcher from './KeyHistoryMatcher';

/**
 * Resolves the correct actions to trigger for a list of hotkeys components and a
 * history of key events
 * @class
 */
class ActionResolver {
  /**
   * Creates a new instance of ActionResolver
   * @param {ComponentOptionsList} componentList List of components
   * @returns {ActionResolver}
   */
  constructor(componentList) {
    /**
     * List of mappings from key sequences to handlers that is constructed on-the-fly
     * as key events propagate up the render tree
     * @type {KeyHistoryMatcher[]}
     */
    this._keyMapMatchers = [];

    /**
     * Array of counters - one for each component - to keep track of how many handlers
     * for that component still need actions assigned to them
     * @type {Array.<Number,Object>}
     */
    this._unmatchedHandlerStatus = [];

    /**
     * A dictionary mapping action names to the position in the list of the components
     * that define handlers for them
     * @type {Object.<ActionName, Number[]>}
     */
    this._handlersDictionary = {};

    /**
     * A dictionary of sequences already encountered in the process of building the
     * list of keyMaps on the fly, as key events propagate up the component tree
     * @type {Object.<MouseTrapKeySequence, Number[]>}
     */
    this._keySequencesDictionary = {};

    const iterator = componentList.getNewIterator();

    while(iterator.next()) {
      const { handlers } = iterator.getComponent();
      this._unmatchedHandlerStatus.push( [ Object.keys(handlers).length, {} ]);
      this._keyMapMatchers.push(new KeyHistoryMatcher());
    }

    this._componentList = componentList;
    this._componentListIterator = componentList.getNewIterator();
  }

  /**
   * The KeyHistoryMatcher for the component in a particular position
   * @param {number} componentPosition Position of component to find the
   *        KeyHistoryMatcher for
   * @returns {KeyHistoryMatcher} Key combination matcher that corresponds
   *        to the component
   */
  getKeyHistoryMatcher(componentPosition) {
    if (this._componentHasUnmatchedHandlers(componentPosition)) {
      /**
       * We build the mapping between actions and their closest handlers the
       * first time the key map for the component at <tt>position</tt> is accessed.
       *
       * We must search higher than the current component for actions, as they are
       * often defined in parent components of those that ultimately define their
       * handlers.
       */
      while (this._componentListIterator.next()) {
        this._addHandlersFromComponent();
        this._addActionsFromComponent();
      }
    }

    return this._getKeyHistoryMatcher(componentPosition);
  }

  /**
   * Whether a component has one or more actions bound to an event type
   * @param {number} componentPosition Position of the component
   * @param {KeyEventType} keyEventType
   * @returns {boolean} true if the component has an action bound to the event type
   */
  componentHasActionsBoundToEventType(componentPosition, keyEventType) {
    return this.getKeyHistoryMatcher(componentPosition).hasMatchesForEventType(keyEventType);
  }

  /**
   * Finds matcher for sequence and current key event for a component at a position
   * @param {number} componentPosition Position of the component
   * @param {KeyHistory} keyHistory History of key combinations to match
   *        against actions defined in component
   * @param {ReactKeyName} keyName Name of the key the current event relates to
   * @param {KeyEventType} keyEventType Type of key event
   * @returns {Object|null}
   */
  findMatchingKeySequenceInComponent(componentPosition, keyHistory, keyName, keyEventType) {
    if (!this.componentHasActionsBoundToEventType(componentPosition, keyEventType)) {
      return null;
    }

    return this.getKeyHistoryMatcher(componentPosition).findMatch(
      keyHistory,
      keyName,
      keyEventType
    )
  }

  /********************************************************************************
   * Private methods
   *********************************************************************************/

  _getKeyHistoryMatcher(index) {
    return this._keyMapMatchers[index];
  }

  _addActionsFromComponent() {
    const {actions} = this._componentListIterator.getComponent();

    /**
     * Iterate over the actions of a component (starting with the current component
     * and working through its ancestors), matching them to the current component's
     * handlers
     */
    Object.keys(actions).forEach((actionName) => {
      const handlerComponentIndexArray = this._getHandlers(actionName);

      if (handlerComponentIndexArray) {
        /**
         * Get action handler closest to the event target
         */
        const handlerComponentIndex = handlerComponentIndexArray[0];

        const handler =
          this._componentList.getAtPosition(handlerComponentIndex).handlers[actionName];

        /**
         * Get key map that corresponds with the component that defines the handler
         * closest to the event target
         */
        const keyMapMatcher = this._getKeyHistoryMatcher(handlerComponentIndex);

        /**
         * At least one child HotKeys component (or the component itself) has
         * defined a handler for the action, so now we need to associate them
         */
        const actionOptionsList = actions[actionName];

        actionOptionsList.forEach((actionOptions) => {
          const keySequence = [actionOptions.prefix, actionOptions.id].join(' ');

          if (this._isClosestHandlerFound(keySequence, actionOptions)) {
            /**
             * Return if there is already a component with handlers for the current
             * key sequence closer to the event target
             */
            return;
          }

          keyMapMatcher.addMatch(actionOptions, handler);

          this._addKeySequence(keySequence, [
            handlerComponentIndex,
            actionOptions.keyEventType
          ]);
        });

        handlerComponentIndexArray.forEach((handlerComponentIndex) => {
          const handlerComponentStatus =
            this._getUnmatchedHandlerStatus(handlerComponentIndex);

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
  }

  _getHandlers(actionName) {
    return this._handlersDictionary[actionName];
  }

  _addHandlersFromComponent() {
    const { handlers } = this._componentListIterator.getComponent();

    /**
     * Add current component's handlers to the handlersDictionary so we know
     * which component has defined them
     */
    Object.keys(handlers).forEach((actionName) => {
      this._addHandler(actionName);
    });
  }

  _addHandler(actionName) {
    if (!this._handlersDictionary[actionName]) {
      this._handlersDictionary[actionName] = [];
    }

    this._handlersDictionary[actionName].push(this._componentListIterator.getPosition());
  }

  _addKeySequence(keySequence, value) {
    /**
     * Record that we have already found a handler for the current action so
     * that we do not override handlers for an action closest to the event target
     * with handlers further up the tree
     */
    if (!this._keySequencesDictionary[keySequence]) {
      this._keySequencesDictionary[keySequence] = [];
    }

    this._keySequencesDictionary[keySequence].push(value);
  }

  _componentHasUnmatchedHandlers(componentIndex) {
    return this._getUnmatchedHandlerStatus(componentIndex)[0] > 0;
  }

  _getUnmatchedHandlerStatus(index) {
    return this._unmatchedHandlerStatus[index];
  }

  _isClosestHandlerFound(keySequence, keyMatcher) {
    return this._keySequencesDictionary[keySequence] &&
    this._keySequencesDictionary[keySequence].some((dictEntry) => {
      return dictEntry[1] === keyMatcher.keyEventType
    });
  }
}

export default ActionResolver;
