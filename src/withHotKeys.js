import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import backwardsCompatibleContext from './utils/backwardsCompatibleContext';
import ComponentManager from './lib/ComponentManager';

const propTypes = {
  /**
   * A unique key to associate with KeyEventMatchers that allows associating handler
   * functions at a later stage
   * @typedef {string} ActionName
   */

  /**
   * Name of a key event
   * @typedef {'keyup'|'keydown'|'keypress'} KeyEventName
   */

  /**
   * A string or list of strings, that represent a sequence of one or more keys
   * @typedef {String | Array.<String>} MouseTrapKeySequence
   * @see {@link https://craig.is/killing/mice} for support key sequences
   */

  /**
   * Options for the mapping of a key sequence and event
   * @typedef {Object} KeyEventOptions
   * @property {MouseTrapKeySequence} sequence - The key sequence required to satisfy a
   *           KeyEventDescription
   * @property {KeyEventName} action - The keyboard state required to satisfy a
   *           KeyEventDescription
   * @property {string} name - The name of the action, to be displayed to the end user
   * @property {string} description - A description of the action, to be displayed to
   *           the end user
   * @property {string} group - A group the action belongs to, to aid in showing similar
   *           actions to the user
   */

  /**
   * A description of key sequence of one or more key combinations
   * @typedef {MouseTrapKeySequence|KeyEventOptions|Array.<MouseTrapKeySequence>} KeyEventDescription
   */

  /**
   * A mapping from ActionName to KeyEventDescription
   * @typedef {Object.<ActionName, KeyEventDescription>} KeyMap
   */

  /**
   * A map from action names to Mousetrap or Browser key sequences
   * @type {KeyMap}
   */
  keyMap: PropTypes.object,

  /**
   * A map from action names to event handler functions
   * @typedef {Object.<ActionName, Function>} HandlersMap
   */

  /**
   * A map from action names to event handler functions
   * @type {HandlersMap}
   */
  handlers: PropTypes.object,

  /**
   * Function to call when this component gains focus in the browser
   * @type {function}
   */
  onFocus: PropTypes.func,

  /**
   * Function to call when this component loses focus in the browser
   * @type {function}
   */
  onBlur: PropTypes.func,

  /**
   * Whether the keyMap or handlers are permitted to change after the
   * component mounts. If false, changes to the keyMap and handlers
   * props will be ignored
   */
  allowChanges: PropTypes.bool,

  /**
   * Whether this is the root HotKeys node - this enables some special behaviour
   */
  root: PropTypes.bool
};

function provideWithContext(HotKeysEnabled) {
  return backwardsCompatibleContext(HotKeysEnabled, {
    deprecatedAPI: {
      contextTypes: {
        hotKeysParentId: PropTypes.number,
      },
      childContextTypes: {
        hotKeysParentId: PropTypes.number,
      },
    },
    newAPI: {
      contextType: {hotKeysParentId: undefined},
    }
  });
}

/**
 * Wraps a React component in a HotKeysEnabled component, which passes down the
 * callbacks and options necessary for React Hotkeys to work as a single prop value,
 * hotkeys. These must be unwrapped and applied to a DOM-mountable element within
 * the wrapped component (e.g. div, span, input, etc) in order for the key events
 * to be recorded.
 *
 * @param {React.ComponentClass} Component - Component class to wrap
 * @param {Object} hotKeysOptions - Options that become the wrapping component's
 *                 default prop values
 * @returns {React.ComponentClass} Wrapped component that is passed all of the React hotkeys
 * props in a single value, hotkeys.
 */
function withHotKeys(Component, hotKeysOptions = {}) {
  /**
   * Component that listens to key events when one of its children are in focus and
   * selectively triggers actions (that may be handled by handler functions) when a
   * sequence of events matches a list of pre-defined sequences or combinations
   * @class
   */
  class HotKeysEnabled extends PureComponent {
    static propTypes = propTypes;

    constructor(props) {
      super(props);

      this._manager = new ComponentManager(hotKeysOptions, props);

      /**
       * We maintain a separate instance variable to contain context that will be
       * passed down to descendants of this component so we can have a consistent
       * reference to the same object, rather than instantiating a new one on each
       * render, causing unnecessary re-rendering of descendant components that
       * consume the context.
       *
       * @see https://reactjs.org/docs/context.html#caveats
       */
      this._childContext = { hotKeysParentId: this._manager.id };
    }

    componentDidMount() {
      const {hotKeysParentId} = this.context;
      this._manager.addHotKeys(hotKeysParentId);
    }

    componentDidUpdate() {
      this._manager.updateHotKeys(this.props);
    }

    componentWillUnmount(){
      this._manager.removeKeyMap(this.props);
    }

    render() {
      const {keyMap, handlers, allowChanges, root, ...props} = this.props;

      return (
        <Component
          hotKeys={ this._manager.getComponentProps(this.props) }
          { ...props }
        />
      );
    }
  }

  return provideWithContext(HotKeysEnabled);
}

export default withHotKeys;
