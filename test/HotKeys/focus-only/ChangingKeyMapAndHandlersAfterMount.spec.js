import React from 'react';
import {mount} from 'enzyme';
import {expect} from 'chai';
import sinon from 'sinon';

import FocusableElement from '../../support/FocusableElement';

import KeyCode from '../../support/Key';
import {HotKeys} from '../../../src/';

describe('Changing keyMap and handlers after mount:', function () {
  context('when the allowChanges prop is NOT used', () => {
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

      this.wrapper = mount(
        <HotKeys keyMap={this.keyMap} handlers={this.handlers}>
          <div className="childElement" />
        </HotKeys>
      );

      this.targetElement = new FocusableElement(this.wrapper, '.childElement');
      this.targetElement.focus();
    });

    describe('when a keyMap action\'s key sequence is changed', () => {
      beforeEach(function () {
        this.wrapper.setProps({ keyMap: { 'ACTION': 'b' }, handlers: this.handlers })
      });

      it('then the new sequence is ignored', function() {
        this.targetElement.keyDown(KeyCode.B);

        expect(this.handler).to.not.have.been.called;

        this.targetElement.keyDown(KeyCode.A);

        expect(this.handler).to.have.been.calledOnce;
      });
    });
  });

  context('when the allowChanges prop is used', () => {
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

      this.wrapper = mount(
        <HotKeys keyMap={this.keyMap} handlers={this.handlers} allowChanges>
          <div className="childElement" />
        </HotKeys>
      );

      this.targetElement = new FocusableElement(this.wrapper, '.childElement');
      this.targetElement.focus();

    });

    describe('when a keyMap action\'s key sequence is changed', () => {
      beforeEach(function () {
        this.wrapper.setProps({ keyMap: { 'ACTION': 'b' }, handlers: this.handlers })
      });

      it('then the new sequence is used', function() {
        expect(this.handler).to.not.have.been.called;

        this.targetElement.keyDown(KeyCode.B);
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

        this.targetElement.keyDown(KeyCode.A);

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

        this.targetElement.keyDown(KeyCode.B);

        expect(this.handler).to.not.have.been.called;
        expect(this.handler2).to.have.been.calledOnce;
      });
    });

    describe('when the an action is removed from the keymap', () => {
      beforeEach(function () {
        this.wrapper.setProps({ keyMap: { }, handlers: this.handlers })
      });

      it('then the new sequence is used', function() {
        this.targetElement.keyDown(KeyCode.A);

        expect(this.handler).to.not.have.been.called;
      });
    });

    describe('when a keyMap\'s handler is changed', () => {
      beforeEach(function () {
        this.wrapper.setProps({ keyMap: this.keyMap, handlers: { 'ACTION': this.handler2 } })
      });

      it('then the new sequence is used', function() {

        this.targetElement.keyDown(KeyCode.A);

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

        this.targetElement.keyDown(KeyCode.B);

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
        this.targetElement.keyDown(KeyCode.A);

        expect(this.handler).to.not.have.been.called;
      });
    });
  });
});
