import ModifierFlagsDictionary from '../../const/ModifierFlagsDictionary';

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
}

export default AbstractKeyEventSimulator;
