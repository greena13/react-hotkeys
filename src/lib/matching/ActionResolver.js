import KeyMapMatcher from './KeyMapMatcher';

class ActionResolver {
  constructor(componentList) {
    /**
     * List of mappings from key sequences to handlers that is constructed on-the-fly
     * as key events propagate up the render tree
     */
    this._keyMapMatchers = [];

    /**
     * Array of counters - one for each component - to keep track of how many handlers
     * for that component still need actions assigned to them
     * @type {Number[]}
     */
    this._unmatchedHandlerStatus = [];

    /**
     * Index marking the number of places from the end of componentList for which the
     * keyMaps have been matched with event handlers. Used to build this.keyMaps as
     * key events propagate up the React tree.
     * @type {Number}
     */
    this._position = 0;

    /**
     * A dictionary of handlers to the components that register them. This is populated
     * as this.handlerResolutionSearchIndex increases, moving from the end of this.componentList to the
     * front, populating this.keyMaps as needed
     * @type {Object<ActionName, ComponentId>}
     */
    this._handlersDictionary = {};

    /**
     * A dictionary of sequences already encountered in the process of building the
     * list of keyMaps on the fly, as key events propagate up the component tree
     */
    this._keySequencesDictionary = {};

    this._componentList = componentList;

    this._componentList.forEach(({ handlers }) => {
      this._unmatchedHandlerStatus.push( [ Object.keys(handlers).length, {} ]);
      this._keyMapMatchers.push(new KeyMapMatcher());
    });
  }

  getKeyMapMatcher(index) {
    if (this._componentHasUnmatchedHandlers(index)) {
      /**
       * We build the mapping between key sequences and their closest handlers the
       * first time the key map for the component at <tt>index</tt> is accessed.
       *
       * We must search higher than the current component for actions, as they are
       * often defined in parent components of those that ultimately define their
       * handlers.
       */
      while (this._getPosition() < this._componentList.getLength()) {
        /**
         * Component currently handling key event has handlers that have not yet been
         * associated with a key sequence. We need to continue walking up the component
         * tree in search of the matching actions that describe the applicable key
         * sequence.
         */
        this._addHandlersFromComponent();
        this._addActionsFromComponent();

        this._position++;
      }
    }

    return this._getKeyMapMatcher(index);
  }

  componentHasActionsBoundToEventType(componentSearchIndex, eventRecordIndex) {
    return this.getKeyMapMatcher(componentSearchIndex).hasMatchesForEventType(eventRecordIndex);
  }

  findMatchingKeySequenceInComponent(componentSearchIndex, keyHistory, keyName, eventRecordIndex) {
    if (!this.componentHasActionsBoundToEventType(componentSearchIndex, eventRecordIndex)) {
      return null;
    }

    return this.getKeyMapMatcher(componentSearchIndex).findMatch(
      keyHistory,
      keyName,
      eventRecordIndex
    )
  }

  _getKeyMapMatcher(index) {
    return this._keyMapMatchers[index];
  }

  _addActionsFromComponent() {
    const {actions} = this._getComponent();

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
          this._componentList.getAtIndex(handlerComponentIndex).handlers[actionName];

        /**
         * Get key map that corresponds with the component that defines the handler
         * closest to the event target
         */
        const keyMapMatcher = this._getKeyMapMatcher(handlerComponentIndex);

        /**
         * At least one child HotKeys component (or the component itself) has
         * defined a handler for the action, so now we need to associate them
         */
        const actionOptionsList = actions[actionName];

        actionOptionsList.forEach((keySequenceMatcher) => {
          const keySequence = [keySequenceMatcher.prefix, keySequenceMatcher.id].join(' ');

          if (this._isClosestHandlerFound(keySequence, keySequenceMatcher)) {
            /**
             * Return if there is already a component with handlers for the current
             * key sequence closer to the event target
             */
            return;
          }

          keyMapMatcher.addSequenceMatcher(keySequenceMatcher, handler);

          this._addKeySequence(keySequence, [
            handlerComponentIndex,
            keySequenceMatcher.eventRecordIndex
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
    const { handlers } = this._getComponent();

    /**
     * Add current component's handlers to the handlersDictionary so we know
     * which component has defined them
     */
    Object.keys(handlers).forEach((actionName) => {
      this._addHandler(actionName);
    });
  }

  _getComponent() {
    return this._componentList.getAtIndex(this._getPosition());
  }

  _addHandler(actionName) {
    if (!this._handlersDictionary[actionName]) {
      this._handlersDictionary[actionName] = [];
    }

    this._handlersDictionary[actionName].push(this._getPosition());
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
      return dictEntry[1] === keyMatcher.eventRecordIndex
    });
  }

  _getPosition() {
    return this._position;
  }
}

export default ActionResolver;
