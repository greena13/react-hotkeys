import React from 'react';
import simulant from 'simulant';

import {mount} from 'enzyme';
import {expect} from 'chai';
import sinon from 'sinon';

import HotKeys from '../../lib/HotKeys';
import KeyCode from '../support/KeyCode';

describe('When useFocusWrap prop is used to avoid wrapping children', () => {
  before(function () {
    this.keyMap = {
      'ENTER': 'enter',
      'TAB': 'tab',
    };
  });

  context('the resultant HTML does not contain any wrapping element', () => {
    beforeEach(function () {
      this.handler = sinon.spy();

      const handlers = {
        'ENTER': this.handler,
      };

      this.wrapper = mount(
        <HotKeys keyMap={this.keyMap} handlers={handlers} useFocusWrap={false}>
          <input className="childElement" />
        </HotKeys>
      );
    });

    it('then renders children without a wrapping element', function() {
      let div = this.wrapper.find('div');
      expect(div.length).to.equal(0);
    });

    context('matching keys still continue to trigger associated shortcuts', () => {
      beforeEach(function () {
        this.input = this.wrapper.getDOMNode();
        this.input.focus();
      });

      it('then calls the correct handler when a key is pressed that matches the keyMap', function() {
        simulant.fire(this.input, 'keydown', {keyCode: KeyCode.ENTER});
        expect(this.handler).to.have.been.called;
      });
    });
  });
});
