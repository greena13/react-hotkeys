import React, { Component } from 'react';
import Configuration from './lib/Configuration';
import withHotKeysIgnore from './withHotKeysIgnore';

/**
 * @see HotKeysIgnored
 */
class HotKeysIgnore extends Component {
  render() {
    const {hotKeys, ...remainingProps} = this.props;

    const DefaultComponent = remainingProps.component || Configuration.option('defaultComponent');

    return (
      <DefaultComponent { ... { ...hotKeys, ...remainingProps } } />
    )
  }
}

export default withHotKeysIgnore(HotKeysIgnore);

