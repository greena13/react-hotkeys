import { Component, Props } from 'react';

interface HotKeysProps extends Props<HotKeys> {
  onFocus?: Function;
  onBlur?: Function;
  keyMap?: {[event: string]: string|string[]};
  handlers?: {[event: string]: Function};
  focused?: boolean;
  attach?: any;
}

export class HotKeys extends Component<HotKeysProps, {}> { }
