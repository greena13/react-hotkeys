import AbstractKeyEventSimulator from './AbstractKeyEventSimulator';
import Configuration from '../config/Configuration';
import KeyEventType from '../../const/KeyEventType';

class GlobalKeyEventSimulator extends AbstractKeyEventSimulator{
  handleKeyPressSimulation(options){
    this._handleEventSimulation('handleKeyPress', {eventType: KeyEventType.keypress, ...options});
  }

  handleKeyUpSimulation(options){
    this._handleEventSimulation('handleKeyUp', {eventType: KeyEventType.keyup, ...options});
  }

  _handleEventSimulation(handlerName, {event, eventType, key}) {
    if (this._shouldSimulate(eventType, key) && Configuration.option('simulateMissingKeyPressEvents')) {
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
