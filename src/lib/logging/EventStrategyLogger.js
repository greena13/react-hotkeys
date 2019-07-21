import Logger from './Logger';
import printComponent from '../../helpers/logging/printComponent';

class EventStrategyLogger extends Logger {
  constructor(logLevel, eventStrategy) {
    super(logLevel);

    this._eventStrategy = eventStrategy;
  }

  nonKeyEventPrefix(componentId, options = {}) {
    this.keyEventPrefix(componentId, { ...options, eventId: false});
  }

  logComponentOptions(componentId, componentOptions) {
    this.verbose(
      this.nonKeyEventPrefix(componentId),
      'New component options:\n',
      printComponent(componentOptions)
    );
  }

  logKeyHistory(keyHistory) {
    this.verbose(
      this.keyEventPrefix(),
      `Key history: ${printComponent(keyHistory.toJSON())}.`
    );
  }
}

export default EventStrategyLogger;
