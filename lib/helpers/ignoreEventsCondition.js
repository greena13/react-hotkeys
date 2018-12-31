/**
 * Default implementation of the function used to decide whether to ignore a
 * particular keyboard event or not
 * @param {KeyboardEvent} event Event that must be decided to ignore or not
 * @returns {Boolean} Whether to ignore the keyboard event
 */
import Configuration from '../lib/Configuration';

function ignoreEventsCondition(event) {
  const { target } = event;

  if (target && target.tagName) {
    const tagName = target.tagName.toLowerCase();

    return Configuration.option('_ignoreTagsDict')[tagName] || target.isContentEditable;
  } else {
    return false;
  }
}

export default ignoreEventsCondition;
