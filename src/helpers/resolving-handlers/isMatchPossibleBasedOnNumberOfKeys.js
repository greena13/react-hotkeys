import Configuration from '../../lib/Configuration';

/**
 * Whether combinationMatcher could possible match currentKeyState based on the
 * number of keys in each. Used as a preliminary check, before the more expensive
 * work of comparing the individual keys in each.
 * @param {KeyCombinationRecord} keyState The current state of keys involved
 *        in the key event.
 * @param {ActionConfiguration} combinationMatcher Matcher to compare to the
 *        key state
 * @param {boolean} keyupIsHiddenByCmd Whether current combination involves the
 *        cmd key and keys for which it hides their keyup event
 * @returns {boolean} True if the key state has the right amount of keys for a
 *        match with combinationMatcher to be possible
 * @private
 */
function isMatchPossibleBasedOnNumberOfKeys(keyState, combinationMatcher, keyupIsHiddenByCmd) {
  const keyStateKeysNo = Object.keys(keyState.keys).length;
  const combinationKeysNo = Object.keys(combinationMatcher.keyDictionary).length;

  if (keyupIsHiddenByCmd || Configuration.option('allowCombinationSubmatches')) {
    return keyStateKeysNo >= combinationKeysNo;
  } else {
    /**
     * If submatches are not allow, the number of keys in the key state and the
     * number of keys in the combination we are attempting to match, must be
     * exactly the same
     */
    return keyStateKeysNo === combinationKeysNo;
  }
}

export default isMatchPossibleBasedOnNumberOfKeys;
