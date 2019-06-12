/**
 * Lowercased string representing a particular keyboard key
 * @typedef {String} NormalizedKeyName
 */

import reactsGetEventKey from '../../vendor/react-dom/reactsGetEventKey';

/**
 * Returns normalized name of key
 * @param {KeyboardEvent} event - Event containing the key name and state
 * @returns {NormalizedKeyName} Normalized name of the key
 */
function getKeyName(event) {
  const keyName = function(){
    if (event.nativeEvent) {
      return event.key;
    } else {
      return reactsGetEventKey(event);
    }
  }();

  if (keyName === '+') {
    return 'plus';
  } else {
    return keyName;
  }
}

export default getKeyName;
