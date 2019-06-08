import KeysWithKeyupHiddenByCmd from '../../const/KeysWithKeyupHiddenByCmd';
import hasKey from '../../utils/object/hasKey';

/**
 * Whether the specified key, when pressed down with the cmd key, never triggers a keyup
 * event in the browser
 * @param {NormalizedKeyName} keyName Name of the key
 * @returns {Boolean} Whether the key has its keyup event hidden by cmd
 */
function keyupIsHiddenByCmd(keyName) {
  return keyName.length === 1 || hasKey(KeysWithKeyupHiddenByCmd, keyName);
}

export default keyupIsHiddenByCmd;
