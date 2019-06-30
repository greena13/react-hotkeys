import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Configuration from './lib/config/Configuration';
import withHotKeys from './withHotKeys';

/**
 * @see HotKeysEnabled
 */
class HotKeysWrapper extends Component {

  render() {
    const {hotKeys, innerRef, component, ...remainingProps} = this.props;

    const DefaultComponent = component || Configuration.option('defaultComponent');

    return (
      <DefaultComponent { ... { ...hotKeys, ref: innerRef, ...remainingProps } } />
    )
  }
}

const HotKeys = withHotKeys(HotKeysWrapper);

HotKeys.propTypes = {
  /**
   * A ref to add to the underlying DOM-mountable node
   */
  innerRef: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
};

export default HotKeys;
