import * as React from 'react';

type MouseTrapKeySequence = string | Array<string>;

type KeyEventName = 'keyup' | 'keydown' | 'keypress';

interface KeyMapOptions {
  sequence: MouseTrapKeySequence;
  action: KeyEventName;
}

type KeySequence = MouseTrapKeySequence | KeyMapOptions | Array<MouseTrapKeySequence> | Array<KeyMapOptions>;

type KeyMap = { [key: string]: KeySequence };

interface HotKeysEnabled extends React.Component<HotKeysProps, {}> { }

interface HotKeysEnabledProps extends React.HTMLAttributes<HotKeys> {
  /**
   * A map from action names to Mousetrap or Browser key sequences
   */
  keyMap?: KeyMap;

  /**
   * A map from action names to event handler functions
   */
  handlers?: { [key: string]: (keyEvent?: KeyboardEvent) => void };

  /**
   * Function to call when this component gains focus in the browser
   */
  onFocus?: () => void;

  /**
   * Function to call when this component loses focus in the browser
   */
  onBlur?: () => void;

  /**
   * Whether the keyMap or handlers are permitted to change after the
   * component mounts. If false, changes to the keyMap and handlers
   * props will be ignored
   */
  allowChanges?: boolean;
}

interface HotKeysProps extends HotKeysEnabledProps {
  /**
   * The React component that should be used in the DOM to wrap the FocusTrap's
   * children and have the internal key listeners bound to
   */
  component?: React.ComponentClass | string;
}

/**
 * Component that renders its children within a "focus trap" component that
 * binds to key event listeners and calls specified event handler functions
 * based on which key (or key combination) is activated.
 */
export class HotKeys extends React.Component<HotKeysProps, {}> { }

export class GlobalHotKeys extends React.Component<HotKeysEnabled, {}> { }

/**
 * Wraps a React component in a HotKeysEnabled component, which passes down the
 * callbacks and options necessary for React Hotkeys to work as a single prop value,
 * hotkeys. These must be unwrapped and applied to a DOM-mountable element within
 * the wrapped component (e.g. div, span, input, etc) in order for the key events
 * to be recorded.
 */
export declare function withHotKeys(React.Component, HotKeysEnabledProps): HotKeysEnabled;

export declare function deprecatedWithHotKeys(keyMap: { [key: string]: KeySequence }): HotKeys;
