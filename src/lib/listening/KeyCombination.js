import KeyEventSequenceIndex from '../../const/KeyEventSequenceIndex';
import KeyEventType from '../../const/KeyEventType';
import KeyCombinationSerializer from '../shared/KeyCombinationSerializer';
import resolveKeyAlias from '../../helpers/resolving-handlers/resolveKeyAlias';
import applicableAliasFunctions from '../../helpers/resolving-handlers/applicableAliasFunctions';
import KeyEventStateArrayManager from '../shared/KeyEventStateArrayManager';
import isEmpty from '../../utils/collection/isEmpty';
import KeyEventState from '../../const/KeyEventState';
import lazyLoadAttribute from '../../utils/object/lazyLoadAttribute';
import ModifierFlagsDictionary from '../../const/ModifierFlagsDictionary';
import stateFromEvent from '../../helpers/parsing-key-maps/stateFromEvent';
import Configuration from "../config/Configuration"

/**
 * Record of one or more keys pressed together, in a combination
 * @class
 */
class KeyCombination {
  /**
   * Creates a new KeyCombination instance
   * @param {Object.<ReactKeyName, Array.<KeyEventState[]>>} keys Dictionary
   *        of keys
   * @returns {KeyCombination}
   */
  constructor(keys = {}) {
    this.keyStates = keys;

    /**
     * Whether combination includes key up
     * @type {boolean}
     */
    this.isEnding = false;

    this._keyAliases = undefined;
    this._ids = undefined;
  }

  /********************************************************************************
   * Getters
   *********************************************************************************/

  /**
   * List of ids (serialized representations) for the keys involved in the combination
   * @type {KeySequence[]} List of combination ids
   */
  get ids() {
    return lazyLoadAttribute(this, '_ids', () => KeyCombinationSerializer.serialize(this.keyStates));
  }

  /**
   * Dictionary mapping keys to their acceptable aliases. This includes "shifted" or
   * "alted" key characters.
   * @returns {Object.<ReactKeyName, ReactKeyName[]>}
   */
  get keyAliases() {
    return lazyLoadAttribute(this, '_keyAliases', () => buildKeyAliases(this.keyStates));
  }

  /**
   * A normalized version of the key, achieved by comparing it to the list of known
   * aliases for the keys in the combination
   * @param {ReactKeyName} keyName Name of the key to normalize
   * @returns {ReactKeyName} Normalized key name
   */
  getNormalizedKeyName(keyName) {
    const keyState = this.keyStates[keyName];

    if (keyState) {
      return keyName;
    } else {
      const keyAlias = this.keyAliases[keyName];

      if (keyAlias) {
        return keyAlias;
      } else {
        return keyName;
      }
    }
  }

  /********************************************************************************
   * Query attributes of entire combination
   *********************************************************************************/

  /**
   * Whether there are any keys in the current combination still being pressed
   * @returns {boolean} True if all keys in the current combination are released
   */
  hasEnded() {
    return isEmpty(this.keysStillPressedDict());
  }

  /********************************************************************************
   * Adding & modifying key states
   *********************************************************************************/

  /**
   * Add a new key to the combination (starting with a state of keydown)
   * @param {ReactKeyName} keyName Name of key
   * @param {KeyEventState} keyEventState State key is in
   * @returns {void}
   */
  addKey(keyName, keyEventState) {
    this._setKeyState(keyName, [
      KeyEventStateArrayManager.newRecord(),
      KeyEventStateArrayManager.newRecord(KeyEventType.keydown, keyEventState)
    ]);
  }

  /**
   * Adds a key event to the current key combination (as opposed to starting a new
   * keyboard combination).
   * @param {ReactKeyName} keyName - Name of the key to add to the current combination
   * @param {KeyEventType} recordIndex - Index in record to set to true
   * @param {KeyEventState} keyEventState The state to set the key event to
   */
  setKeyState(keyName, recordIndex, keyEventState) {
    const existingRecord = this._getKeyState(keyName);

    if (this.isKeyIncluded(keyName)) {
      const previous = KeyEventStateArrayManager.clone(existingRecord[1]);
      const current = KeyEventStateArrayManager.clone(previous);

      KeyEventStateArrayManager.setBit(current, recordIndex, keyEventState);

      this._setKeyState(keyName, [previous, current]);
    } else {
      this.addKey(keyName, keyEventState);
    }

    if (recordIndex === KeyEventType.keyup) {
      this.isEnding = true;
    }
  }

  /********************************************************************************
   * Iteration and subsets
   *********************************************************************************/

  /**
   * Returns a new KeyCombination without the keys that have been
   * released (had the keyup event recorded). Essentially, the keys that are
   * currently still pressed down at the time a key event is being handled.
   * @returns {KeyCombination} New KeyCombination with all of the
   *        keys with keyup events omitted
   */
  keysStillPressedDict() {
    return this.keys.reduce((memo, keyName) => {
      if (this.isKeyStillPressed(keyName)) {
        memo[keyName] = this._getKeyState(keyName);
      }

      return memo;
    }, {});
  }

  /********************************************************************************
   * Query individual keys
   *********************************************************************************/

  /**
   * Whether key is in the combination
   * @param {ReactKeyName} keyName Name of key
   * @returns {boolean} true if the key is in the combination
   */
  isKeyIncluded(keyName) {
    return !!this._getKeyState(keyName);
  }

