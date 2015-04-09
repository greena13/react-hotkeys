import assert from 'assert';
import React from 'react/addons';
import jsdom from 'mocha-jsdom';
import FocusTrap from '../lib/FocusTrap';

const TestUtils = React.addons.TestUtils;
jsdom();

describe('FocusTrap', function() {
  it('should be focusable via a tabindex attribute', function() {
    const fc = TestUtils.renderIntoDocument(
      <FocusTrap />
    );

    const fce = React.findDOMNode(fc);

    assert(fce.hasAttribute('tabindex'));
  });
});
