import isUndefined from '../../utils/isUndefined';
import KeyEventCounter from '../listening/KeyEventCounter';
import EventStrategyLogger from './EventStrategyLogger';
import describeKeyEvent from '../../helpers/logging/describeKeyEvent';

class GlobalLogger extends EventStrategyLogger {
  keyEventPrefix(componentId, options = {}) {
    const eventIcons = super.constructor.eventIcons;
    const componentIcons = super.constructor.componentIcons;

    let base = 'HotKeys (GLOBAL';

    if (options.eventId !== false) {
      const eventId = isUndefined(options.eventId) ? KeyEventCounter.getId() : options.eventId;

      base = `${base}-E${eventId}${eventIcons[eventId % eventIcons.length]}`
    }

    if (isUndefined(componentId)) {
      return `${base}):`
    } else {
      return `${base}-C${componentId}${componentIcons[componentId % componentIcons.length]}):`;
    }
  }

  logIgnoredKeyEvent(event, key, eventType, reason) {
    this.logIgnoredEvent(describeKeyEvent(event, key, eventType), reason)
  }

  logIgnoredEvent(eventDescription, reason) {
    this.debug(this.keyEventPrefix(), `Ignored ${eventDescription} because ${reason}.`);
  }

  logEventRejectedByFilter(event, key, eventType) {
    this.logIgnoredKeyEvent(event, key, eventType, 'ignoreEventsFilter rejected it');
  }

  logEventAlreadySimulated(event, key, eventType) {
    this.logIgnoredKeyEvent(event, key, eventType, 'it was not expected, and has already been simulated');
  }
}

export default GlobalLogger;
