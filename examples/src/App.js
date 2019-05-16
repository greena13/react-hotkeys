import { HotKeys, GlobalHotKeys, ObserveKeys, getApplicationKeyMap } from 'react-hotkeys';
import React from 'react';

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
  LOG_UP: {sequence: 'command', action: 'keyup'},
  SHOW_DIALOG: { sequence: 'shift+?', action: 'keyup' },
};

const styles = {
  DIALOG: {
    width: 600,
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    padding: '0 24',
    backgroundColor: 'white',
    zIndex: 100,
    color: 'rgba(0,0,0,0.87)'
  },
  KEYMAP_TABLE_CELL: {
    padding: 8
  }
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
      konamiTime: false,
      showDialog: false,
      filter: '',
    };
  }

  onKonami() {
    this.setState({konamiTime: true});
  }

  renderDialog() {
    if (this.state.showDialog) {
      const keyMap = getApplicationKeyMap();
      const { filter } = this.state;
      const _filter = filter.toUpperCase();

      return (
        <HotKeys
          keyMap={{CLOSE_DIALOG: 'Escape' }}
          handlers={{ CLOSE_DIALOG: () => this.setState({ showDialog: false })} }
          >

          <div style={styles.DIALOG}>
            <h2>
              Keyboard shortcuts
            </h2>

            <ObserveKeys only={'Escape'}>
              <input
                autoFocus
                onChange={({target: {value}}) => this.setState({ filter: value })}
                value={filter}
                placeholder='Filter'
              />
            </ObserveKeys>

            <table>
              <tbody>
              { Object.keys(keyMap).reduce((memo, actionName) => {
                if (filter.length === 0 || actionName.indexOf(_filter) !== -1) {
                  memo.push(
                    <tr key={actionName}>
                      <td style={styles.KEYMAP_TABLE_CELL}>
                        { actionName.replace('_', ' ') }
                      </td>
                      <td style={styles.KEYMAP_TABLE_CELL}>
                        { keyMap[actionName].map((keySequence) => <span key={keySequence}>{keySequence}</span>) }
                      </td>
                    </tr>
                  )
                }

                return memo;
              }, []) }
              </tbody>
            </table>
          </div>
        </HotKeys>
      );
    }
  }

  render() {
    const {konamiTime} = this.state;

    const globalHandlers = {
      KONAMI: this.onKonami,
      LOG_DOWN: this.constructor.logCommandKeyDown,
      LOG_UP: this.constructor.logCommandKeyUp,
      SHOW_DIALOG: () => this.setState({ showDialog: !this.state.showDialog })
    };

    const className = konamiTime ? 'viewport konamiTime' : 'viewport';

    return (
      <React.StrictMode>
        <GlobalHotKeys
          keyMap={globalKeyMap}
          handlers={globalHandlers}
          global
        />

        { this.renderDialog() }

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
      </React.StrictMode>
    );
  }
}

export default App;
