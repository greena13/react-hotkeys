/**
 * Lowercased string representing a particular keyboard key
 * @typedef {string} NormalizedKeyName
 */

import reactsGetEventKey from '../../vendor/react-dom/reactsGetEventKey';
import Configuration from '../../lib/config/Configuration';
import hasKey from '../../utils/object/hasKey';

function keyNameFromEvent(event) {
  const customKeyCodes = Configuration.option('customKeyCodes');
  const customLocationPrefixes = Configuration.option('customLocationPrefixes');

  // noinspection JSDeprecatedSymbols
  const keyCode = event.keyCode || event.charCode;

  if (hasKey(customKeyCodes, keyCode)) {
    return customKeyCodes[keyCode];
  }

  const location = event.location;

  let locationPrefix = "";
  if (customLocationPrefixes && hasKey(customLocationPrefixes, location)) {
    locationPrefix = customLocationPrefixes[location]
  }

  if (event.nativeEvent) {
    return locationPrefix + event.key;
  } else {
    return locationPrefix + reactsGetEventKey(event);
  }
}

/**
 * Returns key name from native or React keyboard event
 * @param {SyntheticKeyboardEvent} event - Event containing the key name
 * @returns {NormalizedKeyName} Normalized name of the key
 */
function getKeyName(event) {
  const keyName = keyNameFromEvent(event);

  return keyName === '+' ? 'plus' : keyName
}

export default getKeyName;
