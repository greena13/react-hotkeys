import KeyEventCounter from './KeyEventCounter';
import Configuration from '../config/Configuration';
import describeKeyEvent from '../../helpers/logging/describeKeyEvent';
import KeyEventRecordIndex from '../../const/KeyEventRecordIndex';

/**
 * Handles the propagation of keyboard events up through the React component tree,
 * starting from the hot keys component closest to the event target
 */
class EventPropagator {
  /**
   * Create a new instance of EventPropagator
   * @param {ComponentOptionsList} componentList List of options of the components
   *        the event is propagating through
   * @param {Logger} logger The logger instance to use
   * @param {function} logPrefix Function that returns the appropriate log prefix for
   *        each log entry
   */
  constructor(componentList, { logger, logPrefix}) {
    this._componentList = componentList;

    this._previousPropagation = null;

    this.logger = logger;

    this._logPrefix = logPrefix;

    this._reset();
  }

  _reset() {
    /**
     * Position of the component that the event last propagated through
     * @type {number}
     */
    this._previousPosition = -1;

    /**
     * Position of the current component the event is propagating through
     * @type {number}
     */
    this._position = -1;

    /**
     * Flag to record whether the keyboard event matches an action whose handler
     * has already been called
     * @type {boolean}
     */
    this._actionHandled = false;

    /**
     * Flag to record whether the keyboard event should be ignored
     * @type {boolean}
     */
    this._ignoreEvent = false;

    /**
     * Flag to record whether the keyboard event current being handled should be
     * observed, even if matches the ignoreEventCondition
     * @type {boolean}
     */
    this._observeIgnoredEvents = false;

    /**
     * Flag to record whether the event is being stopped from further propagation
     * @type {boolean}
     */
    this._stopping = false;

    /**
     * The id of the component the event is current propagating through
     * @type {ComponentId}
     */
    this._componentId = null;

    /**
     * The name of the key the propagating event relates to
     * @type {ReactKeyName}
     */
    this._key = null;

    /**
     * The type of keyboard event that is propagating
     * @type {KeyEventRecordIndex}
     */
    this._type = null;
  }

  /********************************************************************************
   * New event propagation
   *********************************************************************************/

  /**
   * Whether the current propagation step is the first one
   * @returns {boolean} true if this is the first propagation step
   */
  isFirstPropagationStep() {
    const previousPosition = this.getPreviousPosition();

    return previousPosition === -1 || previousPosition >= this._position;
  }

  /**
   * Whether the propagation is for a particular key
   * @param {ReactKeyName} keyName The name of the key to query
   * @returns {boolean} true if the event propagation is for the key
   */
  isForKey(keyName) {
    return this._key === keyName;
  }

  /**
   * The type of keyboard event that is propagating
   * @param {KeyEventRecordIndex} eventRecordIndex The type of keyboard event to query
   * @returns {boolean} true if the keyboard event propagating is that type
   */
  isForEventType(eventRecordIndex) {
    return this._type === eventRecordIndex;
  }

  /********************************************************************************
   * Propagation steps
   *********************************************************************************/

  /**
   * Handle a new propagation step, called as an around callback.
   * @param {ComponentId} componentId The id of the component that has just had the
   *        event propagate up to it
   * @param {KeyboardEvent} event The actual KeyboardEvent that is propagating
   * @param {ReactKeyName} key The name of the key the event relates to
   * @param {KeyEventRecordIndex} type The type of keyboard event
   * @param {function} handler Function to call if event should be observed
   * @returns {boolean} true if the event should be observed, otherwise false if it
   *        should be ignored.
   */
  propagate(componentId, event, key, type, handler) {
    if (this.startNewPropagationStep(componentId, event, key, KeyEventRecordIndex.keyup)) {
      handler();

      this.finishPropagationStep();

      return true;
    }

    return false;
  }

  /**
   * Begin a new propagation step, called as a before callback. i.e. the first thing
   * after an event has propagated to a new hot keys component
   * @param {ComponentId} componentId The id of the component that has just had the
   *        event propagate up to it
   * @param {KeyboardEvent} event The actual KeyboardEvent that is propagating
   * @param {ReactKeyName} key The name of the key the event relates to
   * @param {KeyEventRecordIndex} type The type of keyboard event
   * @returns {boolean} true if the event should be observed, otherwise false if it
   *        should be ignored.
   */
  startNewPropagationStep(componentId, event, key, type) {
    this._position = this._componentList.getIndexById(componentId);
    this._componentId = componentId;

    if (this.isFirstPropagationStep()) {
      KeyEventCounter.incrementId();

      this._key = event.key;
      this._type = type;
    }

    if (event.repeat && Configuration.option('ignoreRepeatedEventsWhenKeyHeldDown')) {
      this.logger.debug(
        this._logPrefix(componentId),
        `Ignored repeated ${describeKeyEvent(event, key, KeyEventRecordIndex.keydown)} event.`
      );

      this.ignoreEvent(event);

      return false;
    }

    return true;
  }

