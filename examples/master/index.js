import {HotKeys} from 'react-hotkeys';
import React from 'react';
import ReactDOM from 'react-dom';

import Node from './Node';
import HOCWrappedNode from './HOCWrappedNode';

const keyMap = {
  'delete': ['del', {sequence: 'backspace', action: 'keyup'}],
  'expand': 'alt+up',
  'contract': 'alt+down',
  'konami': 'up up down down left right left right b a enter',
  'commandDown': {sequence: 'command', action: 'keydown'},
  'commandUp': {sequence: 'command', action: 'keyup'},
};

class App extends React.Component {
  state = {
    konamiTime: false,
  }

  onKonami() {
    this.setState({konamiTime: true});
  }

  commandDown(e) {
    console.log(e);
    console.log('command down');
  }

  commandUp() {
    console.log('command up');
  }

  render() {
    const {konamiTime} = this.state;
    const handlers = {
      'konami': this.onKonami.bind(this),
      'commandDown': this.commandDown.bind(this),
      'commandUp': this.commandUp.bind(this),
    };
    const className = konamiTime ? 'viewport konamiTime' : 'viewport';

    return (
        <div className="app">
            <div className="tips">
                <ul>
                    <li>Select a node and move it with your arrow keys</li>
                    <li>Expand or contract a node with `alt+up` or `alt+down` respectively</li>
                    <li>Delete a node with `delete` or `backspace`</li>
                    <li>How about the konami code? `up up down down left right left right b a enter`</li>
                    <li>Want to get started? <a href="https://github.com/greena13/react-hotkeys/blob/master/README.md">Read the guide.</a></li>
                </ul>
            </div>
            <HotKeys keyMap={keyMap} handlers={handlers} className={className}>
                <HOCWrappedNode />
                {Array.apply(null, new Array(10)).map((e, i) => <Node key={i} />)}
            </HotKeys>
        </div>
    );
  }
}

export function render(renderTo) {
  ReactDOM.render(<App />, renderTo);
}

export function cleanup(cleanFrom) {
  ReactDOM.unmountComponentAtNode(cleanFrom);
}
