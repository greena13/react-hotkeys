import React from 'react';
import {mount} from 'enzyme';
import {expect} from 'chai';
import sinon from 'sinon';

import FocusableElement from '../support/FocusableElement';

import KeyCode from '../support/Key';
import HotKeys from '../../src/HotKeys';

describe('Matching single hotkeys:', function () {
  describe('when the actions are triggered by the keypress event', () => {
    beforeEach(function () {
      this.keyMap = {
        'ACTION1': 'a',
        'ACTION2': 'b',
      };

      this.action1Handler = sinon.spy();
      this.action2Handler = sinon.spy();

      const handlers = {
        'ACTION1': this.action1Handler,
        'ACTION2': this.action2Handler,
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
    });

    describe('when NO key events have occurred', function () {
      it('then no handlers are called', function() {
        expect(this.action1Handler).to.not.have.been.called;
      });
    });

    describe('when a hot key keydown event occurs', function () {
      beforeEach(function () {
        this.targetElement.keyDown(KeyCode.A);
      });

      it('then the matching handler is called once', function() {
        expect(this.action1Handler).to.not.have.been.called;
      });
    });

    describe('when a hotkey keypress event occurs', function () {

      beforeEach(function () {
        this.targetElement.keyDown(KeyCode.A);
        this.targetElement.keyPress(KeyCode.A);
      });

      it('then the matching handler is called once', function() {
        expect(this.action1Handler).to.have.been.calledOnce;
      });
    });

    describe('when a hotkey keyup event occurs', function () {
      beforeEach(function () {
        this.targetElement.keyDown(KeyCode.A);
        this.targetElement.keyPress(KeyCode.A);
        this.targetElement.keyUp(KeyCode.A);
      });

      it('then the matching handler is not called again', function() {
        expect(this.action1Handler).to.have.been.calledOnce;
      });
    });

    describe('when a particular hotkey is pressed twice', function () {
      beforeEach(function () {
        this.targetElement.keyDown(KeyCode.A);
        this.targetElement.keyPress(KeyCode.A);
        this.targetElement.keyUp(KeyCode.A);

        this.targetElement.keyDown(KeyCode.A);
      });

      it('then the matching handler is called again on the second keypress', function() {
        expect(this.action1Handler).to.have.been.calledOnce;

        this.targetElement.keyPress(KeyCode.A);
        this.targetElement.keyUp(KeyCode.A);

        expect(this.action1Handler).to.have.been.calledTwice;
      });
    });

    describe('when one hotkey is pressed and then another', function () {
      it('then the first hotkey\'s handler is called followed by the second hotkey\'s', function() {
        this.targetElement.keyDown(KeyCode.A);
        this.targetElement.keyPress(KeyCode.A);
        this.targetElement.keyUp(KeyCode.A);

        expect(this.action1Handler).to.have.been.calledOnce;
        expect(this.action2Handler).to.not.have.been.called;

        this.targetElement.keyDown(KeyCode.B);
        this.targetElement.keyPress(KeyCode.B);
        this.targetElement.keyUp(KeyCode.B);

        expect(this.action1Handler).to.have.been.calledOnce;
        expect(this.action2Handler).to.have.been.calledOnce;
      });
    });

    describe('when one hotkey is pressed and then a non-hotkey', function () {
      it('then the hotkey\'s handler is called', function() {
        this.targetElement.keyDown(KeyCode.A);
        this.targetElement.keyPress(KeyCode.A);
        this.targetElement.keyUp(KeyCode.A);

        expect(this.action1Handler).to.have.been.calledOnce;
        expect(this.action2Handler).to.not.have.been.called;

        this.targetElement.keyDown(KeyCode.C);
        this.targetElement.keyPress(KeyCode.C);
        this.targetElement.keyUp(KeyCode.C);

        expect(this.action1Handler).to.have.been.calledOnce;
        expect(this.action2Handler).to.not.have.been.called;
      });
    });

    describe('when one hotkey is pressed down and then another', function () {
      describe('and the first hotkey is released and then the second', () => {
        it('then the first hotkey\'s handler is called followed by the second hotkey\'s', function() {
          this.targetElement.keyDown(KeyCode.A);
          this.targetElement.keyPress(KeyCode.A);

          expect(this.action1Handler).to.have.been.calledOnce;
          expect(this.action2Handler).to.not.have.been.called;

          this.targetElement.keyDown(KeyCode.B);
          this.targetElement.keyPress(KeyCode.B);

          expect(this.action1Handler).to.have.been.calledOnce;
          expect(this.action2Handler).to.have.been.calledOnce;

          this.targetElement.keyUp(KeyCode.A);
          this.targetElement.keyUp(KeyCode.B);

          expect(this.action1Handler).to.have.been.calledOnce;
          expect(this.action2Handler).to.have.been.calledOnce;
        });
      });

      describe('and the second hotkey is released and then the first', () => {
        it('then the first hotkey\'s handler is called followed by the second hotkey\'s', function() {
          this.targetElement.keyDown(KeyCode.A);
          this.targetElement.keyPress(KeyCode.A);

          expect(this.action1Handler).to.have.been.calledOnce;
          expect(this.action2Handler).to.not.have.been.called;

          this.targetElement.keyDown(KeyCode.B);
          this.targetElement.keyPress(KeyCode.B);

          expect(this.action1Handler).to.have.been.calledOnce;
          expect(this.action2Handler).to.have.been.calledOnce;

          this.targetElement.keyUp(KeyCode.B);
          this.targetElement.keyUp(KeyCode.A);

          expect(this.action1Handler).to.have.been.calledOnce;
          expect(this.action2Handler).to.have.been.calledOnce;
        });
      });
    });

    describe('when one hotkey is pressed down and then a non-hotkey', function () {
      describe('and the hotkey is released and then the non-hotkey', () => {
        it('then the hotkey\'s handler is called', function() {
          this.targetElement.keyDown(KeyCode.A);
          this.targetElement.keyPress(KeyCode.A);

          expect(this.action1Handler).to.have.been.calledOnce;
          expect(this.action2Handler).to.not.have.been.called;

          this.targetElement.keyDown(KeyCode.C);
          this.targetElement.keyPress(KeyCode.C);

          expect(this.action1Handler).to.have.been.calledOnce;
          expect(this.action2Handler).to.not.have.been.called;

          this.targetElement.keyUp(KeyCode.A);
          this.targetElement.keyUp(KeyCode.C);

          expect(this.action1Handler).to.have.been.calledOnce;
          expect(this.action2Handler).to.not.have.been.called;
        });
      });

      describe('and the non-hotkey is released and then the hotkey', () => {
        it('then the hotkey\'s handler is called', function() {
          this.targetElement.keyDown(KeyCode.A);
          this.targetElement.keyPress(KeyCode.A);

          expect(this.action1Handler).to.have.been.calledOnce;
          expect(this.action2Handler).to.not.have.been.called;

          this.targetElement.keyDown(KeyCode.C);
          this.targetElement.keyPress(KeyCode.C);

          expect(this.action1Handler).to.have.been.calledOnce;
          expect(this.action2Handler).to.not.have.been.called;

          this.targetElement.keyUp(KeyCode.C);
          this.targetElement.keyUp(KeyCode.A);

          expect(this.action1Handler).to.have.been.calledOnce;
          expect(this.action2Handler).to.not.have.been.called;
        });
      });
    });
  });

  describe('when the actions are triggered by the keydown event', () => {
    beforeEach(function () {
      this.keyMap = {
        'ACTION1': { sequence: 'a', action: 'keydown' },
        'ACTION2': { sequence: 'b', action: 'keydown' }
      };

      this.action1Handler = sinon.spy();
      this.action2Handler = sinon.spy();

      const handlers = {
        'ACTION1': this.action1Handler,
        'ACTION2': this.action2Handler,
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
    });

    describe('when NO key events have occurred', function () {
      it('then no handlers are called', function() {
        expect(this.action1Handler).to.not.have.been.called;
      });
    });

    describe('when a hot key keydown event occurs', function () {
      beforeEach(function () {
        this.targetElement.keyDown(KeyCode.A);
      });

      it('then the matching handler is called once', function() {
        expect(this.action1Handler).to.have.been.calledOnce;
      });
    });

    describe('when a hotkey keypress event occurs', function () {
      beforeEach(function () {
        this.targetElement.keyDown(KeyCode.A);
        this.targetElement.keyPress(KeyCode.A);
      });

      it('then the matching handler is called', function() {
        expect(this.action1Handler).to.have.been.calledOnce;
      });
    });

    describe('when a hotkey keyup event occurs', function () {
      beforeEach(function () {
        this.targetElement.keyDown(KeyCode.A);
        this.targetElement.keyPress(KeyCode.A);
        this.targetElement.keyUp(KeyCode.A);
      });

      it('then the matching handler is NOT called again', function() {
        expect(this.action1Handler).to.have.been.calledOnce;
      });
    });

    describe('when a particular hotkey is pressed twice', function () {
      beforeEach(function () {
        this.targetElement.keyDown(KeyCode.A);
        this.targetElement.keyPress(KeyCode.A);
        this.targetElement.keyUp(KeyCode.A);

      });

      it('then the matching handler is called again on the second keydown', function() {
        expect(this.action1Handler).to.have.been.calledOnce;

        this.targetElement.keyDown(KeyCode.A);

        expect(this.action1Handler).to.have.been.calledTwice;

        this.targetElement.keyPress(KeyCode.A);
        this.targetElement.keyUp(KeyCode.A);

        expect(this.action1Handler).to.have.been.calledTwice;
      });
    });

    describe('when one hotkey is pressed and then another', function () {
      it('then the first hotkey\'s handler is called followed by the second hotkey\'s', function() {
        this.targetElement.keyDown(KeyCode.A);
        this.targetElement.keyPress(KeyCode.A);
        this.targetElement.keyUp(KeyCode.A);

        expect(this.action1Handler).to.have.been.calledOnce;
        expect(this.action2Handler).to.not.have.been.called;

        this.targetElement.keyDown(KeyCode.B);
        this.targetElement.keyPress(KeyCode.B);
        this.targetElement.keyUp(KeyCode.B);

        expect(this.action1Handler).to.have.been.calledOnce;
        expect(this.action2Handler).to.have.been.calledOnce;
      });
    });

    describe('when one hotkey is pressed and then a non-hotkey', function () {
      it('then the hotkey\'s handler is called', function() {
        this.targetElement.keyDown(KeyCode.A);
        this.targetElement.keyPress(KeyCode.A);
        this.targetElement.keyUp(KeyCode.A);

        expect(this.action1Handler).to.have.been.calledOnce;
        expect(this.action2Handler).to.not.have.been.called;

        this.targetElement.keyDown(KeyCode.C);
        this.targetElement.keyPress(KeyCode.C);
        this.targetElement.keyUp(KeyCode.C);

        expect(this.action1Handler).to.have.been.calledOnce;
        expect(this.action2Handler).to.not.have.been.called;
      });
    });

    describe('when one hotkey is pressed down and then another', function () {
      describe('and the first hotkey is released and then the second', () => {
        it('then the first hotkey\'s handler is called followed by the second hotkey\'s', function() {
          this.targetElement.keyDown(KeyCode.A);
          this.targetElement.keyPress(KeyCode.A);

          expect(this.action1Handler).to.have.been.calledOnce;
          expect(this.action2Handler).to.not.have.been.called;

          this.targetElement.keyDown(KeyCode.B);
          this.targetElement.keyPress(KeyCode.B);

          expect(this.action1Handler).to.have.been.calledOnce;
          expect(this.action2Handler).to.have.been.calledOnce;

          this.targetElement.keyUp(KeyCode.A);
          this.targetElement.keyUp(KeyCode.B);

          expect(this.action1Handler).to.have.been.calledOnce;
          expect(this.action2Handler).to.have.been.calledOnce;
        });
      });

      describe('and the second hotkey is released and then the first', () => {
        it('then the first hotkey\'s handler is called followed by the second hotkey\'s', function() {
          this.targetElement.keyDown(KeyCode.A);
          this.targetElement.keyPress(KeyCode.A);

          expect(this.action1Handler).to.have.been.calledOnce;
          expect(this.action2Handler).to.not.have.been.called;

          this.targetElement.keyDown(KeyCode.B);
          this.targetElement.keyPress(KeyCode.B);

          expect(this.action1Handler).to.have.been.calledOnce;
          expect(this.action2Handler).to.have.been.calledOnce;

          this.targetElement.keyUp(KeyCode.B);
          this.targetElement.keyUp(KeyCode.A);

          expect(this.action1Handler).to.have.been.calledOnce;
          expect(this.action2Handler).to.have.been.calledOnce;
        });
      });
    });

    describe('when one hotkey is pressed down and then a non-hotkey', function () {
      describe('and the hotkey is released and then the non-hotkey', () => {
        it('then the hotkey\'s handler is called', function() {
          this.targetElement.keyDown(KeyCode.A);
          this.targetElement.keyPress(KeyCode.A);

          expect(this.action1Handler).to.have.been.calledOnce;
          expect(this.action2Handler).to.not.have.been.called;

          this.targetElement.keyDown(KeyCode.C);
          this.targetElement.keyPress(KeyCode.C);

          expect(this.action1Handler).to.have.been.calledOnce;
          expect(this.action2Handler).to.not.have.been.called;

          this.targetElement.keyUp(KeyCode.A);
          this.targetElement.keyUp(KeyCode.C);

          expect(this.action1Handler).to.have.been.calledOnce;
          expect(this.action2Handler).to.not.have.been.called;
        });
      });

      describe('and the non-hotkey is released and then the hotkey', () => {
        it('then the hotkey\'s handler is called', function() {
          this.targetElement.keyDown(KeyCode.A);
          this.targetElement.keyPress(KeyCode.A);

          expect(this.action1Handler).to.have.been.calledOnce;
          expect(this.action2Handler).to.not.have.been.called;

          this.targetElement.keyDown(KeyCode.C);
          this.targetElement.keyPress(KeyCode.C);

          expect(this.action1Handler).to.have.been.calledOnce;
          expect(this.action2Handler).to.not.have.been.called;

          this.targetElement.keyUp(KeyCode.C);
          this.targetElement.keyUp(KeyCode.A);

          expect(this.action1Handler).to.have.been.calledOnce;
          expect(this.action2Handler).to.not.have.been.called;
        });
      });
    });
  });

  describe('when the actions are triggered by the keyup event', () => {
    beforeEach(function () {
      this.keyMap = {
        'ACTION1': { sequence: 'a', action: 'keyup' },
        'ACTION2': { sequence: 'b', action: 'keyup' }
      };

      this.action1Handler = sinon.spy();
      this.action2Handler = sinon.spy();

      const handlers = {
        'ACTION1': this.action1Handler,
        'ACTION2': this.action2Handler,
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
    });

    describe('when NO key events have occurred', function () {
      it('then no handlers are called', function() {
        expect(this.action1Handler).to.not.have.been.called;
      });
    });

    describe('when a hot key keydown event occurs', function () {
      beforeEach(function () {
        this.targetElement.keyDown(KeyCode.A);
      });

      it('then no handlers are called', function() {
        expect(this.action1Handler).to.not.have.been.called;
      });
    });

    describe('when a hotkey keypress event occurs', function () {
      beforeEach(function () {
        this.targetElement.keyDown(KeyCode.A);
        this.targetElement.keyPress(KeyCode.A);
      });

      it('then no handlers are called', function() {
        expect(this.action1Handler).to.not.have.been.called;
      });
    });

    describe('when a hotkey keyup event occurs', function () {
      beforeEach(function () {
        this.targetElement.keyDown(KeyCode.A);
        this.targetElement.keyPress(KeyCode.A);
        this.targetElement.keyUp(KeyCode.A);
      });

      it('then the matching handler is called', function() {
        expect(this.action1Handler).to.have.been.calledOnce;
      });
    });

    describe('when a particular hotkey is pressed twice', function () {
      beforeEach(function () {
        this.targetElement.keyDown(KeyCode.A);
        this.targetElement.keyPress(KeyCode.A);
        this.targetElement.keyUp(KeyCode.A);

      });

      it('then the matching handler is called again on the second keyup', function() {
        this.targetElement.keyDown(KeyCode.A);
        this.targetElement.keyPress(KeyCode.A);

        expect(this.action1Handler).to.have.been.calledOnce;

        this.targetElement.keyUp(KeyCode.A);

        expect(this.action1Handler).to.have.been.calledTwice;
      });
    });

    describe('when one hotkey is pressed and then another', function () {
      it('then the first hotkey\'s handler is called followed by the second hotkey\'s', function() {
        this.targetElement.keyDown(KeyCode.A);
        this.targetElement.keyPress(KeyCode.A);
        this.targetElement.keyUp(KeyCode.A);

        expect(this.action1Handler).to.have.been.calledOnce;
        expect(this.action2Handler).to.not.have.been.called;

        this.targetElement.keyDown(KeyCode.B);
        this.targetElement.keyPress(KeyCode.B);
        this.targetElement.keyUp(KeyCode.B);

        expect(this.action1Handler).to.have.been.calledOnce;
        expect(this.action2Handler).to.have.been.calledOnce;
      });
    });

    describe('when one hotkey is pressed and then a non-hotkey', function () {
      it('then the first hotkey\'s handler is called', function() {
        this.targetElement.keyDown(KeyCode.A);
        this.targetElement.keyPress(KeyCode.A);
        this.targetElement.keyUp(KeyCode.A);

        expect(this.action1Handler).to.have.been.calledOnce;
        expect(this.action2Handler).to.not.have.been.called;

        this.targetElement.keyDown(KeyCode.C);
        this.targetElement.keyPress(KeyCode.C);
        this.targetElement.keyUp(KeyCode.C);

        expect(this.action1Handler).to.have.been.calledOnce;
        expect(this.action2Handler).to.not.have.been.called;
      });
    });

    describe('when one hotkey is pressed down and then another', function () {
      describe('and the first hotkey is released and then the second', () => {
        it('then the first hotkey\'s handler is called followed by the second hotkey\'s', function() {
          this.targetElement.keyDown(KeyCode.A);
          this.targetElement.keyPress(KeyCode.A);

          expect(this.action1Handler).to.not.have.been.called;
          expect(this.action2Handler).to.not.have.been.called;

          this.targetElement.keyDown(KeyCode.B);
          this.targetElement.keyPress(KeyCode.B);

          this.targetElement.keyUp(KeyCode.A);

          expect(this.action1Handler).to.have.been.calledOnce;
          expect(this.action2Handler).to.not.have.been.called;

          this.targetElement.keyUp(KeyCode.B);

          expect(this.action1Handler).to.have.been.calledOnce;
          expect(this.action2Handler).to.have.been.calledOnce;
        });
      });

      describe('and the second hotkey is released and then the first', () => {
        it('then the second hotkey\'s handler is called followed by the first hotkey\'s', function() {
          this.targetElement.keyDown(KeyCode.A);
          this.targetElement.keyPress(KeyCode.A);

          expect(this.action1Handler).to.not.have.been.called;
          expect(this.action2Handler).to.not.have.been.called;

          this.targetElement.keyDown(KeyCode.B);
          this.targetElement.keyPress(KeyCode.B);

          this.targetElement.keyUp(KeyCode.B);

          expect(this.action2Handler).to.have.been.calledOnce;
          expect(this.action1Handler).to.not.have.been.called;

          this.targetElement.keyUp(KeyCode.A);

          expect(this.action2Handler).to.have.been.calledOnce;
          expect(this.action1Handler).to.have.been.calledOnce;
        });
      });
    });

    describe('when one hotkey is pressed down, followed by a non-hotkey', function () {
      describe('and the hotkey is released and then the non-hotkey', () => {
        it('then the hotkey\'s handler is called', function() {
          this.targetElement.keyDown(KeyCode.A);
          this.targetElement.keyPress(KeyCode.A);

          expect(this.action1Handler).to.not.have.been.called;
          expect(this.action2Handler).to.not.have.been.called;

          this.targetElement.keyDown(KeyCode.ENTER);

          this.targetElement.keyUp(KeyCode.A);

          expect(this.action1Handler).to.have.been.calledOnce;
          expect(this.action2Handler).to.not.have.been.called;

          this.targetElement.keyUp(KeyCode.ENTER);

          expect(this.action1Handler).to.have.been.calledOnce;
          expect(this.action2Handler).to.not.have.been.called;
        });
      });

      describe('and the non-hotkey is released and then the hotkey', () => {
        it('then the hotkey\'s handler is called', function() {
          this.targetElement.keyDown(KeyCode.A);
          this.targetElement.keyPress(KeyCode.A);

          this.targetElement.keyDown(KeyCode.ENTER);
          this.targetElement.keyUp(KeyCode.ENTER);

          expect(this.action1Handler).to.not.have.been.called;
          expect(this.action2Handler).to.not.have.been.called;

          this.targetElement.keyUp(KeyCode.A);

          expect(this.action1Handler).to.have.been.called;
          expect(this.action2Handler).to.not.have.been.called;
        });
      });
    });
  });
});
