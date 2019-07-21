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

  logComponentOptions(componentId, options = { }) {
    this.verbose(
      this.nonKeyEventPrefix(componentId, options),
      'New component options:\n',
      printComponent(this._eventStrategy.getComponent(componentId))
    );
  }

  logKeyHistory() {
    this.verbose(
      this.keyEventPrefix(),
      `Key history: ${printComponent(this._eventStrategy.getKeyHistory().toJSON())}.`
    );
  }
}

export default EventStrategyLogger;
