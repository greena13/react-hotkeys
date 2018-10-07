import React from 'react';
import {mount} from 'enzyme';
import {expect} from 'chai';
import sinon from 'sinon';

import HotKeys from '../../lib/HotKeys';
import KeyCode from '../support/Key';
import FocusableElement from '../support/FocusableElement';

describe('Specifying key map using objects:', () => {
  context('when a keydown keymap is specified as an object', () => {
    beforeEach(function () {
      this.keyMap = {
        'ACTION1': {
          sequence: 'enter',
          action: 'keydown',
        },
      };

      this.handler = sinon.spy();

      this.handlers = {
        'ACTION1': this.handler,
      };

      this.wrapper = mount(
        <HotKeys keyMap={this.keyMap} handlers={this.handlers} focused>
          <div className="childElement" />
        </HotKeys>
      );

      this.targetElement = new FocusableElement(this.wrapper, '.childElement');
      this.targetElement.focus();
    });

    it('then calls the correct handler when a key is pressed that matches the keyMap', function() {
      this.targetElement.keyDown(KeyCode.ENTER);

      expect(this.handler).to.have.been.calledOnce;
    });
  });

  context('when a keyup keymap is specified as an object', () => {
    beforeEach(function () {
      this.keyMap = {
        'ACTION1': {
          sequence: 'enter',
          action: 'keyup',
        },
      };

      this.handler = sinon.spy();

      this.handlers = {
        'ACTION1': this.handler,
      };

      this.wrapper = mount(
        <HotKeys keyMap={this.keyMap} handlers={this.handlers} focused>
          <div className="childElement" />
        </HotKeys>
      );

      this.targetElement = new FocusableElement(this.wrapper, '.childElement');
      this.targetElement.focus();
    });

    it('then calls the correct handler when a key is pressed that matches the keyMap', function() {
      this.targetElement.keyUp(KeyCode.ENTER);

      expect(this.handler).to.have.been.called;
    });
  });

  context('when a keypress keymap is specified as an object', () => {
    beforeEach(function () {
      this.keyMap = {
        'ACTION1': {
          sequence: 'a',
          action: 'keypress',
        },
      };

      this.handler = sinon.spy();

      this.handlers = {
        'ACTION1': this.handler,
      };

      this.wrapper = mount(
        <HotKeys keyMap={this.keyMap} handlers={this.handlers} focused>
          <div className="childElement" />
        </HotKeys>
      );

      this.targetElement = new FocusableElement(this.wrapper, '.childElement');
      this.targetElement.focus();
    });

    it('then calls the correct handler when a key is pressed that matches the keyMap', function() {
      this.targetElement.keyPress(KeyCode.A);

      expect(this.handler).to.have.been.called;
    });
  });

  context('when a keymap is specified as an object without the action', () => {
    beforeEach(function () {
      this.keyMap = {
        'ACTION': {
          sequence: 'a',
        },
      };

      this.handler = sinon.spy();

      this.handlers = {
        'ACTION': this.handler,
      };

      this.wrapper = mount(
        <HotKeys keyMap={this.keyMap} handlers={this.handlers} focused>
          <div className="childElement" />
        </HotKeys>
      );

      this.targetElement = new FocusableElement(this.wrapper, '.childElement');
      this.targetElement.focus();
    });

    it('then calls the correct handler when a key is pressed that matches the keyMap', function() {
      this.targetElement.keyPress(KeyCode.A);

      expect(this.handler).to.have.been.called;
    });
  });
});
