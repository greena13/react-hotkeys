/**
 * Lowercased string representing a particular keyboard key
 * @typedef {String} NormalizedKeyName
 */

import reactsGetEventKey from '../../vendor/react-dom/reactsGetEventKey';
import Configuration from '../../lib/config/Configuration';
import hasKey from '../../utils/object/hasKey';

/**
 * Returns key name from native or React keyboard event
 * @param {KeyboardEvent} event - Event containing the key name
 * @returns {NormalizedKeyName} Normalized name of the key
 */
function getKeyName(event) {
  const keyName = function(){
    const customKeyCodes = Configuration.option('customKeyCodes');
    const keyCode = event.keyCode || event.charCode;

    if (hasKey(customKeyCodes, keyCode)) {
      return customKeyCodes[keyCode];
    }

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
