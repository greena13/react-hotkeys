import React from 'react';

function backwardsCompatibleContext(Component, { deprecatedAPI: { contextTypes, childContextTypes }, newAPI: { contextType } }) {
  if (typeof React.createContext === 'undefined') {
    Component.contextTypes = contextTypes;
    Component.childContextTypes = childContextTypes;

    Component.prototype.getChildContext = function() {
      return this._childContext;
    };
  } else {
    const context = React.createContext(contextType);

    Component.contextType = context;
    Component.prototype._originalRender = Component.prototype.render;

    Component.prototype.render = function() {
      const result = this._originalRender();

      if (result) {
        return (
          <context.Provider value={ this._childContext }>
            { result }
          </context.Provider>
        )
      } else {
        return null;
      }
    };
  }

  return Component;
}

export default backwardsCompatibleContext;
