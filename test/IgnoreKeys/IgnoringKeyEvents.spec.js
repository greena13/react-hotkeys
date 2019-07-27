import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';

import FocusableElement from '../support/FocusableElement';

import { HotKeys, IgnoreKeys } from '../../src/';
import Key from '../support/Key';

describe('Ignoring key events using IgnoreKeys:', function () {
  beforeEach(function () {
    this.keyMap = {
      'ACTION_A': 'a',
      'ACTION_B': 'b',
      'ACTION_C': 'c',
    };

    this.handlerA = sinon.spy();
    this.handlerB = sinon.spy();
    this.handlerC = sinon.spy();

    this.handlers = {
      'ACTION_A': this.handlerA,
      'ACTION_B': this.handlerB,
      'ACTION_C': this.handlerC,
    };
  });

  describe('when no keys are specified', () => {
    beforeEach(function () {
      this.wrapper = mount(
        <HotKeys keyMap={this.keyMap} handlers={this.handlers}>
          <IgnoreKeys>
            <div className="childElement"/>
          </IgnoreKeys>
        </HotKeys>
      );

      this.targetElement = new FocusableElement(this.wrapper, '.childElement');
      this.targetElement.focus();
    });

    it('then ignores all key events', function () {
      this.targetElement.keyDown(Key.A);
      this.targetElement.keyPress(Key.A);
      this.targetElement.keyUp(Key.A);

      expect(this.handlerA).to.not.have.been.called;

      this.targetElement.keyDown(Key.B);
      this.targetElement.keyPress(Key.B);
      this.targetElement.keyUp(Key.B);

      expect(this.handlerB).to.not.have.been.called;
    });
  });

  describe('when the only option is used', () => {
    beforeEach(function () {
      this.wrapper = mount(
        <HotKeys keyMap={this.keyMap} handlers={this.handlers}>
          <IgnoreKeys only={'a'}>
            <div className="childElement"/>
          </IgnoreKeys>
        </HotKeys>
      );

      this.targetElement = new FocusableElement(this.wrapper, '.childElement');
      this.targetElement.focus();
    });

    it('then ignores all key events that match keys in the only option', function () {
      this.targetElement.keyDown(Key.A);
      this.targetElement.keyPress(Key.A);
      this.targetElement.keyUp(Key.A);

      expect(this.handlerA).to.not.have.been.called;

      this.targetElement.keyDown(Key.B);
      this.targetElement.keyPress(Key.B);
      this.targetElement.keyUp(Key.B);

      expect(this.handlerB).to.have.been.called;
    });
  });

  describe('when the except option is used', () => {
    beforeEach(function () {
      this.wrapper = mount(
        <HotKeys keyMap={this.keyMap} handlers={this.handlers}>
          <IgnoreKeys except={'b'}>
            <div className="childElement"/>
          </IgnoreKeys>
        </HotKeys>
      );

      this.targetElement = new FocusableElement(this.wrapper, '.childElement');
      this.targetElement.focus();
    });

    it('then ignores all key events that DON\'T match keys in the except option', function () {
      this.targetElement.keyDown(Key.A);
      this.targetElement.keyPress(Key.A);
      this.targetElement.keyUp(Key.A);

      expect(this.handlerA).to.not.have.been.called;

      this.targetElement.keyDown(Key.B);
      this.targetElement.keyPress(Key.B);
      this.targetElement.keyUp(Key.B);

      expect(this.handlerB).to.have.been.called;
    });
  });

  describe('when the except option is used with Backspace', () => {
    beforeEach(function () {
      this.keyMap = {
        'ACTION_A': 'a',
        'ACTION_B': 'Backspace'
      };

      this.handlerA = sinon.spy();
      this.handlerB = sinon.spy();

      this.handlers = {
        'ACTION_A': this.handlerA,
        'ACTION_B': this.handlerB,
      };

      this.wrapper = mount(
        <HotKeys keyMap={this.keyMap} handlers={this.handlers}>
          <IgnoreKeys except={['Backspace']}>
            <div className="childElement"/>
          </IgnoreKeys>
        </HotKeys>
      );

      this.targetElement = new FocusableElement(this.wrapper, '.childElement');
      this.targetElement.focus();
    });

    it('then ignores all key events except Backspace \
       (https://github.com/greena13/react-hotkeys/issues/172)', function () {
      this.targetElement.keyDown(Key.A);
      this.targetElement.keyPress(Key.A);
      this.targetElement.keyUp(Key.A);

      expect(this.handlerA).to.not.have.been.called;

      this.targetElement.keyDown('Backspace');
      this.targetElement.keyPress('Backspace');
      this.targetElement.keyUp('Backspace');

      expect(this.handlerB).to.have.been.called;
    });
  });

  describe('when the only and the except option are used', () => {
    beforeEach(function () {
      this.wrapper = mount(
        <HotKeys keyMap={this.keyMap} handlers={this.handlers}>
          <IgnoreKeys only={'a'} except={'b'}>
            <div className="childElement"/>
          </IgnoreKeys>
        </HotKeys>
      );

      this.targetElement = new FocusableElement(this.wrapper, '.childElement');
      this.targetElement.focus();
    });

    it('then ignores all key events are in the only option and NOT in the except option', function () {
      this.targetElement.keyDown(Key.A);
      this.targetElement.keyPress(Key.A);
      this.targetElement.keyUp(Key.A);

      expect(this.handlerA).to.not.have.been.called;

      this.targetElement.keyDown(Key.B);
      this.targetElement.keyPress(Key.B);
      this.targetElement.keyUp(Key.B);

      expect(this.handlerB).to.have.been.called;

      this.targetElement.keyDown(Key.C);
      this.targetElement.keyPress(Key.C);
      this.targetElement.keyUp(Key.C);

      expect(this.handlerC).to.have.been.called;
    });
  });
});
