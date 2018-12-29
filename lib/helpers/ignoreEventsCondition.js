/**
 * Default implementation of the function used to decide whether to ignore a
 * particular keyboard event or not
 * @param {KeyboardEvent} event Event that must be decided to ignore or not
 * @returns {Boolean} Whether to ignore the keyboard event
 */
function ignoreEventsCondition({ target }) {
  const tagName = target.tagName.toLowerCase();

  return tagName === 'input' || tagName === 'select' || tagName === 'textarea' || target.isContentEditable
}

export default ignoreEventsCondition;
