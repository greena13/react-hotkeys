import React, { Component } from 'react';
import Configuration from './lib/Configuration';
import withHotKeysIgnoreOverride from './withHotKeysIgnoreOverride';

/**
 * A component that forces React Hotkeys to observe all matching key events
 * triggered by its children, even if they are matched by Configuration.ignoreEventsCondition.
 * By default, this is all key events, but you can use the only prop to provide a
 * whitelist, or the except prop to pass a blacklist.
 *
 * @see HotKeysIgnoreOverride
 */
class ObserveKeys extends Component {
  render() {
    const {hotKeys, ...remainingProps} = this.props;

    const DefaultComponent = remainingProps.component || Configuration.option('defaultComponent');

    return (
      <DefaultComponent { ... { ...hotKeys, ...remainingProps } } />
    )
  }
}

export default withHotKeysIgnoreOverride(ObserveKeys, {}, 'forceObserveEvent');

