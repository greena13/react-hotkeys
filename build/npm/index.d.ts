import { Component, Props } from 'react';

interface HotKeysProps extends Props<HotKeys> {
  onFocus?: Function;
  onBlur?: Function;
  keyMap?: Object;
  handlers?: Object;
  focused?: boolean;
  attach?: any;
}

export class HotKeys extends Component<HotKeysProps, {}> { }
