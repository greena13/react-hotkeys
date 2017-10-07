import {HotKeys, HotKeyMapMixin} from 'react-hotkeys';
import React from 'react';
import ReactDOM from 'react-dom';
import rand from 'lodash/random';

const DEFAULT_NODE_SIZE = 100;
const SIZE_INCREMENT = 5;
const POS_INCREMENT = 5;

const keyMap = {
  'delete': ['del', {sequence: 'backspace', action: 'keyup'}],
  'expand': 'alt+up',
  'contract': 'alt+down',
  'konami': 'up up down down left right left right b a enter',
  'commandDown': {sequence: 'command', action: 'keydown'},
  'commandUp': {sequence: 'command', action: 'keyup'}
};

const App = React.createClass({

  mixins: [HotKeyMapMixin(keyMap)],

  onKonami() {
    this.setState({konamiTime: true});
  },

  commandDown() {
    console.log('comm down');
  },

  commandUp() {
    console.log('comm up');
  },

  render() {
    const handlers = {
      'konami': this.onKonami,
      'commandDown': this.commandDown,
      'commandUp': this.commandUp
    };

    return (
      <div className="app">
        <div className="tips">
          <ul>
            <li>Select a node and move it with your arrow keys</li>
            <li>Expand or contract a node with `alt+up` or `alt+down` respectively</li>
            <li>Delete a node with `delete` or `backspace`</li>
            <li>How about the konami code? `up up down down left right left right b a enter`</li>
            <li>Want to get started? <a href="https://github.com/Chrisui/react-hotkeys/blob/master/docs/getting-started.md">Read the guide.</a></li>
          </ul>
        </div>
        <HotKeys handlers={handlers} className={'viewport ' + (this.state && this.state.konamiTime ? 'konamiTime' : '')}>
          {Array.apply(null, new Array(10)).map((e, i) => <Node key={i} />)}
        </HotKeys>
      </div>
    );
  }

});

const Node = React.createClass({

  getInitialState() {
    return {
      pos: [
        rand(0, window.innerWidth - DEFAULT_NODE_SIZE),
        rand(0, window.innerHeight - DEFAULT_NODE_SIZE)
      ],
      size: DEFAULT_NODE_SIZE,
      deleted: false
    };
  },

  move(x = 0, y = 0) {
    this.setState(({pos}) => ({pos: [pos[0] + (x * POS_INCREMENT), pos[1] + (y * POS_INCREMENT)]}));
  },

  resize(expansion = 0) {
    this.setState((state) => ({size: state.size + (expansion * SIZE_INCREMENT)}));
  },

  requestDelete() {
    this.setState({deleted: true});
  },

  render() {
    const handlers = {
      'up': this.move.bind(this, 0, -1),
      'down': this.move.bind(this, 0, 1),
      'left': this.move.bind(this, -1, 0),
      'right': this.move.bind(this, 1, 0),
      'delete': this.requestDelete,
      'expand': this.resize.bind(this, 1),
      'contract': this.resize.bind(this, -1)
    };

    const {size, pos, deleted} = this.state;
    const [x, y] = pos;

    const style = {
      width: size,
      height: size,
      left: x,
      top: y,
      opacity: deleted ? 0.2 : 1
    };

    // tabIndex is explicitly set here so we can use the tab key to move between nodes
    // - by default we would set it to -1 so it can only be directly clicked (& tapped?)
    //   or focused programattically
    return (
      <HotKeys tabIndex="0" handlers={handlers} className="node" style={style}>
        Node
      </HotKeys>
    );
  }

});

export function render(renderTo) {
  ReactDOM.render(<App />, renderTo);
}

export function cleanup(cleanFrom) {
  ReactDOM.unmountComponentAtNode(cleanFrom);
}
