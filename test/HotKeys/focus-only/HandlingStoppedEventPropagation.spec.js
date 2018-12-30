import React from 'react';
import {mount} from 'enzyme';
import {expect} from 'chai';
import sinon from 'sinon';

import FocusableElement from '../../support/FocusableElement';

import KeyCode from '../../support/Key';
import HotKeys from '../../../lib/HotKeys';

describe('Handling stopped event propagation:', function () {
  beforeEach(function () {
    this.keyMap = {
      'ACTION': 'a',
    };

    this.handler = sinon.spy();

    this.handlers = {
      'ACTION': this.handler,
    };
  });

  describe('when a keyboard event is stopped before it reaches any HotKeys components', () => {
    beforeEach(function () {
      this.wrapper = mount(
        <HotKeys keyMap={this.keyMap} handlers={this.handlers}>
          <div className="childElement" onKeyPress={(e) => e.stopPropagation() } />
        </HotKeys>
      );

      this.targetElement = new FocusableElement(this.wrapper, '.childElement');
      this.targetElement.focus();
    });

    it('then does not trigger an associated handler', function() {
      this.targetElement.keyPress(KeyCode.A);

      expect(this.handler).to.not.have.been.called;
    });
  });

  describe('when a keyboard event is stopped after is has propagated through a HotKeys component', () => {
    describe('but before it reaches the HotKeys component that defines the handler', () => {
      beforeEach(function () {
        this.wrapper = mount(
          <HotKeys keyMap={this.keyMap} handlers={this.handlers}>
            <div onKeyPress={(e) => e.stopPropagation() }>
              <HotKeys >
                <div className="childElement"  />
              </HotKeys>
            </div>
          </HotKeys>
        );

        this.targetElement = new FocusableElement(this.wrapper, '.childElement');
        this.targetElement.focus();
      });

      it('then does not trigger an associated handler', function() {
        this.targetElement.keyPress(KeyCode.A);

        expect(this.handler).to.not.have.been.called;
      });
    });

    describe('but before it reaches the HotKeys component that defines the action', () => {
      beforeEach(function () {
        this.wrapper = mount(
          <HotKeys keyMap={this.keyMap} >
            <div onKeyPress={(e) => e.stopPropagation() }>
              <HotKeys handlers={this.handlers}>
                <div className="childElement"  />
              </HotKeys>
            </div>
          </HotKeys>
        );

        this.targetElement = new FocusableElement(this.wrapper, '.childElement');
        this.targetElement.focus();
      });

      it('then calls the handler', function() {
        this.targetElement.keyPress(KeyCode.A);

        expect(this.handler).to.have.been.called;
      });
    });

    describe('and that HotKeys component defines a matching action', () => {
      beforeEach(function () {
        this.wrapper = mount(
          <HotKeys >
            <div onKeyPress={(e) => e.stopPropagation() }>
              <HotKeys keyMap={this.keyMap} handlers={this.handlers}>
                <div className="childElement"  />
              </HotKeys>
            </div>
          </HotKeys>
        );

        this.targetElement = new FocusableElement(this.wrapper, '.childElement');
        this.targetElement.focus();
      });

      it('then calls the associated action\'s handler', function() {
        this.targetElement.keyPress(KeyCode.A);

        expect(this.handler).to.have.been.calledOnce;
      });
    });
  });
});
