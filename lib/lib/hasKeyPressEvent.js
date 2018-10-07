import KeysWithoutPressEventDictionary from '../const/KeysWithoutPressEventDictionary';

function hasKeyPressEvent(key) {
  return !KeysWithoutPressEventDictionary[key];
}

export default hasKeyPressEvent;
