import React, { Component } from 'react';
import Configuration from './lib/Configuration';
import withHotKeysIgnoreOverride from './withHotKeysIgnoreOverride';

/**
 * A component that causes React Hotkeys to ignore all matching key events
 * triggered by its children. By default, this is all key events, but you can use
 * the only prop to provide a whitelist, or the except prop to pass a blacklist (and
 * cause HotKeys components to still observe these events).
 *
 * @see HotKeysIgnoreOverride
 */
class IgnoreKeys extends Component {
  render() {
    const {hotKeys, ...remainingProps} = this.props;

    const DefaultComponent = remainingProps.component || Configuration.option('defaultComponent');

    return (
      <DefaultComponent { ... { ...hotKeys, ...remainingProps } } />
    )
  }
}

export default withHotKeysIgnoreOverride(IgnoreKeys, {}, 'ignoreEvent');

