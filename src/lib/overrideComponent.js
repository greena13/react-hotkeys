import React, { Component } from 'react';

import Configuration from './config/Configuration';

function overrideComponent(displayName) {
  return class OverrideComponent extends Component {
    static displayName = displayName;

    render() {
      const {hotKeys, ...remainingProps} = this.props;

      const DefaultComponent = remainingProps.component || Configuration.option('defaultComponent');

      return (
        <DefaultComponent { ... { ...hotKeys, ...remainingProps } } />
      )
    }
  }
}

export default overrideComponent;
