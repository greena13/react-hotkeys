import AbstractKeyEventSimulator from './AbstractKeyEventSimulator';
import Configuration from '../config/Configuration';
import KeyEventCounter from '../listening/KeyEventCounter';
import hasKeyPressEvent from '../../helpers/resolving-handlers/hasKeyPressEvent';
import KeyEventType from '../../const/KeyEventType';
import keyupIsHiddenByCmd from '../../helpers/resolving-handlers/keyupIsHiddenByCmd';

class FocusOnlyKeyEventSimulator extends AbstractKeyEventSimulator{
  handleKeyPressSimulation({event, key, focusTreeId, componentId, options}){
    this._handleEventSimulation(
      'keypressEventsToSimulate',
      'simulatePendingKeyPressEvents',
      {event, eventType: KeyEventType.keypress, key, focusTreeId, componentId, options}
    );
  }

  handleKeyUpSimulation({event, key, focusTreeId, componentId, options}){
    this._handleEventSimulation(
      'keyupEventsToSimulate',
      'simulatePendingKeyUpEvents',
      {event, eventType: KeyEventType.keyup, key, focusTreeId, componentId, options}
    );
  }

  _handleEventSimulation(listName, handlerName, {event, eventType, key, focusTreeId, componentId, options}) {
    if (this._shouldSimulate(eventType, key) && Configuration.option('simulateMissingKeyPressEvents')) {
      /**
       * If a key does not have a keypress event, we save the details of the keydown
       * event to simulate the keypress event, as the keydown event bubbles through
       * the last focus-only HotKeysComponent
       */
      const _event = this.cloneAndMergeEvent(event, {key, simulated: true });

      this[listName].push({
        event: _event, focusTreeId, componentId, options
      });
    }

    if (this._keyEventStrategy.componentList.isRoot(componentId) || this._keyEventStrategy.eventPropagator.isStopped()) {
      if (this._shouldSimulateEventsImmediately()) {
        this._keyEventStrategy[handlerName]();
      }
      /**
       * else, we wait for keydown event to propagate through global strategy
       * before we simulate the keypress
       */
    }
  }

  simulatePendingKeyPressEvents() {
    this._simulatePendingKeyEvents('keypressEventsToSimulate', 'handleKeyPress');
  }

  simulatePendingKeyUpEvents() {
    this._simulatePendingKeyEvents('keyupEventsToSimulate', 'handleKeyUp');
  }

  _simulatePendingKeyEvents(listName, handlerName) {
    if (this[listName].length > 0) {
      KeyEventCounter.incrementId();
    }

    this[listName].forEach(({ event, focusTreeId, componentId, options }) => {
      this._keyEventStrategy[handlerName](event, focusTreeId, componentId, options);
    });

    this[listName] = [];
  }

  _shouldSimulate(eventType, keyName) {
    const keyHasNativeKeyPress = hasKeyPressEvent(keyName);
    const currentCombination = this._keyEventStrategy.getCurrentCombination();

    if (eventType === KeyEventType.keypress) {
      return !keyHasNativeKeyPress || (keyHasNativeKeyPress && currentCombination.isKeyStillPressed('Meta'));
    } else if (eventType === KeyEventType.keyup) {
      return (keyupIsHiddenByCmd(keyName) && currentCombination.isKeyReleased('Meta'));
    }

    return false
  }

  _shouldSimulateEventsImmediately() {
    return this._keyEventStrategy.shouldSimulateEventsImmediately();
  }

}

export default FocusOnlyKeyEventSimulator;
