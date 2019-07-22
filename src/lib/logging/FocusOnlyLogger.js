import isUndefined from '../../utils/isUndefined';
import KeyEventCounter from '../listening/KeyEventCounter';
import EventStrategyLogger from './EventStrategyLogger';
import describeKeyEvent from '../../helpers/logging/describeKeyEvent';

class FocusOnlyLogger extends EventStrategyLogger {
  keyEventPrefix(componentId, options = {}) {
    const logIcons = super.constructor.logIcons;
    const eventIcons = super.constructor.eventIcons;
    const componentIcons = super.constructor.componentIcons;

    let base = 'HotKeys (';

    if (options.focusTreeId !== false) {
      const focusTreeId = isUndefined(options.focusTreeId) ? this._eventStrategy.getFocusTreeId() : options.focusTreeId;
      base += `F${focusTreeId}${logIcons[focusTreeId % logIcons.length]}-`;
    }

    base += `C${componentId}${componentIcons[componentId % componentIcons.length]}`;

    const position = this._eventStrategy.getComponentPosition(componentId);

    if (!isUndefined(position)) {
      base += `-P${position}${componentIcons[position % componentIcons.length]}`
    }

    if (options.eventId !== false) {
      const eventId = isUndefined(options.eventId) ? KeyEventCounter.getId() : options.eventId;

      base += `-E${eventId}${eventIcons[eventId % eventIcons.length]}`;
    }

    return `${base}):`;
  }

  logIgnoredKeyEvent(event, key, eventType, reason, componentId) {
    this.logIgnoredEvent(describeKeyEvent(event, key, eventType), reason, componentId);
  }

  logIgnoredEvent(eventDescription, reason, componentId) {
    this.debug(
      this.keyEventPrefix(componentId),
      `Ignored ${eventDescription} because ${reason}.`
    );
  }

  logAlreadySimulatedEvent(event, key, eventType, componentId) {
    this.logIgnoredKeyEvent(event, key, eventType, 'it was not expected, and has already been simulated', componentId);
  }
}

export default FocusOnlyLogger;
