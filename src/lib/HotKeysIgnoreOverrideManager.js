import KeyEventManager from './KeyEventManager';
import isEmpty from '../utils/collection/isEmpty';
import hasKey from '../utils/object/hasKey';
import arrayFrom from '../utils/array/arrayFrom';
import standardizeKeyName from '../helpers/parsing-key-maps/standardizeKeyName';
import isValidKey, { InvalidKeyNameError } from '../helpers/parsing-key-maps/isValidKey';
import dictionaryFrom from '../utils/object/dictionaryFrom';
import resolveAltShiftedAlias from '../helpers/resolving-handlers/resolveAltShiftedAlias';
import resolveUnaltShiftedAlias from '../helpers/resolving-handlers/resolveUnaltShiftedAlias';
import resolveShiftedAlias from '../helpers/resolving-handlers/resolveShiftedAlias';
import resolveUnshiftedAlias from '../helpers/resolving-handlers/resolveUnshiftedAlias';
import resolveAltedAlias from '../helpers/resolving-handlers/resolveAltedAlias';
import resolveUnaltedAlias from '../helpers/resolving-handlers/resolveUnaltedAlias';

class HotKeysIgnoreOverrideManager {
  constructor(eventManagerMethod) {
    this._handleKeyEvent = this._handleKeyEvent.bind(this);
    this._eventManagerMethod = eventManagerMethod;
  }

  getComponentProps(accessor) {
    return {
      onKeyDown: this._handleKeyEvent,
      onKeyPress: this._handleKeyEvent,
      onKeyUp: this._handleKeyEvent,
      onFocus: () => this._reloadDictionaries(accessor())
    };
  }

  _reloadDictionaries({only, except}) {
    this._onlyDict = keyDictionary(only);
    this._exceptDict = keyDictionary(except);
  }

  _handleKeyEvent(event) {
    if (this._shouldIgnoreEvent(event)) {
      KeyEventManager.getInstance()[this._eventManagerMethod](event);
    }
  }

  _shouldIgnoreEvent({key}) {
    if (isEmpty(this._onlyDict)) {
      if (isEmpty(this._exceptDict)) {
        return true;
      } else {
        return !hasKey(this._exceptDict,key);
      }
    } else {
      if (isEmpty(this._exceptDict)) {
        return hasKey(this._onlyDict,key);
      } else {
        return hasKey(this._onlyDict,key) && !hasKey(this._exceptDict,key);
      }
    }
  }
}

function keyDictionary(list) {
  return arrayFrom(list).reduce((memo, keyName) => {
    let finalKeyName = standardizeKeyName(keyName);

    if (!isValidKey(finalKeyName)) {
      throw new InvalidKeyNameError(keyName);
    }

    dictionaryFrom([
      resolveAltShiftedAlias,
      resolveUnaltShiftedAlias,
      resolveShiftedAlias,
      resolveUnshiftedAlias,
      resolveAltedAlias,
      resolveUnaltedAlias
    ], true, (func) => func(finalKeyName), memo);

    return memo;
  }, {});
}

export default HotKeysIgnoreOverrideManager;
