import React from 'react';
import {mount} from 'enzyme';
import {expect} from 'chai';
import sinon from 'sinon';

import FocusableElement from '../support/FocusableElement';

import KeyCode from '../support/Key';
import HotKeys from '../../lib/HotKeys';

describe('Matching single hotkeys:', function () {
  describe('when the actions are triggered by the keypress event', () => {
    beforeEach(function () {
      this.keyMap = {
        'ENTER': 'enter',
        'TAB': 'tab',
      };

      this.enterHandler = sinon.spy();
      this.tabHandler = sinon.spy();

      const handlers = {
        'ENTER': this.enterHandler,
        'TAB': this.tabHandler,
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
        expect(this.enterHandler).to.not.have.been.called;
      });
    });

    describe('when a hot key keydown event occurs', function () {
      beforeEach(function () {
        this.targetElement.keyDown(KeyCode.ENTER);
      });

      it('then the matching handler is called once', function() {
        expect(this.enterHandler).to.not.have.been.called;
      });
    });

    describe('when a hotkey keypress event occurs', function () {

      beforeEach(function () {
        this.targetElement.keyDown(KeyCode.ENTER);
        this.targetElement.keyPress(KeyCode.ENTER);
      });

      it('then the matching handler is called once', function() {
        expect(this.enterHandler).to.have.been.calledOnce;
      });
    });

    describe('when a hotkey keyup event occurs', function () {
      beforeEach(function () {
        this.targetElement.keyDown(KeyCode.ENTER);
        this.targetElement.keyPress(KeyCode.ENTER);
        this.targetElement.keyUp(KeyCode.ENTER);
      });

      it('then the matching handler is not called again', function() {
        expect(this.enterHandler).to.have.been.calledOnce;
      });
    });

    describe('when a particular hotkey is pressed twice', function () {
      beforeEach(function () {
        this.targetElement.keyDown(KeyCode.ENTER);
        this.targetElement.keyPress(KeyCode.ENTER);
        this.targetElement.keyUp(KeyCode.ENTER);

        this.targetElement.keyDown(KeyCode.ENTER);
      });

      it('then the matching handler is called again on the second keypress', function() {
        expect(this.enterHandler).to.have.been.calledOnce;

        this.targetElement.keyPress(KeyCode.ENTER);
        this.targetElement.keyUp(KeyCode.ENTER);

        expect(this.enterHandler).to.have.been.calledTwice;
      });
    });

    describe('when one hotkey is pressed and then another', function () {
      it('then the first hotkey\'s handler is called followed by the second hotkey\'s', function() {
        this.targetElement.keyDown(KeyCode.ENTER);
        this.targetElement.keyPress(KeyCode.ENTER);
        this.targetElement.keyUp(KeyCode.ENTER);

        expect(this.enterHandler).to.have.been.calledOnce;
        expect(this.tabHandler).to.not.have.been.called;

        this.targetElement.keyDown(KeyCode.TAB);
        this.targetElement.keyPress(KeyCode.TAB);
        this.targetElement.keyUp(KeyCode.TAB);

        expect(this.enterHandler).to.have.been.calledOnce;
        expect(this.tabHandler).to.have.been.calledOnce;
      });
    });

    describe('when one hotkey is pressed and then a non-hotkey', function () {
      it('then the hotkey\'s handler is called', function() {
        this.targetElement.keyDown(KeyCode.ENTER);
        this.targetElement.keyPress(KeyCode.ENTER);
        this.targetElement.keyUp(KeyCode.ENTER);

        expect(this.enterHandler).to.have.been.calledOnce;
        expect(this.tabHandler).to.not.have.been.called;

        this.targetElement.keyDown(KeyCode.A);
        this.targetElement.keyPress(KeyCode.A);
        this.targetElement.keyUp(KeyCode.A);

        expect(this.enterHandler).to.have.been.calledOnce;
        expect(this.tabHandler).to.not.have.been.called;
      });
    });

    describe('when one hotkey is pressed down and then another', function () {
      describe('and the first hotkey is released and then the second', () => {
        it('then the first hotkey\'s handler is called followed by the second hotkey\'s', function() {
          this.targetElement.keyDown(KeyCode.ENTER);
          this.targetElement.keyPress(KeyCode.ENTER);

          expect(this.enterHandler).to.have.been.calledOnce;
          expect(this.tabHandler).to.not.have.been.called;

          this.targetElement.keyDown(KeyCode.TAB);
          this.targetElement.keyPress(KeyCode.TAB);

          expect(this.enterHandler).to.have.been.calledOnce;
          expect(this.tabHandler).to.have.been.calledOnce;

          this.targetElement.keyUp(KeyCode.ENTER);
          this.targetElement.keyUp(KeyCode.TAB);

          expect(this.enterHandler).to.have.been.calledOnce;
          expect(this.tabHandler).to.have.been.calledOnce;
        });
      });

      describe('and the second hotkey is released and then the first', () => {
        it('then the first hotkey\'s handler is called followed by the second hotkey\'s', function() {
          this.targetElement.keyDown(KeyCode.ENTER);
          this.targetElement.keyPress(KeyCode.ENTER);

          expect(this.enterHandler).to.have.been.calledOnce;
          expect(this.tabHandler).to.not.have.been.called;

          this.targetElement.keyDown(KeyCode.TAB);
          this.targetElement.keyPress(KeyCode.TAB);

          expect(this.enterHandler).to.have.been.calledOnce;
          expect(this.tabHandler).to.have.been.calledOnce;

          this.targetElement.keyUp(KeyCode.TAB);
          this.targetElement.keyUp(KeyCode.ENTER);

          expect(this.enterHandler).to.have.been.calledOnce;
          expect(this.tabHandler).to.have.been.calledOnce;
        });
      });
    });

    describe('when one hotkey is pressed down and then a non-hotkey', function () {
      describe('and the hotkey is released and then the non-hotkey', () => {
        it('then the hotkey\'s handler is called', function() {
          this.targetElement.keyDown(KeyCode.ENTER);
          this.targetElement.keyPress(KeyCode.ENTER);

          expect(this.enterHandler).to.have.been.calledOnce;
          expect(this.tabHandler).to.not.have.been.called;

          this.targetElement.keyDown(KeyCode.A);
          this.targetElement.keyPress(KeyCode.A);

          expect(this.enterHandler).to.have.been.calledOnce;
          expect(this.tabHandler).to.not.have.been.called;

          this.targetElement.keyUp(KeyCode.ENTER);
          this.targetElement.keyUp(KeyCode.A);

          expect(this.enterHandler).to.have.been.calledOnce;
          expect(this.tabHandler).to.not.have.been.called;
        });
      });

      describe('and the non-hotkey is released and then the hotkey', () => {
        it('then the hotkey\'s handler is called', function() {
          this.targetElement.keyDown(KeyCode.ENTER);
          this.targetElement.keyPress(KeyCode.ENTER);

          expect(this.enterHandler).to.have.been.calledOnce;
          expect(this.tabHandler).to.not.have.been.called;

          this.targetElement.keyDown(KeyCode.A);
          this.targetElement.keyPress(KeyCode.A);

          expect(this.enterHandler).to.have.been.calledOnce;
          expect(this.tabHandler).to.not.have.been.called;

          this.targetElement.keyUp(KeyCode.A);
          this.targetElement.keyUp(KeyCode.ENTER);

          expect(this.enterHandler).to.have.been.calledOnce;
          expect(this.tabHandler).to.not.have.been.called;
        });
      });
    });
  });

  describe('when the actions are triggered by the keydown event', () => {
    beforeEach(function () {
      this.keyMap = {
        'ENTER': { sequence: 'enter', action: 'keydown' },
        'TAB': { sequence: 'tab', action: 'keydown' }
      };

      this.enterHandler = sinon.spy();
      this.tabHandler = sinon.spy();

      const handlers = {
        'ENTER': this.enterHandler,
        'TAB': this.tabHandler,
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
        expect(this.enterHandler).to.not.have.been.called;
      });
    });

    describe('when a hot key keydown event occurs', function () {
      beforeEach(function () {
        this.targetElement.keyDown(KeyCode.ENTER);
      });

      it('then the matching handler is called once', function() {
        expect(this.enterHandler).to.have.been.calledOnce;
      });
    });

    describe('when a hotkey keypress event occurs', function () {
      beforeEach(function () {
        this.targetElement.keyDown(KeyCode.ENTER);
        this.targetElement.keyPress(KeyCode.ENTER);
      });

      it('then the matching handler is called', function() {
        expect(this.enterHandler).to.have.been.calledOnce;
      });
    });

    describe('when a hotkey keyup event occurs', function () {
      beforeEach(function () {
        this.targetElement.keyDown(KeyCode.ENTER);
        this.targetElement.keyPress(KeyCode.ENTER);
        this.targetElement.keyUp(KeyCode.ENTER);
      });

      it('then the matching handler is NOT called again', function() {
        expect(this.enterHandler).to.have.been.calledOnce;
      });
    });

    describe('when a particular hotkey is pressed twice', function () {
      beforeEach(function () {
        this.targetElement.keyDown(KeyCode.ENTER);
        this.targetElement.keyPress(KeyCode.ENTER);
        this.targetElement.keyUp(KeyCode.ENTER);

      });

      it('then the matching handler is called again on the second keydown', function() {
        expect(this.enterHandler).to.have.been.calledOnce;

        this.targetElement.keyDown(KeyCode.ENTER);

        expect(this.enterHandler).to.have.been.calledTwice;

        this.targetElement.keyPress(KeyCode.ENTER);
        this.targetElement.keyUp(KeyCode.ENTER);

        expect(this.enterHandler).to.have.been.calledTwice;
      });
    });

    describe('when one hotkey is pressed and then another', function () {
      it('then the first hotkey\'s handler is called followed by the second hotkey\'s', function() {
        this.targetElement.keyDown(KeyCode.ENTER);
        this.targetElement.keyPress(KeyCode.ENTER);
        this.targetElement.keyUp(KeyCode.ENTER);

        expect(this.enterHandler).to.have.been.calledOnce;
        expect(this.tabHandler).to.not.have.been.called;

        this.targetElement.keyDown(KeyCode.TAB);
        this.targetElement.keyPress(KeyCode.TAB);
        this.targetElement.keyUp(KeyCode.TAB);

        expect(this.enterHandler).to.have.been.calledOnce;
        expect(this.tabHandler).to.have.been.calledOnce;
      });
    });

    describe('when one hotkey is pressed and then a non-hotkey', function () {
      it('then the hotkey\'s handler is called', function() {
        this.targetElement.keyDown(KeyCode.ENTER);
        this.targetElement.keyPress(KeyCode.ENTER);
        this.targetElement.keyUp(KeyCode.ENTER);

        expect(this.enterHandler).to.have.been.calledOnce;
        expect(this.tabHandler).to.not.have.been.called;

        this.targetElement.keyDown(KeyCode.A);
        this.targetElement.keyPress(KeyCode.A);
        this.targetElement.keyUp(KeyCode.A);

        expect(this.enterHandler).to.have.been.calledOnce;
        expect(this.tabHandler).to.not.have.been.called;
      });
    });

    describe('when one hotkey is pressed down and then another', function () {
      describe('and the first hotkey is released and then the second', () => {
        it('then the first hotkey\'s handler is called followed by the second hotkey\'s', function() {
          this.targetElement.keyDown(KeyCode.ENTER);
          this.targetElement.keyPress(KeyCode.ENTER);

          expect(this.enterHandler).to.have.been.calledOnce;
          expect(this.tabHandler).to.not.have.been.called;

          this.targetElement.keyDown(KeyCode.TAB);
          this.targetElement.keyPress(KeyCode.TAB);

          expect(this.enterHandler).to.have.been.calledOnce;
          expect(this.tabHandler).to.have.been.calledOnce;

          this.targetElement.keyUp(KeyCode.ENTER);
          this.targetElement.keyUp(KeyCode.TAB);

          expect(this.enterHandler).to.have.been.calledOnce;
          expect(this.tabHandler).to.have.been.calledOnce;
        });
      });

      describe('and the second hotkey is released and then the first', () => {
        it('then the first hotkey\'s handler is called followed by the second hotkey\'s', function() {
          this.targetElement.keyDown(KeyCode.ENTER);
          this.targetElement.keyPress(KeyCode.ENTER);

          expect(this.enterHandler).to.have.been.calledOnce;
          expect(this.tabHandler).to.not.have.been.called;

          this.targetElement.keyDown(KeyCode.TAB);
          this.targetElement.keyPress(KeyCode.TAB);

          expect(this.enterHandler).to.have.been.calledOnce;
          expect(this.tabHandler).to.have.been.calledOnce;

          this.targetElement.keyUp(KeyCode.TAB);
          this.targetElement.keyUp(KeyCode.ENTER);

          expect(this.enterHandler).to.have.been.calledOnce;
          expect(this.tabHandler).to.have.been.calledOnce;
        });
      });
    });

    describe('when one hotkey is pressed down and then a non-hotkey', function () {
      describe('and the hotkey is released and then the non-hotkey', () => {
        it('then the hotkey\'s handler is called', function() {
          this.targetElement.keyDown(KeyCode.ENTER);
          this.targetElement.keyPress(KeyCode.ENTER);

          expect(this.enterHandler).to.have.been.calledOnce;
          expect(this.tabHandler).to.not.have.been.called;

          this.targetElement.keyDown(KeyCode.A);
          this.targetElement.keyPress(KeyCode.A);

          expect(this.enterHandler).to.have.been.calledOnce;
          expect(this.tabHandler).to.not.have.been.called;

          this.targetElement.keyUp(KeyCode.ENTER);
          this.targetElement.keyUp(KeyCode.A);

          expect(this.enterHandler).to.have.been.calledOnce;
          expect(this.tabHandler).to.not.have.been.called;
        });
      });

      describe('and the non-hotkey is released and then the hotkey', () => {
        it('then the hotkey\'s handler is called', function() {
          this.targetElement.keyDown(KeyCode.ENTER);
          this.targetElement.keyPress(KeyCode.ENTER);

          expect(this.enterHandler).to.have.been.calledOnce;
          expect(this.tabHandler).to.not.have.been.called;

          this.targetElement.keyDown(KeyCode.A);
          this.targetElement.keyPress(KeyCode.A);

          expect(this.enterHandler).to.have.been.calledOnce;
          expect(this.tabHandler).to.not.have.been.called;

          this.targetElement.keyUp(KeyCode.A);
          this.targetElement.keyUp(KeyCode.ENTER);

          expect(this.enterHandler).to.have.been.calledOnce;
          expect(this.tabHandler).to.not.have.been.called;
        });
      });
    });
  });

  describe('when the actions are triggered by the keyup event', () => {
    beforeEach(function () {
      this.keyMap = {
        'ENTER': { sequence: 'enter', action: 'keyup' },
        'TAB': { sequence: 'tab', action: 'keyup' }
      };

      this.enterHandler = sinon.spy();
      this.tabHandler = sinon.spy();

      const handlers = {
        'ENTER': this.enterHandler,
        'TAB': this.tabHandler,
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
        expect(this.enterHandler).to.not.have.been.called;
      });
    });

    describe('when a hot key keydown event occurs', function () {
      beforeEach(function () {
        this.targetElement.keyDown(KeyCode.ENTER);
      });

      it('then no handlers are called', function() {
        expect(this.enterHandler).to.not.have.been.called;
      });
    });

    describe('when a hotkey keypress event occurs', function () {
      beforeEach(function () {
        this.targetElement.keyDown(KeyCode.ENTER);
        this.targetElement.keyPress(KeyCode.ENTER);
      });

      it('then no handlers are called', function() {
        expect(this.enterHandler).to.not.have.been.called;
      });
    });

    describe('when a hotkey keyup event occurs', function () {
      beforeEach(function () {
        this.targetElement.keyDown(KeyCode.ENTER);
        this.targetElement.keyPress(KeyCode.ENTER);
        this.targetElement.keyUp(KeyCode.ENTER);
      });

      it('then the matching handler is called', function() {
        expect(this.enterHandler).to.have.been.calledOnce;
      });
    });

    describe('when a particular hotkey is pressed twice', function () {
      beforeEach(function () {
        this.targetElement.keyDown(KeyCode.ENTER);
        this.targetElement.keyPress(KeyCode.ENTER);
        this.targetElement.keyUp(KeyCode.ENTER);

      });

      it('then the matching handler is called again on the second keyup', function() {
        this.targetElement.keyDown(KeyCode.ENTER);
        this.targetElement.keyPress(KeyCode.ENTER);

        expect(this.enterHandler).to.have.been.calledOnce;

        this.targetElement.keyUp(KeyCode.ENTER);

        expect(this.enterHandler).to.have.been.calledTwice;
      });
    });

    describe('when one hotkey is pressed and then another', function () {
      it('then the first hotkey\'s handler is called followed by the second hotkey\'s', function() {
        this.targetElement.keyDown(KeyCode.ENTER);
        this.targetElement.keyPress(KeyCode.ENTER);
        this.targetElement.keyUp(KeyCode.ENTER);

        expect(this.enterHandler).to.have.been.calledOnce;
        expect(this.tabHandler).to.not.have.been.called;

        this.targetElement.keyDown(KeyCode.TAB);
        this.targetElement.keyPress(KeyCode.TAB);
        this.targetElement.keyUp(KeyCode.TAB);

        expect(this.enterHandler).to.have.been.calledOnce;
        expect(this.tabHandler).to.have.been.calledOnce;
      });
    });

    describe('when one hotkey is pressed and then a non-hotkey', function () {
      it('then the first hotkey\'s handler is called', function() {
        this.targetElement.keyDown(KeyCode.ENTER);
        this.targetElement.keyPress(KeyCode.ENTER);
        this.targetElement.keyUp(KeyCode.ENTER);

        expect(this.enterHandler).to.have.been.calledOnce;
        expect(this.tabHandler).to.not.have.been.called;

        this.targetElement.keyDown(KeyCode.A);
        this.targetElement.keyPress(KeyCode.A);
        this.targetElement.keyUp(KeyCode.A);

        expect(this.enterHandler).to.have.been.calledOnce;
        expect(this.tabHandler).to.not.have.been.called;
      });
    });

    describe('when one hotkey is pressed down and then another', function () {
      describe('and the first hotkey is released and then the second', () => {
        it('then the first hotkey\'s handler is called followed by the second hotkey\'s', function() {
          this.targetElement.keyDown(KeyCode.ENTER);
          this.targetElement.keyPress(KeyCode.ENTER);

          expect(this.enterHandler).to.not.have.been.called;
          expect(this.tabHandler).to.not.have.been.called;

          this.targetElement.keyDown(KeyCode.TAB);
          this.targetElement.keyPress(KeyCode.TAB);

          this.targetElement.keyUp(KeyCode.ENTER);

          expect(this.enterHandler).to.have.been.calledOnce;
          expect(this.tabHandler).to.not.have.been.called;

          this.targetElement.keyUp(KeyCode.TAB);

          expect(this.enterHandler).to.have.been.calledOnce;
          expect(this.tabHandler).to.have.been.calledOnce;
        });
      });

      describe('and the second hotkey is released and then the first', () => {
        it('then the second hotkey\'s handler is called followed by the first hotkey\'s', function() {
          this.targetElement.keyDown(KeyCode.ENTER);
          this.targetElement.keyPress(KeyCode.ENTER);

          expect(this.enterHandler).to.not.have.been.called;
          expect(this.tabHandler).to.not.have.been.called;

          this.targetElement.keyDown(KeyCode.TAB);
          this.targetElement.keyPress(KeyCode.TAB);

          this.targetElement.keyUp(KeyCode.TAB);

          expect(this.tabHandler).to.have.been.calledOnce;
          expect(this.enterHandler).to.not.have.been.called;

          this.targetElement.keyUp(KeyCode.ENTER);

          expect(this.tabHandler).to.have.been.calledOnce;
          expect(this.enterHandler).to.have.been.calledOnce;
        });
      });
    });

    describe('when one hotkey is pressed down and then a non-hotkey', function () {
      describe('and the hotkey is released and then the non-hotkey', () => {
        it('then the hotkey\'s handler is called', function() {
          this.targetElement.keyDown(KeyCode.ENTER);
          this.targetElement.keyPress(KeyCode.ENTER);

          expect(this.enterHandler).to.not.have.been.called;
          expect(this.tabHandler).to.not.have.been.called;

          this.targetElement.keyDown(KeyCode.A);
          this.targetElement.keyPress(KeyCode.A);

          this.targetElement.keyUp(KeyCode.ENTER);

          expect(this.enterHandler).to.have.been.calledOnce;
          expect(this.tabHandler).to.not.have.been.called;

          this.targetElement.keyUp(KeyCode.A);

          expect(this.enterHandler).to.have.been.calledOnce;
          expect(this.tabHandler).to.not.have.been.called;
        });
      });

      describe('and the non-hotkey is released and then the hotkey', () => {
        it('then the hotkey\'s handler is called', function() {
          this.targetElement.keyDown(KeyCode.ENTER);
          this.targetElement.keyPress(KeyCode.ENTER);

          expect(this.enterHandler).to.not.have.been.called;
          expect(this.tabHandler).to.not.have.been.called;

          this.targetElement.keyDown(KeyCode.A);
          this.targetElement.keyPress(KeyCode.A);

          this.targetElement.keyUp(KeyCode.A);

          expect(this.tabHandler).to.not.have.been.called;
          expect(this.enterHandler).to.not.have.been.called;

          this.targetElement.keyUp(KeyCode.ENTER);

          expect(this.tabHandler).to.not.have.been.called;
          expect(this.enterHandler).to.have.been.calledOnce;
        });
      });
    });
  });
});
