import withHotKeysIgnoreOverride from './withHotKeysIgnoreOverride';
import overrideComponent from './lib/overrideComponent';

/**
 * A component that forces React Hotkeys to observe all matching key events
 * triggered by its children, even if they are matched by Configuration.ignoreEventsCondition.
 * By default, this is all key events, but you can use the only prop to provide a
 * whitelist, or the except prop to pass a blacklist.
 *
 * @see HotKeysIgnoreOverride
 */
export default withHotKeysIgnoreOverride(
  overrideComponent('ObserveKeys'),
  {},
  'observeIgnoredEvents'
);
