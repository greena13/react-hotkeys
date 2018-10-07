import React from 'react';
import {mount} from 'enzyme';
import {expect} from 'chai';
import sinon from 'sinon';

import HotKeys from '../../lib/HotKeys';
import KeyCode from '../support/Key';
import FocusableElement from '../support/FocusableElement';

describe('Component lifecycle:', () => {
  before(function () {
    this.keyMap = {
      'ACTION1': 'a',
      'ACTION2': 'b',
    };
  });

  context('when component mounts', () => {

    beforeEach(function () {
      this.handler = sinon.spy();

      const handlers = {
        'ACTION1': this.handler,
      };

      this.wrapper = mount(
        <HotKeys keyMap={this.keyMap} handlers={handlers}>
          <div className="childElement" />
        </HotKeys>
      );

    });

    it('then none of the handlers are called', function() {
      expect(this.handler).to.not.have.been.called;
    });

    context('and focused', () => {
      beforeEach(function () {
        this.targetElement = new FocusableElement(this.wrapper, '.childElement');
        this.targetElement.focus();
      });

      it('then none of the handlers are called', function() {
        expect(this.handler).to.not.have.been.called;
      });

      context('and a key matching a hot key is pressed', () => {
        it('then calls the correct handler', function() {
          this.targetElement.keyPress(KeyCode.A);

          expect(this.handler).to.have.been.called;
        });
      });
    });

  });

  context('when the component has been unmounted', () => {
    beforeEach(function () {
      this.handler = sinon.spy();

      const handlers = {
        'ACTION1': this.handler,
      };

      this.wrapper = mount(
        <div >
          <HotKeys keyMap={this.keyMap} handlers={handlers}>
            <div className="childElement" />
          </HotKeys>

          <div className="siblingElement" />
        </div>
      );

      this.targetElement = new FocusableElement(this.wrapper, '.childElement');
      this.targetElement.focus();

      this.wrapper.unmount();
    });

    it('then does not call the handler when a key matching a hot key is pressed', function() {
      this.targetElement.keyPress(KeyCode.A);

      expect(this.handler).to.not.have.been.called;
    });
  });

});