  /**
   * Whether key is in the combination and has yet to be released
   * @param {ReactKeyName} keyName Name of key
   * @returns {boolean} true if the key is in the combination and yet to be released
   */
  isKeyStillPressed(keyName) {
    return this.isEventTriggered(keyName, KeyEventType.keypress) &&
      !this.isKeyReleased(keyName);
  }

  /**
   * Whether key is in the combination and been released
   * @param {ReactKeyName} keyName Name of key
   * @returns {boolean} true if the key is in the combination and has been released
   */
  isKeyReleased(keyName) {
    return this.isEventTriggered(keyName, KeyEventType.keyup);
  }

  /**
   * Whether an event has been recorded for a key yet
   * @param {ReactKeyName} keyName Name of the key
   * @param {KeyEventType} keyEventType Index of the event type
   * @returns {boolean} true if the event has been recorded for the key
   */
  isEventTriggered(keyName, keyEventType){
    return this._getKeyStateType(keyName, KeyEventSequenceIndex.current, keyEventType)
  }

  /**
   * Whether an event has been previously recorded for a key (the second most recent
   * event to occur for the key)
   * @param {ReactKeyName} keyName Name of the key
   * @param {KeyEventType} keyEventType Index of the event type
   * @returns {boolean} true if the event has been previously recorded for the key
   */
  wasEventPreviouslyTriggered(keyName, keyEventType){
    return this._getKeyStateType(keyName, KeyEventSequenceIndex.previous, keyEventType)
  }

  /**
   * Whether a keypress event is currently being simulated
   * @param {ReactKeyName} keyName Name of the key
   * @returns {boolean} true if the keypress event is currently being simulated for the
   *        key
   */
  isKeyPressSimulated(keyName) {
    return this.isEventTriggered(keyName, KeyEventType.keypress) === KeyEventState.simulated;
  }

  /**
   * Whether a keyup event is currently being simulated
   * @param {ReactKeyName} keyName Name of the key
   * @returns {boolean} true if the keyup event is currently being simulated for the
   *        key
   */
  isKeyUpSimulated(keyName) {
    return this.isEventTriggered(keyName, KeyEventType.keyup) === KeyEventState.simulated;
  }

  /**
   * Synchronises the key combination history to match the modifier key flag attributes
   * on new key events
   * @param {KeyboardEvent|SyntheticKeyboardEvent} event - Event to check the modifier flags for
   * @param {string} key - Name of key that events relates to
   * @param {KeyEventType} keyEventType - The record index of the current
   *        key event type
   */
  resolveModifierFlagDiscrepancies(event, key, keyEventType) {
    /**
     * If a new key event is received with modifier key flags that contradict the
     * key combination history we are maintaining, we can surmise that some keyup events
     * for those modifier keys have been lost (possibly because the window lost focus).
     * We update the key combination to match the modifier flags
     */
    Object.keys(ModifierFlagsDictionary).forEach((modifierKey) => {
      /**
       * When a modifier key is being released (keyup), it sets its own modifier flag
       * to false. (e.g. On the keyup event for Command, the metaKey attribute is false).
       * If this the case, we want to handle it using the main algorithm and skip the
       * reconciliation algorithm.
       */

      const locationPrefix = Configuration.option('_customLocationPrefixesDict')[event.location];
      if (locationPrefix && locationPrefix.length){
        key = key.substring(locationPrefix.length)
      }
      if (key === modifierKey && keyEventType === KeyEventType.keyup) {
        return;
      }

      const modifierStillPressed = this.isKeyStillPressed(modifierKey);

      ModifierFlagsDictionary[modifierKey].forEach((attributeName) => {
        if (event[attributeName] === false && modifierStillPressed) {

          this.setKeyState(
            modifierKey,
            KeyEventType.keyup,
            stateFromEvent(event)
          );
        }
      });
    })
  }

  get keys() {
    return Object.keys(this.keyStates);
  }

  /********************************************************************************
   * Private methods
   *********************************************************************************/

  _getKeyStateType(keyName, keyStage, keyEventType){
    const keyState = this._getKeyState(keyName);

    return keyState && keyState[keyStage][keyEventType];
  }

  _getKeyState(keyName) {
    const keyState = this.keyStates[keyName];

    if (keyState) {
      return keyState;
    } else {
      const keyAlias = this.keyAliases[keyName];

      if (keyAlias) {
        return this.keyStates[keyAlias];
      }
    }
  }

  _setKeyState(keyName, keyState) {
    const keyAlias = this.getNormalizedKeyName(keyName);

    this.keyStates[keyAlias] = keyState;

    delete this._keyAliases;
    delete this._ids;
  }
}

function buildKeyAliases(keyDictionary) {
  return Object.keys(keyDictionary).reduce((memo, keyName) => {
    resolveKeyAlias(keyName).forEach((normalizedKey) => {
      applicableAliasFunctions(keyDictionary).forEach((aliasFunction) => {
        aliasFunction(normalizedKey).forEach((keyAlias) => {
          if (keyAlias !== keyName || keyName !== normalizedKey) {
            memo[keyAlias] = keyName;
          }
        });
      })
    });

    return memo;
  }, {});
}

export default KeyCombination;
