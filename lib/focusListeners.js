/*  Utility functions for managing browser-native focus/blur listeners
*   Each returns a remove() function that can be easily used for cleanup.
*/

export function addFocusListener(elem, handler) {
  let eventName;
  let useCapture;
  let remove;
  if ('onfocusin' in document) {
    eventName = 'focusin';
    useCapture = false;
  } else {      
    eventName = 'focus';
    useCapture = true;
  }

  elem.addEventListener(eventName, handler, useCapture);
  remove = () => elem.removeEventListener(eventName, handler, useCapture);

  return {remove};
}

export function addBlurListener(elem, handler) {
  let eventName;
  let useCapture;
  let remove;
  if ('onfocusout' in document) {
    eventName = 'focusout';
    useCapture = false;
  } else {      
    eventName = 'blur';
    useCapture = true;
  }

  elem.addEventListener(eventName, handler, useCapture);
  remove = () => elem.removeEventListener(eventName, handler, useCapture);

  return {remove};
}