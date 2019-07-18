import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import KeyEventManager from './lib/KeyEventManager';
import arrayFrom from './utils/array/arrayFrom';
import standardizeKeyName from './helpers/parsing-key-maps/standardizeKeyName';
import isValidKey, {InvalidKeyNameError} from './helpers/parsing-key-maps/isValidKey';
import isEmpty from './utils/collection/isEmpty';
import resolveAltShiftedAlias from './helpers/resolving-handlers/resolveAltShiftedAlias';
import resolveUnaltShiftedAlias from './helpers/resolving-handlers/resolveUnaltShiftedAlias';
import resolveShiftedAlias from './helpers/resolving-handlers/resolveShiftedAlias';
import resolveUnshiftedAlias from './helpers/resolving-handlers/resolveUnshiftedAlias';
import resolveAltedAlias from './helpers/resolving-handlers/resolveAltedAlias';
import resolveUnaltedAlias from './helpers/resolving-handlers/resolveUnaltedAlias';
import hasKey from './utils/object/hasKey';
import dictionaryFrom from './utils/object/dictionaryFrom';

/**
 * Wraps a React component in a HotKeysIgnoreOverride component, which passes down the
 * callbacks and options necessary for React Hotkeys to work as a single prop value,
 * hotkeys. These must be unwrapped and applied to a DOM-mountable element within
 * the wrapped component (e.g. div, span, input, etc) in order for the key events
 * to be recorded.
 *
 * @param {React.ComponentClass} Component - Component class to wrap
 * @param {Object} hotKeysIgnoreOptions - Options that become the wrapping component's
 *                 default prop values
 * @param {string} eventManagerMethod - Name of EventManager method to use to handle a
 *        key event
 * @returns {React.ComponentClass} Wrapped component that is passed all of the React
 * hotkeys props in a single value, hotkeys.
 */
function withHotKeysIgnoreOverride(Component, hotKeysIgnoreOptions = { only: [], except: [] }, eventManagerMethod) {
  /**
   * A component that causes React Hotkeys to ignore the results of
   * Configuration.ignoreEventCondition and instead either force the event to be
   * ignored or observed. By default, this is all key events, but you can use
   * the only prop to provide a whitelist, or the except prop to pass a blacklist.
   * @class
   */
  return class HotKeysIgnoreOverride extends PureComponent {
    static propTypes = {
      /**
       * The whitelist of keys that keyevents should be ignored. i.e. if you place
       * a key in this list, all events related to it will be ignored by react hotkeys
       */
      only: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.arrayOf(PropTypes.string)
      ]),

      /**
       * The blacklist of keys that keyevents should be not ignored. i.e. if you place
       * a key in this list, all events related to it will be still be observed by react
       * hotkeys
       */
      except: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.arrayOf(PropTypes.string)
      ])
    };

    static defaultProps = hotKeysIgnoreOptions;

    constructor(props) {
      super(props);

      this._handleKeyEvent = this._handleKeyEvent.bind(this);
      this._reloadDictionaries = this._reloadDictionaries.bind(this);
    }

    render() {
      const {
        // Props used by HotKeysIgnoreOverride
        only, except,

        ...props
      } = this.props;

      const hotKeys = {
        onKeyDown: this._handleKeyEvent,
        onKeyPress: this._handleKeyEvent,
        onKeyUp: this._handleKeyEvent,
        onFocus: this._reloadDictionaries
      };

      return (
        <Component hotKeys={ hotKeys } {...props } />
      )
    }

    _reloadDictionaries() {
      const {only, except} = this.props;

      this._onlyDict = keyDictionary(only);
      this._exceptDict = keyDictionary(except);
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

    _handleKeyEvent(event) {
      if (this._shouldIgnoreEvent(event)) {
        KeyEventManager.getInstance()[eventManagerMethod](event);
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
    ], true, memo, (func) => func(finalKeyName));

    return memo;
  }, {});
}

export default withHotKeysIgnoreOverride;
