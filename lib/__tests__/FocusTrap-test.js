import './mockBrowser';
import assert from 'assert';
import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';
import FocusTrap from '../FocusTrap';

describe('FocusTrap', function() {
  it('should be focusable via a tabindex attribute', function() {
    const fc = TestUtils.renderIntoDocument(
      <FocusTrap />
    );

    const fce = ReactDOM.findDOMNode(fc);

    assert(fce.hasAttribute('tabindex'));
    assert(fce.getAttribute('tabindex') === '-1');
  });
});
