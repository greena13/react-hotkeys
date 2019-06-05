import { HotKeys, GlobalHotKeys, ObserveKeys, getApplicationKeyMap } from 'react-hotkeys';
import React from 'react';

import Node from './Node';
import HOCWrappedNode from './HOCWrappedNode';

const keyMap = {
  DELETE: { name: 'Disable square', sequence: 'backspace', action: 'keyup'},
  EXPAND: { name: 'Expand square area', sequence: 'alt+up' },
  CONTRACT: { name: 'Reduce square area', sequence: 'alt+down' },
  MOVE_UP: { name: 'Move square up', sequence: 'up' },
  MOVE_DOWN: { name: 'Move square down', sequence: 'down' },
  MOVE_LEFT: { name: 'Move square left', sequence: 'left' },
  MOVE_RIGHT: { name: 'Move square right', sequence: 'right' }
};

const globalKeyMap = {
  KONAMI: { name: 'Konami code', sequence: 'up up down down left right left right b a enter' },
  LOG_DOWN: { name: 'Log Cmd Down', sequence: 'command', action: 'keydown'},
  LOG_UP: { name: 'Log Cmd Up', sequence: 'command', action: 'keyup'},
  SHOW_DIALOG: { name: 'Display keyboard shortcuts', sequence: 'shift+?', action: 'keyup' },
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
                  const { sequences, name } = keyMap[actionName];

                  memo.push(
                    <tr key={name || actionName}>
                      <td style={styles.KEYMAP_TABLE_CELL}>
                        { name }
                      </td>
                      <td style={styles.KEYMAP_TABLE_CELL}>
                        { sequences.map(({sequence}) => <span key={sequence}>{sequence}</span>) }
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
