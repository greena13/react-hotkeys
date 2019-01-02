import React from 'react';
import {mount} from 'enzyme';
import {expect} from 'chai';
import sinon from 'sinon';

import FocusableElement from '../support/FocusableElement';

import KeyCode from '../support/Key';
import HotKeys from '../../src/HotKeys';

describe('Specifying actions with multiple key sequences:', function () {
  describe('when a action is defined with an array of key sequences', function () {
    beforeEach(function () {
      this.keyMap = {
        'ACTION': [ 'enter', 'tab' ],
      };

      this.handler = sinon.spy();

      const handlers = {
        'ACTION': this.handler,
      };

      this.wrapper = mount(
        <HotKeys keyMap={this.keyMap} handlers={handlers}>
          <div className="childElement" />
        </HotKeys>
      );

      this.targetElement = new FocusableElement(this.wrapper, '.childElement');
      this.targetElement.focus();
    });

    describe('when any one of the sequences is satisfied', function () {
      it('then that action\'s handler is called', function() {
        [ KeyCode.ENTER, KeyCode.TAB ].forEach((key) => {
          this.targetElement.keyDown(key);
          this.targetElement.keyUp(key);
        });

        expect(this.handler).to.have.been.calledTwice;
      });
    });
  });

  describe('when different key sequences for the same action are defined in different HotKeys components', function () {
    beforeEach(function () {
      this.keyMap = {
        'ACTION': 'enter',
      };

      this.innerKeyMap = {
        'ACTION': 'tab',
      };

      this.enterHandler = sinon.spy();
      this.tabHandler = sinon.spy();

      const handlers = {
        'ACTION': this.enterHandler,
      };

      this.wrapper = mount(
        <HotKeys keyMap={this.keyMap} >
          <HotKeys keyMap={this.innerKeyMap} handlers={handlers}>
            <div className="childElement" />
          </HotKeys>
        </HotKeys>
      );

      this.targetElement = new FocusableElement(this.wrapper, '.childElement');
      this.targetElement.focus();
    });

    describe('when any one of the sequences is satisfied', function () {
      it('then that action\'s handler is called', function() {
        [ KeyCode.ENTER, KeyCode.TAB ].forEach((key) => {
          this.targetElement.keyDown(key);
          this.targetElement.keyUp(key);
        });

        expect(this.enterHandler).to.have.been.calledTwice;
      });
    });
  });
});
