import { Component } from 'react';
import PropTypes from 'prop-types';

class GlobalHotKeysContextProvider extends Component {
  getChildContext() {
    return {
      globalHotKeysParentId: this._id
    };
  }

  render() {
    return this.props.children || null;
  }
}

GlobalHotKeysContextProvider.contextTypes = {
  globalHotKeysParentId: PropTypes.number,
};

GlobalHotKeysContextProvider.childContextTypes = GlobalHotKeysContextProvider.contextTypes;

module.exports = GlobalHotKeysContextProvider;
