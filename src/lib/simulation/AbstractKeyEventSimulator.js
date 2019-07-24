import ModifierFlagsDictionary from '../../const/ModifierFlagsDictionary';
import hasKeyPressEvent from '../../helpers/resolving-handlers/hasKeyPressEvent';
import KeyEventType from '../../const/KeyEventType';
import keyupIsHiddenByCmd from '../../helpers/resolving-handlers/keyupIsHiddenByCmd';

class AbstractKeyEventSimulator {
  constructor(keyEventStrategy) {
    this._keyEventStrategy = keyEventStrategy;

    this.clear();
  }

  clear() {
    this.keypressEventsToSimulate = [];
    this.keyupEventsToSimulate = [];
  }

  cloneAndMergeEvent(event, extra) {
    const eventAttributes = Object.keys(ModifierFlagsDictionary).reduce((memo, eventAttribute) => {
      memo[eventAttribute] = event[eventAttribute];

      return memo;
    }, {});

    return { ...eventAttributes, ...extra };
  }

  _shouldSimulate(eventType, keyName) {
    const keyHasNativeKeyPress = hasKeyPressEvent(keyName);
    const currentCombination = this._keyEventStrategy.currentCombination;

    if (eventType === KeyEventType.keypress) {
      return !keyHasNativeKeyPress || (keyHasNativeKeyPress && currentCombination.isKeyStillPressed('Meta'));
    } else if (eventType === KeyEventType.keyup) {
      return (keyupIsHiddenByCmd(keyName) && currentCombination.isKeyReleased('Meta'));
    }

    return false
  }
}

export default AbstractKeyEventSimulator;
