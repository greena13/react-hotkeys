import './mockBrowser';
import assert from 'assert';
import React from 'react/addons';
import FocusTrap from '../FocusTrap';

const TestUtils = React.addons.TestUtils;

describe('FocusTrap', function() {
  it('should be focusable via a tabindex attribute', function() {
    const fc = TestUtils.renderIntoDocument(
      <FocusTrap />
    );

    const fce = React.findDOMNode(fc);

    assert(fce.hasAttribute('tabindex'));
    assert(fce.getAttribute('tabindex') === '-1');
  });
});
