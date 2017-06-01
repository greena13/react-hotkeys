import { Component, HTMLProps } from 'react';

interface HotKeysProps extends HTMLProps<HotKeys> {
  keyMap?: Object;
  handlers?: Object;
  focused?: boolean;
  attach?: any;
  component?: any;
}

export class HotKeys extends Component<HotKeysProps, {}> { }
