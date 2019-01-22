import withHotKeysIgnoreOverride from './withHotKeysIgnoreOverride';

function withObserveKeys(Component, hotKeysIgnoreOptions = { only: [], except: [] }) {
  return withHotKeysIgnoreOverride(Component, hotKeysIgnoreOptions, 'forceObserveEvent');
}

export default withObserveKeys;
