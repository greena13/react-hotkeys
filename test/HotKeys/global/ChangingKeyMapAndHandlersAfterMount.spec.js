import React from 'react';
import {mount} from 'enzyme';
import {expect} from 'chai';
import sinon from 'sinon';
import simulant from 'simulant';

import KeyCode from '../../support/Key';
import HotKeys from '../../../lib/HotKeys';

describe('Changing keyMap and handlers after mount for a global HotKeys component:', function () {
  beforeEach(function () {
    this.keyMap = {
      'ACTION': 'a',
    };

    this.handler = sinon.spy();
    this.handler2 = sinon.spy();

    this.handlers = {
      'ACTION': this.handler,
      'ACTION2': this.handler2,
    };

    this.reactDiv = document.createElement('div');
    document.body.appendChild(this.reactDiv);

    this.wrapper = mount(
      <HotKeys keyMap={this.keyMap} handlers={this.handlers} global>
        <div className="childElement" />
      </HotKeys>,
      { attachTo: this.reactDiv }
    );
  });

  afterEach(function() {
    document.body.removeChild(this.reactDiv);
  });

  describe('when a keyMap action\'s key sequence is changed', () => {
    beforeEach(function () {
      this.wrapper.setProps({ keyMap: { 'ACTION': 'b' }, handlers: this.handlers })
    });

    it('then the new sequence is used', function() {
      expect(this.handler).to.not.have.been.called;

      simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.B });

      expect(this.handler).to.have.been.calledOnce;
    });
  });

  describe('when the action associated with a key sequence is changed', () => {
    beforeEach(function () {
      this.wrapper.setProps({ keyMap: { 'ACTION2': 'a' }, handlers: this.handlers })
    });

    it('then the new sequence is used', function() {
      expect(this.handler).to.not.have.been.called;
      expect(this.handler2).to.not.have.been.called;

      simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.A });

      expect(this.handler).to.not.have.been.called;
      expect(this.handler2).to.have.been.calledOnce;
    });
  });

  describe('when the a new action is added to the keymap', () => {
    beforeEach(function () {
      this.wrapper.setProps({ keyMap: { ...this.keyMap, 'ACTION2': 'b' }, handlers: this.handlers })
    });

    it('then the new sequence is used', function() {
      expect(this.handler).to.not.have.been.called;
      expect(this.handler2).to.not.have.been.called;

      simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.B });

      expect(this.handler).to.not.have.been.called;
      expect(this.handler2).to.have.been.calledOnce;
    });
  });

  describe('when the an action is removed from the keymap', () => {
    beforeEach(function () {
      this.wrapper.setProps({ keyMap: { }, handlers: this.handlers })
    });

    it('then the new sequence is used', function() {
      simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.A });

      expect(this.handler).to.not.have.been.called;
    });
  });

  describe('when a keyMap\'s handler is changed', () => {
    beforeEach(function () {
      this.wrapper.setProps({ keyMap: this.keyMap, handlers: { 'ACTION': this.handler2 } })
    });

    it('then the new sequence is used', function() {

      simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.A });

      expect(this.handler).to.not.have.been.called;
      expect(this.handler2).to.have.been.calledOnce;
    });
  });

  describe('when a new handler is added to the keymap', () => {
    beforeEach(function () {
      this.handler3 = sinon.spy();

      this.wrapper.setProps({ keyMap: { ...this.keyMap, 'ACTION3': 'b' }, handlers: { ...this.handlers, 'ACTION3': this.handler3 } })
    });

    it('then the new sequence is used', function() {
      expect(this.handler).to.not.have.been.called;
      expect(this.handler2).to.not.have.been.called;
      expect(this.handler3).to.not.have.been.called;

      simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.B });

      expect(this.handler).to.not.have.been.called;
      expect(this.handler2).to.not.have.been.called;
      expect(this.handler3).to.have.been.calledOnce;
    });
  });

  describe('when a handler is removed from keymap', () => {
    beforeEach(function () {
      this.handler3 = sinon.spy();

      this.wrapper.setProps({ keyMap: this.keyMap, handlers: { } })
    });

    it('then the new sequence is used', function() {
      simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.A });

      expect(this.handler).to.not.have.been.called;
    });
  });
});
