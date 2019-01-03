import React, { Component } from 'react';
import Configuration from './lib/Configuration';
import withHotKeys from './withHotKeys';

class HotKeysWrapper extends Component {
  render() {
    const {hotKeys, ...remainingProps} = this.props;

    const DefaultComponent = remainingProps.component || Configuration.option('defaultComponent');

    return (
      <DefaultComponent { ... { ...hotKeys, ...remainingProps } } />
    )
  }
}

export default withHotKeys(HotKeysWrapper);
