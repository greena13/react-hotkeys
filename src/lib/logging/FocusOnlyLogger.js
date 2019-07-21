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

    if (options.eventId !== false) {
      const eventId = isUndefined(options.eventId) ? KeyEventCounter.getId() : options.eventId;

      base += `E${eventId}${eventIcons[eventId % eventIcons.length]}-`;
    }

    base += `C${componentId}${componentIcons[componentId % componentIcons.length]}`;

    const position = this._eventStrategy.getComponentPosition(componentId);

    if (!isUndefined(position)) {
      base += `-P${position}${componentIcons[position % componentIcons.length]}:`
    }

    return `${base})`;
  }

  logIgnoredKeyEvent(event, componentId, key, eventType, reason) {
    this.logIgnoredEvent(componentId, describeKeyEvent(event, key, eventType), reason);
  }

  logIgnoredEvent(componentId, eventDescription, reason) {
    this.debug(
      this.keyEventPrefix(componentId),
      `Ignored ${eventDescription} because ${reason}.`
    );
  }

  logAlreadySimulatedEvent(componentId, event, key, eventType) {
    this.logIgnoredKeyEvent(
      componentId, event, key, eventType,
      'it was not expected, and has already been simulated'
    );
  }
}

export default FocusOnlyLogger;
