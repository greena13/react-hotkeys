import {jsdom} from 'jsdom';

if (typeof document === 'undefined') {
  global.document = jsdom('<html><body></body></html>');
  global.window = document.defaultView;
  global.navigator = {userAgent: 'node.js'};
}
