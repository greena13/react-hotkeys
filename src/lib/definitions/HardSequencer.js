import KeyCombinationSerializer from '../shared/KeyCombinationSerializer';

class HardSequencer {
  /**
   * Applies hard sequences (handlers attached to actions with names that are valid
   * KeySequenceStrings) that implicitly define a corresponding action name.
   * @param {KeyMap} actionNameToKeyMap - KeyMap specified by HotKeys component
   * @param {HandlersMap} actionMap - HandlersMap specified by HotKeys component
   * @returns {{keyMap: {}, handlers: {}}} Object containing keymap and handlers map
   *        with the hard sequence actions applied
   */
  static apply(actionNameToKeyMap, actionMap) {
    return Object.keys(actionMap).reduce((memo, actionNameOrHardSequence) => {
      const actionNameIsInKeyMap = !!actionNameToKeyMap[actionNameOrHardSequence];

      if (!actionNameIsInKeyMap &&
        KeyCombinationSerializer.isValidKeySerialization(actionNameOrHardSequence)) {

        memo.keyMap[actionNameOrHardSequence] = actionNameOrHardSequence;
      }

      memo.handlers[actionNameOrHardSequence] = actionMap[actionNameOrHardSequence];

      return memo;
    }, {keyMap: {}, handlers: {}});
  }
}

export default HardSequencer;
