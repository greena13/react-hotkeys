import React, {PureComponent} from 'react';
import {mount} from 'enzyme';
import {expect} from 'chai';

import withHotKeys from '../lib/withHotKeys';

const ACTION_KEY_MAP = {
  fakeAction1: 'esc',
  fakeAction2: 'down',
};

class ChildComponent extends PureComponent {
  hotKeyHandlers = {
    'fakeAction1': () => {},
    'fakeAction2': () => {},
  }

  render() {
    return (<div />);
  }
}

describe('withHotKeys-wrapped Component', () => {
  const WrappedComponent = withHotKeys(ACTION_KEY_MAP)(ChildComponent);

  it('includes HotKeysWrapper/HotKeys/FocusTrap', () => {
    const mountedRootComponent = mount(<WrappedComponent />);

    expect(mountedRootComponent.find('HotKeysWrapper')).to.have.length(1);
    expect(mountedRootComponent.find('HotKeys')).to.have.length(1);
    expect(mountedRootComponent.find('FocusTrap')).to.have.length(1);
  });

  it('renders HotKeys component with keyMap and handlers as props and keyMap and handlers have the same keys', () => {
    const mountedRootComponent = mount(<WrappedComponent />);
    const hotKeysWrapper = mountedRootComponent.find('HotKeys');

    expect(hotKeysWrapper).to.have.length(1);
    expect(hotKeysWrapper.find({keyMap: ACTION_KEY_MAP})).to.have.length(1);
    expect(hotKeysWrapper.find({handlers: {}})).to.have.length(1);

    const keyMapKeys = Object.keys(hotKeysWrapper.props().keyMap);
    const handlersKeys = Object.keys(hotKeysWrapper.props().handlers);

    expect(handlersKeys).to.eql(keyMapKeys);
  });
});
