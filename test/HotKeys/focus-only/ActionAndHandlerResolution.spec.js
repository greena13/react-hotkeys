import React from 'react';
import {mount} from 'enzyme';
import {expect} from 'chai';
import sinon from 'sinon';

import FocusableElement from '../../support/FocusableElement';

import KeyCode from '../../support/Key';
import HotKeys from '../../../src/HotKeys';

describe('Action and handler resolution:', function () {
  describe('when an action is defined', function () {
    describe('in the same component as its handlers', function () {
      beforeEach(function () {
        this.keyMap = {
          'ACTION': 'a',
        };

        this.handler = sinon.spy();

        const handlers = {
          'ACTION': this.handler,
        };

        this.wrapper = mount(
          <HotKeys keyMap={ this.keyMap } handlers={ handlers }>
            <div className="childElement" />
          </HotKeys>
        );

        this.targetElement = new FocusableElement(this.wrapper, '.childElement');
        this.targetElement.focus();
      });

      describe('when the matching key is pressed', function () {
        it('then that action\'s handler is called', function() {
          this.targetElement.keyDown(KeyCode.A);
          this.targetElement.keyPress(KeyCode.A);
          this.targetElement.keyUp(KeyCode.A);

          expect(this.handler).to.have.been.calledOnce;
        });
      });
    });

    describe('in a parent component to the one that defines the handlers', function () {
      beforeEach(function () {
        this.keyMap = {
          'ACTION': 'a',
        };

        this.handler = sinon.spy();

        const handlers = {
          'ACTION': this.handler,
        };

        this.wrapper = mount(
          <HotKeys keyMap={ this.keyMap } >
            <HotKeys handlers={ handlers }>
              <div className="childElement" />
            </HotKeys>
          </HotKeys>
        );

        this.targetElement = new FocusableElement(this.wrapper, '.childElement');
        this.targetElement.focus();
      });

      describe('when the matching key is pressed', function () {
        it('then that action\'s handler is called', function() {
          this.targetElement.keyDown(KeyCode.A);
          this.targetElement.keyPress(KeyCode.A);
          this.targetElement.keyUp(KeyCode.A);

          expect(this.handler).to.have.been.calledOnce;
        });
      });
    });

    describe('in a grand parent component to the one that defines the handlers', function () {
      beforeEach(function () {
        this.keyMap = {
          'ACTION': 'a',
          ACTION2: 'b',
        };

        this.handler = sinon.spy();

        const handlers = {
          'ACTION': this.handler,
        };

        this.wrapper = mount(
          <HotKeys keyMap={ this.keyMap } >
            <HotKeys keyMap={ { ACTION2: 'tab' } } >
              <div >
                <HotKeys handlers={ handlers }>
                  <div className="childElement" />
                </HotKeys>
              </div>
            </HotKeys>
          </HotKeys>
        );

        this.targetElement = new FocusableElement(this.wrapper, '.childElement');
        this.targetElement.focus();
      });

      describe('when the matching key is pressed', function () {
        it('then that action\'s handler is called', function() {
          this.targetElement.keyDown(KeyCode.A);
          this.targetElement.keyPress(KeyCode.A);
          this.targetElement.keyUp(KeyCode.A);

          expect(this.handler).to.have.been.calledOnce;
        });
      });
    });

  });

});
