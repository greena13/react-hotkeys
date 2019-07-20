import AbstractKeyEventSimulator from './AbstractKeyEventSimulator';
import Configuration from '../config/Configuration';

class GlobalKeyEventSimulator extends AbstractKeyEventSimulator{
  handleEventSimulation(handlerName, shouldSimulate, {event, key}) {
    if (shouldSimulate && Configuration.option('simulateMissingKeyPressEvents')) {
      /**
       * If a key does not have a keypress event, we simulate one immediately after
       * the keydown event, to keep the behaviour consistent across all keys
       */

      const _event = this.cloneAndMergeEvent(event, {key, simulated: true});
      this._keyEventStrategy[handlerName](_event);
    }
  }
}

export default GlobalKeyEventSimulator;
