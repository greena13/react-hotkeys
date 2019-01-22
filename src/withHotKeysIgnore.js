import withHotKeysIgnoreOverride from './withHotKeysIgnoreOverride';

function withHotKeysIgnore(Component, hotKeysIgnoreOptions = { only: [], except: [] }) {
  return withHotKeysIgnoreOverride(Component, hotKeysIgnoreOptions, 'ignoreEvent');
}

export default withHotKeysIgnore;
