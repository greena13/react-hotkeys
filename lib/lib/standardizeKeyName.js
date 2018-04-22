import MousetrapToReactKeyNamesDictionary from '../const/MousetrapToReactKeyNamesDictionary';

function standardizeKeyName(keyName) {
  return MousetrapToReactKeyNamesDictionary[keyName.toLowerCase()] || (keyName.match(/^f\d+$/) ? keyName.toUpperCase() : keyName);
}

export default standardizeKeyName;
