import KeyEventType from '../../const/KeyEventType';
import describeKeyEventType from '../../helpers/logging/describeKeyEventType';
import normalizeEventName from '../../utils/string/normalizeEventName';
import objectValues from '../../utils/object/values';


class GlobalEventListenerAdaptor {
  constructor(strategy, {logger}) {
    /**
     * Whether the global key event handlers have been bound to document yet or not
     * @type {boolean}
     */
    this._listenersBound = false;

    this.logger = logger;

    this._eventStrategy = strategy;
  }

  isListenersBound() {
    return this._listenersBound
  }

  unbindListeners() {
    objectValues(KeyEventType).forEach((recordIndex) => {
      const eventName = describeKeyEventType(recordIndex);

      delete document[`on${eventName}`];

      this._logHandlerStateChange(`Removed`, eventName);
    });

    this._listenersBound = false;
  }

  bindListeners() {
    objectValues(KeyEventType).forEach((recordIndex) => {
      const eventName = describeKeyEventType(recordIndex);

      document[`on${eventName}`] = (keyEvent) => {
        this._eventStrategy[`handle${normalizeEventName(eventName)}`](keyEvent);
      };

      this._logHandlerStateChange(`Bound`, eventName);
    });

    this._listenersBound = true;
  }

  _logHandlerStateChange(action, eventName) {
    this.logger.debug(
      this.logger.nonKeyEventPrefix(undefined, {eventId: false}),
      `${action} handler handleGlobal${normalizeEventName(eventName)}() to document.on${eventName}()`
    );
  }
}

export default GlobalEventListenerAdaptor;
