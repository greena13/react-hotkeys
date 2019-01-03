import {withHotKeys} from 'react-hotkeys';
import React, {PureComponent, Component} from 'react';

const COLORS = ['green', 'purple', 'orange', 'grey', 'pink'];

const ACTION_KEY_MAP = {
  CHANGE_COLOR: 'alt+c',
};

class Node extends PureComponent {
  render() {
    const {colorNumber} = this.props;

    const style = {
      width: 200,
      height: 60,
      left: 20,
      top: 20,
      opacity: 1,
      background: COLORS[colorNumber],
    };

    return (
      <div tabIndex="0" className="node" style={style} {...this.props.hotKeys}>
        [Alt+C] Change Color
      </div>
    );
  }
}

const WrappedNode = withHotKeys(Node);

class HOCWrappedNode extends Component {
  constructor(props, context) {
    super(props, context);

    this.changeColor = this.changeColor.bind(this);

    this.state = {
      colorNumber: 0
    };
  }

  changeColor() {
    this.setState(({colorNumber}) => ({colorNumber: colorNumber === COLORS.length - 1 ? 0 : colorNumber + 1}));
  }

  render() {
    const handlers = {
      CHANGE_COLOR: this.changeColor
    };

    const {colorNumber} = this.state;

    return (
      <WrappedNode
        keyMap={ACTION_KEY_MAP}
        handlers={ handlers }
        colorNumber={ colorNumber }
      />
    );
  }
}

export default HOCWrappedNode;
