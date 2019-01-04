import { HotKeys, GlobalHotKeys } from 'react-hotkeys';
import React, { Fragment } from 'react';

import Node from './Node';
import HOCWrappedNode from './HOCWrappedNode';

const keyMap = {
  DELETE: { sequence: 'backspace', action: 'keyup'},
  EXPAND: 'alt+up',
  CONTRACT: 'alt+down',
  MOVE_UP: 'up',
  MOVE_DOWN: 'down',
  MOVE_LEFT: 'left',
  MOVE_RIGHT: 'right'
};

const globalKeyMap = {
  KONAMI: 'up up down down left right left right b a enter',
  LOG_DOWN: {sequence: 'command', action: 'keydown'},
  LOG_UP: {sequence: 'command', action: 'keyup'}
};

class App extends React.Component {
  static logCommandKeyDown() {
    console.log('command down');
  }

  static logCommandKeyUp() {
    console.log('command up');
  }

  constructor(props, context) {
    super(props, context);

    this.onKonami = this.onKonami.bind(this);

    this.state = {
      konamiTime: false
    };
  }

  onKonami() {
    this.setState({konamiTime: true});
  }

  render() {
    const {konamiTime} = this.state;

    const globalHandlers = {
      KONAMI: this.onKonami,
      LOG_DOWN: this.constructor.logCommandKeyDown,
      LOG_UP: this.constructor.logCommandKeyUp,
    };

    const className = konamiTime ? 'viewport konamiTime' : 'viewport';

    return (
      <Fragment>
        <GlobalHotKeys
          keyMap={globalKeyMap}
          handlers={globalHandlers}
          global
        />

        <HotKeys keyMap={keyMap}>
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

            <div className={className}>
              <HOCWrappedNode />

              <div>
                {Array.apply(null, new Array(10)).map((e, i) => <Node key={i} />)}
              </div>
            </div>
          </div>
        </HotKeys>
      </Fragment>
    );
  }
}

export default App;