  /**
   * Ends handling of a propagation step and performs cleanup. Called as a after callback.
   * @returns {void}
   */
  finishPropagationStep() {
    if (this.isStopped() || this._componentList.isRoot(this._componentId)) {
      this._previousPropagation = this._clone();
      this._reset();
    } else {
      this._previousPosition = this._position;
    }
  }

  /********************************************************************************
   * Previous propagation
   *********************************************************************************/

  /**
   * The previous event propagation, either for an earlier event type of the same key
   * or a different key's event propagation
   * @returns {EventPropagator} The propagator for the previous event propagation
   */
  getPreviousPropagation() {
    if (!this._previousPropagation) {
      this._previousPropagation = this._clone({copyState: false});
    }

    return this._previousPropagation;
  }

  /**
   * The position of the component that last had the current propagating event
   * propagate through it
   * @returns {number}
   */
  getPreviousPosition() {
    return this._previousPosition;
  }

  /********************************************************************************
   * Ignoring events
   *********************************************************************************/

  /**
   * Set the observeIgnoredEvents flag, to observe (not ignore) keyboard events that
   * match the ignored events filter
   * @returns {void}
   */
  observeIgnoredEvents() {
    this._observeIgnoredEvents = true;
  }

  /**
   * Record that an event is being ignored for the rest of its propagation and, if
   * enabled, stop it from further propagation entirely.
   * @param {KeyboardEvent} event Event to ignore
   * @returns {boolean} true if the event was stopped from further propagation,
   *          otherwise false.
   */
  ignoreEvent(event) {
    this.setIgnoreEvent(true);

    if (this.isIgnoringEvent() && Configuration.option('stopEventPropagationAfterIgnoring')) {
      this.logger.debug(
        this._logPrefix(this._componentId),
        'Stopping further event propagation.'
      );

      this.stop(event);
      this.finishPropagationStep();

      return true;
    }

    return false;
  }

  /**
   * Set the ignore event flag, to ignore the current event for the rest of its
   * propagation
   * @param {boolean} ignore true to ignore the event, or false to not ignore it
   * @returns {void}
   */
  setIgnoreEvent(ignore) {
    this._ignoreEvent = ignore;
  }

  /**
   * Whether to ignore the currently propagating event or not
   * @returns {boolean} true if the event is being ignored for the current propagation
   */
  isIgnoringEvent() {
    return !this._observeIgnoredEvents && this._ignoreEvent;
  }

  /********************************************************************************
   * Stopping propagation
   *********************************************************************************/

  /**
   * Whether the event has been stopped from further propagation
   * @returns {boolean} true if the event is being stopped
   */
  isStopped() {
    return this._stopping;
  }

  /**
   * Stop an event from further propagation
   * @param {KeyboardEvent} event Event to call stopPropagation() on
   * @returns {boolean} true if the event was stopped and false if it was already
   *          stopped
   */
  stop(event) {
    if (!this.isStopped()) {
      this._stopping = true;

      if (!event.simulated) {
        event.stopPropagation();
      }

      return true;
    }

    return false;
  }

  /**
   * Whether the keyboard event has yet propagated to the root hot keys component
   * @returns {boolean} true if it still has hotkeys components to propagate to
   *          before being complete.
   */
  isPendingPropagation() {
    const previousPosition = this.getPreviousPosition();
    return previousPosition !== -1 && (previousPosition + 1) < this._position;
  }

  /**
   * If the action has already been handled
   * @returns {boolean} true if the action has already been handled
   */
  isHandled() {
    return this._actionHandled;
  }

  /**
   * Record that the current propagating event matched and action and its handler
   * has been called.
   * @returns {void}
   */
  setHandled() {
    this._actionHandled = true;
  }

  _clone({ copyState = true } = {}) {
    const cloned = new EventPropagator(this._componentList, {
      logger: this.logger,
      logPrefix: this._logPrefix
    });

    if (copyState) {
      Object.assign(cloned, this);
    }

    return cloned;
  }
}

export default EventPropagator;
