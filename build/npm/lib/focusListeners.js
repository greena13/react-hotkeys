'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addFocusListener = addFocusListener;
exports.addBlurListener = addBlurListener;
/*  Utility functions for managing browser-native focus/blur listeners
*   Each returns a remove() function that can be easily used for cleanup.
*/

function addFocusListener(elem, handler) {
  var eventName = void 0;
  var useCapture = void 0;
  var remove = void 0;
  if ('onfocusin' in document) {
    eventName = 'focusin';
    useCapture = false;
  } else {
    eventName = 'focus';
    useCapture = true;
  }

  elem.addEventListener(eventName, handler, useCapture);
  remove = function remove() {
    return elem.removeEventListener(eventName, handler, useCapture);
  };

  return { remove: remove };
}

function addBlurListener(elem, handler) {
  var eventName = void 0;
  var useCapture = void 0;
  var remove = void 0;
  if ('onfocusout' in document) {
    eventName = 'focusout';
    useCapture = false;
  } else {
    eventName = 'blur';
    useCapture = true;
  }

  elem.addEventListener(eventName, handler, useCapture);
  remove = function remove() {
    return elem.removeEventListener(eventName, handler, useCapture);
  };

  return { remove: remove };
}