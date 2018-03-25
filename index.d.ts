import * as React from '@types/react';

type MouseTrapKeySequence = string | Array<string>;

type KeyEventName = 'keyup' | 'keydown' | 'keypress';

interface KeyMapOptions {
  sequence: MouseTrapKeySequence;
  action: KeyEventName = 'keypress';
}

interface FocusTrapProps extends React.HTMLProps<FocusTrap> {
  /**
   * The React component that should be used in the DOM to wrap the FocusTrap's
   * children and have the internal key listeners bound to
   */
  component?: React.Component | string;
}

interface HotKeysProps extends FocusTrapProps<HotKeys> {
  /**
   * A mapping of action names to key combinations
   */
  keyMap: { [key: string]: MouseTrapKeySequence | KeyMapOptions | Array<MouseTrapKeySequence> };

  /**
   * A mapping of action names to handler functions
   */
  handlers: { [key: string]: (keyEvent: KeyboardEvent) => void };

  /**
   * Whether the component should behave as if it current has browser focus
   * event when it doesn't
   */
  focused?: boolean = false;

  /**
   * The object that the internal key listeners should be bound to
   */
  attach?: React.Component | Element ;
}

/**
 * Component that renders its children within a "focus trap" component that
 * binds to key event listeners and calls specified event handler functions
 * based on which key (or key combination) is activated.
 */
export class HotKeys extends React.Component<HotKeysProps, {}> { }
