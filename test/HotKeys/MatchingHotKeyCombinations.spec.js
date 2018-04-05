import React from 'react';
import {mount} from 'enzyme';
import {expect} from 'chai';
import sinon from 'sinon';

import FocusableElement from '../support/FocusableElement';

import KeyCode from '../support/Key';
import HotKeys from '../../lib/HotKeys';

describe('Matching hotkey combinations:', function () {
  describe('when the actions are triggered by the keypress event', () => {
    beforeEach(function () {
      this.keyMap = {
        'COMBO1': 'enter+tab',
      };

      this.comboHandler = sinon.spy();

      const handlers = {
        'COMBO1': this.comboHandler,
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

    describe('When NO key events have occurred', function () {
      it('then no handlers are called', function() {
        expect(this.comboHandler).to.not.have.been.called;
      });
    });

    describe('when the first key in the combination is pressed and released', function () {
      beforeEach(function () {
        this.targetElement.keyDown(KeyCode.ENTER);
        this.targetElement.keyPress(KeyCode.ENTER);
        this.targetElement.keyUp(KeyCode.ENTER);
      });

      it('then no handlers are called', function() {
        expect(this.comboHandler).to.not.have.been.called;
      });
    });

    describe('when the second key in the combination is pressed after the first is released', function () {
      beforeEach(function () {
        this.targetElement.keyDown(KeyCode.ENTER);
        this.targetElement.keyPress(KeyCode.ENTER);
        this.targetElement.keyUp(KeyCode.ENTER);

        this.targetElement.keyDown(KeyCode.TAB);
        this.targetElement.keyPress(KeyCode.TAB);
        this.targetElement.keyUp(KeyCode.TAB);
      });

      it('then no handlers are called', function() {
        expect(this.comboHandler).to.not.have.been.called;
      });
    });

    describe('when the first key is pressed and held', function () {
      describe('and the keydown event for the second key in the combination occurs', () => {
        beforeEach(function () {
          this.targetElement.keyDown(KeyCode.ENTER);
          this.targetElement.keyPress(KeyCode.ENTER);

          this.targetElement.keyDown(KeyCode.TAB);
        });

        it('then no handlers are called', function() {
          expect(this.comboHandler).to.not.have.been.called;
        });
      });

      describe('and the keypress event for the second key in the combination occurs', () => {
        beforeEach(function () {
          this.targetElement.keyDown(KeyCode.ENTER);
          this.targetElement.keyPress(KeyCode.ENTER);

          this.targetElement.keyDown(KeyCode.TAB);
          this.targetElement.keyPress(KeyCode.TAB);
        });

        it('then calls the key combination\'s handler', function() {
          expect(this.comboHandler).to.have.been.calledOnce;
        });
      });

      describe('and the keyup event for the second key in the combination occurs', () => {
        beforeEach(function () {
          this.targetElement.keyDown(KeyCode.ENTER);
          this.targetElement.keyPress(KeyCode.ENTER);

          this.targetElement.keyDown(KeyCode.TAB);
          this.targetElement.keyPress(KeyCode.TAB);
          this.targetElement.keyUp(KeyCode.TAB);

          this.targetElement.keyUp(KeyCode.ENTER);
        });

        it('then does NOT call the key combination\'s handler again', function() {
          expect(this.comboHandler).to.have.been.calledOnce;
        });
      });
    });

    describe('when the keys involved in the combination are released in an order different to how they appear in the combination', () => {
      beforeEach(function () {
        this.targetElement.keyDown(KeyCode.TAB);
        this.targetElement.keyPress(KeyCode.TAB);

        this.targetElement.keyDown(KeyCode.ENTER);
        this.targetElement.keyPress(KeyCode.ENTER);

        this.targetElement.keyUp(KeyCode.TAB);
        this.targetElement.keyUp(KeyCode.ENTER);
      });

      it('then calls the key combination\'s handler', function() {
        expect(this.comboHandler).to.have.been.calledOnce;
      });
    });

    describe('when the keys are released in an order different than when they are pressed', () => {
      beforeEach(function () {
        this.targetElement.keyDown(KeyCode.ENTER);
        this.targetElement.keyPress(KeyCode.ENTER);

        this.targetElement.keyDown(KeyCode.TAB);
        this.targetElement.keyPress(KeyCode.TAB);

        this.targetElement.keyUp(KeyCode.TAB);
        this.targetElement.keyUp(KeyCode.ENTER);
      });

      it('then calls the key combination\'s handler', function() {
        expect(this.comboHandler).to.have.been.calledOnce;
      });
    });

    describe('when the combination is used twice', () => {
      beforeEach(function () {
        for(let i = 0; i < 2; i++) {
          this.targetElement.keyDown(KeyCode.ENTER);
          this.targetElement.keyPress(KeyCode.ENTER);

          this.targetElement.keyDown(KeyCode.TAB);
          this.targetElement.keyPress(KeyCode.TAB);

          this.targetElement.keyUp(KeyCode.TAB);
          this.targetElement.keyUp(KeyCode.ENTER);
        }
      });

      it('then calls the key combination\'s handler twice', function() {
        expect(this.comboHandler).to.have.been.calledTwice;
      });
    });

    describe('when a key not in the combination is already held down', () => {

      describe('and released afterwards', () => {
        beforeEach(function () {
          this.targetElement.keyDown(KeyCode.A);
          this.targetElement.keyPress(KeyCode.A);

          this.targetElement.keyDown(KeyCode.ENTER);
          this.targetElement.keyPress(KeyCode.ENTER);

          this.targetElement.keyDown(KeyCode.TAB);
          this.targetElement.keyPress(KeyCode.TAB);

          this.targetElement.keyUp(KeyCode.TAB);
          this.targetElement.keyUp(KeyCode.ENTER);

          this.targetElement.keyUp(KeyCode.A);
        });

        it('then calls the key combination\'s handler', function() {
          expect(this.comboHandler).to.have.been.calledOnce;
        });
      });
    });

  });
});
