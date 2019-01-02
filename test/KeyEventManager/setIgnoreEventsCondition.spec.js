import React from 'react';
import {mount} from 'enzyme';
import {expect} from 'chai';
import sinon from 'sinon';

import HotKeys from '../../src/HotKeys';
import FocusableElement from '../support/FocusableElement';
import KeyCode from '../support/Key';

describe('KeyEventManager:', () => {
  before(function () {
    this.keyMap = {
      'ACTION1': 'a',
      'ACTION2': 'b',
    };
  });

  context('when setIgnoreEventsCondition() is NOT called', () => {

    [ 'input', 'select', 'textarea'].forEach((Tagname) => {
      it(`then events from <${Tagname} /> tags are ignored`, function() {
        this.handler = sinon.spy();

        const handlers = {
          'ACTION1': this.handler,
        };

        this.wrapper = mount(
          <HotKeys keyMap={this.keyMap} handlers={handlers}>
            <Tagname className="childElement" />
          </HotKeys>
        );

        this.targetElement = new FocusableElement(this.wrapper, Tagname);
        this.targetElement.focus();

        this.targetElement.keyPress(KeyCode.A);

        expect(this.handler).to.not.have.been.called;
      });

    })
  });

  context('when setIgnoreEventsCondition() is called with a function', () => {

    it('then that function is used to decide whether to ignore events', function() {
      HotKeys.setIgnoreEventsCondition(({ target }) => {
        return target.tagName.toLowerCase() === 'input' && target.className === 'ignore';
      });

      this.handler = sinon.spy();

      const handlers = {
        'ACTION1': this.handler,
      };

      this.wrapper = mount(
        <HotKeys keyMap={this.keyMap} handlers={handlers}>
          <input className="ignore" />
          <input className="other" />
        </HotKeys>
      );

      this.targetElement = new FocusableElement(this.wrapper, 'input.ignore');
      this.targetElement.focus();

      this.targetElement.keyPress(KeyCode.A);

      expect(this.handler).to.not.have.been.called;

      this.targetElement = new FocusableElement(this.wrapper, 'input.other');
      this.targetElement.focus();

      this.targetElement.keyPress(KeyCode.A);

      expect(this.handler).to.have.been.called;
    });

  });

  context('when resetIgnoreEventsCondition() is called', () => {

    it('then restores the default function used for ignoreEventsCondition', function() {
      HotKeys.setIgnoreEventsCondition(({ target }) => {
        return target.tagName.toLowerCase() === 'input' && target.className === 'ignore';
      });

      HotKeys.resetIgnoreEventsCondition();

      this.handler = sinon.spy();

      const handlers = {
        'ACTION1': this.handler,
      };

      this.wrapper = mount(
        <HotKeys keyMap={this.keyMap} handlers={handlers}>
          <input className="other" />
        </HotKeys>
      );

      this.targetElement = new FocusableElement(this.wrapper, 'input.other');
      this.targetElement.focus();

      this.targetElement.keyPress(KeyCode.A);

      expect(this.handler).to.not.have.been.called;
    });

  });

});
