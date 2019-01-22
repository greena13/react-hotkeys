import React from 'react';
import {mount} from 'enzyme';
import {expect} from 'chai';
import sinon from 'sinon';

import FocusableElement from '../support/FocusableElement';

import {HotKeys, ObserveKeys} from '../../src/';
import Key from '../support/Key';

describe('Forcing observing key events using ObserveKeys:', function () {
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

  describe('when ObserveKeys is not used and key events match Configuration.ignoreKeyEvents', () => {
    beforeEach(function () {
      this.wrapper = mount(
        <HotKeys keyMap={this.keyMap} handlers={this.handlers}>
          <input className="inputElement" />
        </HotKeys>
      );

      this.targetElement = new FocusableElement(this.wrapper, '.inputElement');
      this.targetElement.focus();
    });

    it('then ignores all key events', function() {
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

  describe('when ObserveKeys is used and key events match Configuration.ignoreEventsCondition', () => {
    describe('and no keys are specified', () => {
      beforeEach(function () {
        this.wrapper = mount(
          <HotKeys keyMap={this.keyMap} handlers={this.handlers}>
            <ObserveKeys>
              <input className="inputElement" />
            </ObserveKeys>
          </HotKeys>
        );

        this.targetElement = new FocusableElement(this.wrapper, '.inputElement');
        this.targetElement.focus();
      });

      it('then observes all key events', function() {
        this.targetElement.keyDown(Key.A);
        this.targetElement.keyPress(Key.A);
        this.targetElement.keyUp(Key.A);

        expect(this.handlerA).to.have.been.called;

        this.targetElement.keyDown(Key.B);
        this.targetElement.keyPress(Key.B);
        this.targetElement.keyUp(Key.B);

        expect(this.handlerB).to.have.been.called;
      });
    });

    describe('and the only option is used', () => {
      beforeEach(function () {
        this.wrapper = mount(
          <HotKeys keyMap={this.keyMap} handlers={this.handlers}>
            <ObserveKeys only={'a'}>
              <input className="inputElement" />
            </ObserveKeys>
          </HotKeys>
        );

        this.targetElement = new FocusableElement(this.wrapper, '.inputElement');
        this.targetElement.focus();
      });

      it('then observes all key events that match keys in the only option', function() {
        this.targetElement.keyDown(Key.A);
        this.targetElement.keyPress(Key.A);
        this.targetElement.keyUp(Key.A);

        expect(this.handlerA).to.have.been.called;

        this.targetElement.keyDown(Key.B);
        this.targetElement.keyPress(Key.B);
        this.targetElement.keyUp(Key.B);

        expect(this.handlerB).to.not.have.been.called;
      });
    });

    describe('and the except option is used', () => {
      beforeEach(function () {
        this.wrapper = mount(
          <HotKeys keyMap={this.keyMap} handlers={this.handlers}>
            <ObserveKeys except={'b'}>
              <input className="inputElement" />
            </ObserveKeys>
          </HotKeys>
        );

        this.targetElement = new FocusableElement(this.wrapper, '.inputElement');
        this.targetElement.focus();
      });

      it('then observes all key events that DON\'T match keys in the except option', function() {
        this.targetElement.keyDown(Key.A);
        this.targetElement.keyPress(Key.A);
        this.targetElement.keyUp(Key.A);

        expect(this.handlerA).to.have.been.called;

        this.targetElement.keyDown(Key.B);
        this.targetElement.keyPress(Key.B);
        this.targetElement.keyUp(Key.B);

        expect(this.handlerB).to.not.have.been.called;
      });
    });

    describe('and the only and the except option are used', () => {
      beforeEach(function () {
        this.wrapper = mount(
          <HotKeys keyMap={this.keyMap} handlers={this.handlers}>
            <ObserveKeys only={'a'} except={'b'}>
              <input className="inputElement" />
            </ObserveKeys>
          </HotKeys>
        );

        this.targetElement = new FocusableElement(this.wrapper, '.inputElement');
        this.targetElement.focus();
      });

      it('then observes all key events are in the only option and NOT in the except option', function() {
        this.targetElement.keyDown(Key.A);
        this.targetElement.keyPress(Key.A);
        this.targetElement.keyUp(Key.A);

        expect(this.handlerA).to.have.been.called;

        this.targetElement.keyDown(Key.B);
        this.targetElement.keyPress(Key.B);
        this.targetElement.keyUp(Key.B);

        expect(this.handlerB).to.not.have.been.called;

        this.targetElement.keyDown(Key.C);
        this.targetElement.keyPress(Key.C);
        this.targetElement.keyUp(Key.C);

        expect(this.handlerC).to.not.have.been.called;
      });
    });
  });
});
