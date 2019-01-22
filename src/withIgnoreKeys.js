import withHotKeysIgnoreOverride from './withHotKeysIgnoreOverride';

function withIgnoreKeys(Component, hotKeysIgnoreOptions = { only: [], except: [] }) {
  return withHotKeysIgnoreOverride(Component, hotKeysIgnoreOptions, 'ignoreEvent');
}

export default withIgnoreKeys;
