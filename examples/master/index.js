import {FocusTrap, HotKeys, HotKeyMapMixin} from '../../lib';
import React from 'react';

const keyMap = {
  'buildUp': 'up',
  'buildDown': 'down'
};

const App = React.createClass({
  
  mixins: [HotKeyMapMixin(keyMap)],

  render() {
    const handlers = {
      'buildUp': () => console.log('Build up! (root)'),
      'buildDown': () => console.log('Build down! (root)')
    };
    
    return (
      <HotKeys handlers={handlers}>
        <Viewport />
      </HotKeys>
    );
  }

});

const Viewport = React.createClass({
  
  render() {
    return (
      <div>
        <Node id="1" />
        <Node id="2" />
        <Node id="3" />
      </div>
    );
  }
  
});

const Node = React.createClass({

  render() {
    const handlers = {
      'buildUp': () => console.log(`Build up! (${this.props.id})`),
      'buildDown': () => console.log(`Build down! (${this.props.id})`)
    };
    
    return (
      <HotKeys handlers={handlers}>
        <input type="text" />
      </HotKeys>
    );
  }

});

React.render(<App />, document.body);