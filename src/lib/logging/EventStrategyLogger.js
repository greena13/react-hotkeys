import Logger from './Logger';
import printComponent from '../../helpers/logging/printComponent';

class EventStrategyLogger extends Logger {
  constructor(logLevel, eventStrategy) {
    super(logLevel);

    this._eventStrategy = eventStrategy;
  }

  nonKeyEventPrefix(componentId, options = {}) {
    return this.keyEventPrefix(componentId, { ...options, eventId: false});
  }

  logComponentOptions(componentId, componentOptions) {
    this.verbose(
      this.nonKeyEventPrefix(componentId),
      'New component options:\n',
      printComponent(componentOptions)
    );
  }

  logKeyHistory(keyHistory, componentId) {
    this.verbose(
      this.keyEventPrefix(componentId),
      `Key history: ${printComponent(keyHistory.toJSON())}.`
    );
  }
}

export default EventStrategyLogger;
