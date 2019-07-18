import withHotKeysIgnoreOverride from './withHotKeysIgnoreOverride';
import overrideComponent from './lib/overrideComponent';

/**
 * A component that causes React Hotkeys to ignore all matching key events
 * triggered by its children. By default, this is all key events, but you can use
 * the only prop to provide a whitelist, or the except prop to pass a blacklist (and
 * cause HotKeys components to still observe these events).
 *
 * @see HotKeysIgnoreOverride
 */
export default withHotKeysIgnoreOverride(
  overrideComponent('IgnoreKeys'),
  {},
  'ignoreEvent'
);

