import withHotKeysIgnoreOverride from './withHotKeysIgnoreOverride';

function withHotKeysAlwaysObserve(Component, hotKeysIgnoreOptions = { only: [], except: [] }) {
  return withHotKeysIgnoreOverride(Component, hotKeysIgnoreOptions, 'forceObserveEvent');
}

export default withHotKeysAlwaysObserve;
