import KeyEventCounter from './KeyEventCounter';
import Configuration from './Configuration';
import describeKeyEvent from '../helpers/logging/describeKeyEvent';
import KeyEventRecordIndex from '../const/KeyEventRecordIndex';

class EventPropagator {
  constructor(componentList, { logger, logPrefix}) {
    this._componentList = componentList;

    this._previousPropagation = null;

    this.logger = logger;
    this._logPrefix = logPrefix;

    this._clear();
  }

  _clear() {
    /**
     * Index of the component last seen to be handling a key event
     * @type {ComponentId}
     */
    this._previousPosition = -1;

    this._position = -1;

    /**
     * Whether the keyboard event currently being handled has already matched a
     * handler function that has been called
     * @type {Boolean}
     */
    this._actionHandled = false;

    /**
     * Whether the keyboard event current being handled should be ignored
     * @type {Boolean}
     */
    this._ignoreEvent = false;

    /**
     * Whether the keyboard event current being handled should be observed, even
     * if matches the ignoreEventCondition
     * @type {Boolean}
     */
    this._observeIgnoredEvents = false;

    /**
     * Whether the strategy is in the process of stopping propagation and tidying
     * up
     */
    this._stopping = false;

    this._componentId = null;
    this._key = null;

    this._type = null;
  }

  /**
   * New event propagation
   */
  isFirstPropagationStep() {
    const previousPosition = this.getPreviousPosition();

    return previousPosition === -1 || previousPosition >= this._position;
  }

  getKey() {
    return this._key;
  }

  getEventType() {
    return this._type;
  }

  /**
   * Propagation steps
   */

  startNewPropagationStep(componentId, event, key, type, options) {
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

  finishPropagationStep() {
    if (this.isStopped() || this._componentList.isRoot(this._componentId)) {
      this._previousPropagation = this._clone();
      this._clear();
    } else {
      this._previousPosition = this._position;
    }
  }

  /**
   * Previous propagation
   */

  getPreviousPropagation() {
    return this._previousPropagation;
  }

  getPreviousPosition() {
    return this._previousPosition;
  }

  /**
   * Ignoring events
   */

  observeIgnoredEvents() {
    this._observeIgnoredEvents = true;
  }

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

  setIgnoreEvent(ignore) {
    this._ignoreEvent = ignore;
  }

  isIgnoringEvent() {
    return !this._observeIgnoredEvents && this._ignoreEvent;
  }

  /**
   * Stopping further propagation
   */

  isStopped() {
    return this._stopping;
  }

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

  isPendingPropagation() {
    const previousPosition = this.getPreviousPosition();
    return previousPosition !== -1 && (previousPosition + 1) < this._position;
  }

  isHandled() {
    return this._actionHandled;
  }

  setHandled() {
    this._actionHandled = true;
  }

  _clone() {
    const cloned = new EventPropagator(this._componentList, {
      logger: this.logger,
      logPrefix: this._logPrefix
    });

    Object.assign(cloned, this);
    return cloned;
  }
}

export default EventPropagator;
