import { HotKeys } from 'react-hotkeys';
import React from 'react';
import rand from 'lodash.random';

/* eslint-disable react/no-multi-comp */

const DEFAULT_NODE_SIZE = 100;
const SIZE_INCREMENT = 5;
const POS_INCREMENT = 5;

class Node extends React.Component {
  constructor() {
    super();

    this.state = {
      pos: [
        rand(0, window.innerWidth - DEFAULT_NODE_SIZE),
        rand(0, window.innerHeight - DEFAULT_NODE_SIZE),
      ],
      size: DEFAULT_NODE_SIZE,
      deleted: false,
    };
  }

  move(x = 0, y = 0) {
    this.setState(({pos}) => ({pos: [pos[0] + (x * POS_INCREMENT), pos[1] + (y * POS_INCREMENT)]}));
  }

  resize(expansion = 0) {
    this.setState((state) => ({size: state.size + (expansion * SIZE_INCREMENT)}));
  }

  requestDelete() {
    this.setState({deleted: true});
  }

  render() {
    const handlers = {
      MOVE_UP: this.move.bind(this, 0, -1),
      MOVE_DOWN: this.move.bind(this, 0, 1),
      MOVE_LEFT: this.move.bind(this, -1, 0),
      MOVE_RIGHT: this.move.bind(this, 1, 0),
      DELETE: this.requestDelete.bind(this),
      EXPAND: this.resize.bind(this, 1),
      CONTRACT: this.resize.bind(this, -1),
    };

    const {size, pos, deleted} = this.state;
    const [x, y] = pos;

    const style = {
      width: size,
      height: size,
      left: x,
      top: y,
      opacity: deleted ? 0.2 : 1,
    };

    // tabIndex is explicitly set here so we can use the tab key to move between nodes
    // - by default we would set it to -1 so it can only be directly clicked (& tapped?)
    //   or focused programmatically
    return (
      <HotKeys
        handlers={handlers}
      >
       <div
        style={style}
        className="node"
        tabIndex="0"
       >
         Node
       </div>
      </HotKeys>
    );
  }
}

export default Node;
