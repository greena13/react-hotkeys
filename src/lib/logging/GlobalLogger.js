import isUndefined from '../../utils/isUndefined';
import KeyEventCounter from '../listening/KeyEventCounter';
import EventStrategyLogger from './EventStrategyLogger';
import describeKeyEvent from '../../helpers/logging/describeKeyEvent';

class GlobalLogger extends EventStrategyLogger {
  keyEventPrefix(componentId, options = {}) {
    const eventIcons = super.constructor.eventIcons;
    const componentIcons = super.constructor.componentIcons;

    let base = 'HotKeys (GLOBAL';

    if (!isUndefined(componentId)) {
      return `${base}-C${componentId}${componentIcons[componentId % componentIcons.length]}):`;
    }

    if (options.eventId === false) {
      return `${base}):`
    } else {
      const eventId = isUndefined(options.eventId) ? KeyEventCounter.id : options.eventId;

      return `${base}-E${eventId}${eventIcons[eventId % eventIcons.length]}):`;
    }
  }

  logIgnoredKeyEvent(event, key, eventType, reason, componentId) {
    this.logIgnoredEvent(describeKeyEvent(event, key, eventType), reason, componentId)
  }

  logIgnoredEvent(eventDescription, reason, componentId) {
    this.debug(this.keyEventPrefix(componentId), `Ignored ${eventDescription} because ${reason}.`);
  }

  logEventRejectedByFilter(event, key, eventType, componentId) {
    this.logIgnoredKeyEvent(event, key, eventType, 'ignoreEventsFilter rejected it', componentId);
  }

  logEventAlreadySimulated(event, key, eventType, componentId) {
    this.logIgnoredKeyEvent(event, key, eventType, 'it was not expected, and has already been simulated', componentId);
  }
}

export default GlobalLogger;
