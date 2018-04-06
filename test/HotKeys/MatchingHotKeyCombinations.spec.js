import React from 'react';
import {mount} from 'enzyme';
import {expect} from 'chai';
import sinon from 'sinon';

import FocusableElement from '../support/FocusableElement';

import KeyCode from '../support/Key';
import HotKeys from '../../lib/HotKeys';

describe('Matching hotkey combinations:', function () {
  describe('when the actions are triggered by the keydown event', function () {
    beforeEach(function () {
      this.keyMap = {
        'COMBO1': { sequence: 'enter+tab', action: 'keydown' },
        'COMBO2': { sequence: 'enter+tab+b', action: 'keydown' },
      };

      this.comboHandler = sinon.spy();
      this.longerCombinationHandler = sinon.spy();

      const handlers = {
        'COMBO1': this.comboHandler,
        'COMBO2': this.longerCombinationHandler,
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

    describe('and the first key is pressed and held', function () {
      describe('and the keydown event for the second key in the combination occurs', () => {
        beforeEach(function () {
          this.targetElement.keyDown(KeyCode.ENTER);
          this.targetElement.keyPress(KeyCode.ENTER);

          this.targetElement.keyDown(KeyCode.TAB);
        });

        it('then calls the key combination\'s handler', function() {
          expect(this.comboHandler).to.have.been.calledOnce;
        });
      });

      describe('and the keypress event for the second key in the combination occurs', () => {
        beforeEach(function () {
          this.targetElement.keyDown(KeyCode.ENTER);
          this.targetElement.keyPress(KeyCode.ENTER);

          this.targetElement.keyDown(KeyCode.TAB);
          this.targetElement.keyPress(KeyCode.TAB);
        });

        it('then does NOT call the key combination\'s handler again', function() {
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

    describe('and there is a combination that is a subset of a longer one', () => {
      describe('and the keys have been pressed to satisfy the shorter combination without releasing the keys', () => {
        beforeEach(function () {
          this.targetElement.keyDown(KeyCode.ENTER);
          this.targetElement.keyPress(KeyCode.ENTER);

          this.targetElement.keyDown(KeyCode.TAB);
          this.targetElement.keyPress(KeyCode.TAB);
        });

        it('then calls the shorter key combination\'s handler', function() {
          expect(this.comboHandler).to.have.been.calledOnce;
        });

        describe('and the remaining keys to satisfy the longer combination are pressed', () => {
          beforeEach(function () {
            this.targetElement.keyDown(KeyCode.B);
            this.targetElement.keyPress(KeyCode.B);
          });

          it('then calls the longer key combination\'s handler', function() {
            expect(this.longerCombinationHandler).to.have.been.calledOnce;
          });
        });
      });
    });
  });

  describe('when the actions are triggered by the keypress event', function () {
    beforeEach(function () {
      this.keyMap = {
        'COMBO1': { sequence: 'enter+tab', action: 'keypress' },
        'COMBO2': { sequence: 'enter+tab+b', action: 'keypress' },
      };

      this.comboHandler = sinon.spy();
      this.longerCombinationHandler = sinon.spy();

      const handlers = {
        'COMBO1': this.comboHandler,
        'COMBO2': this.longerCombinationHandler,
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

    describe('and the first key is pressed and held', function () {
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

      describe('and there is a combination that is a subset of a longer one', () => {
        describe('and the keys have been pressed to satisfy the shorter combination without releasing the keys', () => {
          beforeEach(function () {
            this.targetElement.keyDown(KeyCode.ENTER);
            this.targetElement.keyPress(KeyCode.ENTER);

            this.targetElement.keyDown(KeyCode.TAB);
            this.targetElement.keyPress(KeyCode.TAB);
          });

          it('then calls the shorter key combination\'s handler', function() {
            expect(this.comboHandler).to.have.been.calledOnce;
          });

          describe('and the remaining keys to satisfy the longer combination are pressed', () => {
            beforeEach(function () {
              this.targetElement.keyDown(KeyCode.B);
              this.targetElement.keyPress(KeyCode.B);
            });

            it('then calls the longer key combination\'s handler', function() {
              expect(this.longerCombinationHandler).to.have.been.calledOnce;
            });
          });
        });
      });
    });
  });

  describe('when the actions are triggered by the keyup event', function () {
    beforeEach(function () {
      this.keyMap = {
        'COMBO1': { sequence: 'enter+tab', action: 'keyup' },
        'COMBO2': { sequence: 'enter+tab+b', action: 'keyup' },
      };

      this.comboHandler = sinon.spy();
      this.longerCombinationHandler = sinon.spy();

      const handlers = {
        'COMBO1': this.comboHandler,
        'COMBO2': this.longerCombinationHandler,
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

    describe('and the first key is pressed and held', function () {
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

        it('then no handlers are called', function() {
          expect(this.comboHandler).to.not.have.been.called;
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

        it('then calls the key combination\'s handler', function() {
          expect(this.comboHandler).to.have.been.calledOnce;
        });
      });
    });

    describe('and there is a combination that is a subset of a longer one', () => {
      describe('and the keys have been pressed to satisfy the shorter combination without releasing the keys', () => {
        beforeEach(function () {
          this.targetElement.keyDown(KeyCode.ENTER);
          this.targetElement.keyPress(KeyCode.ENTER);

          this.targetElement.keyDown(KeyCode.TAB);
          this.targetElement.keyPress(KeyCode.TAB);
        });

        it('then no handlers are called', function() {
          expect(this.comboHandler).to.not.have.been.called;
        });

        describe('and the remaining keys to satisfy the longer combination are pressed', () => {
          beforeEach(function () {
            this.targetElement.keyDown(KeyCode.B);
            this.targetElement.keyPress(KeyCode.B);
          });

          it('then no handlers are called', function() {
            expect(this.comboHandler).to.not.have.been.called;
          });

          describe('and a key in both combinations is released', function () {
            beforeEach(function () {
              this.targetElement.keyUp(KeyCode.ENTER);
            });

            it('then no handlers are called', function() {
              expect(this.comboHandler).to.not.have.been.called;
            });
          });

          describe('and all the keys in the shorter combination are released followed by the key only in the longer combination', function () {
            beforeEach(function () {
              this.targetElement.keyUp(KeyCode.ENTER);
              this.targetElement.keyUp(KeyCode.TAB);

              this.targetElement.keyUp(KeyCode.B);
            });

            it('then calls the shorter combination\'s handler followed by the longer combination\'s handler', function() {
              expect(this.comboHandler).to.have.been.calledOnce;
              expect(this.longerCombinationHandler).to.have.been.calledOnce;

              expect(this.comboHandler).to.have.been.calledBefore(this.longerCombinationHandler);
            });
          });

          describe('and all the keys are released with the key only in the longer combination released first', function () {
            beforeEach(function () {
              this.targetElement.keyUp(KeyCode.B);

              this.targetElement.keyUp(KeyCode.ENTER);
              this.targetElement.keyUp(KeyCode.TAB);
            });

            it('then calls the longer combination\'s handler only', function() {
              expect(this.comboHandler).to.not.have.been.called;
              expect(this.longerCombinationHandler).to.have.been.calledOnce;
            });
          });

          describe('and all the keys are released in an order that doesn\'t match the shorter combination', function () {
            beforeEach(function () {
              this.targetElement.keyUp(KeyCode.ENTER);
              this.targetElement.keyUp(KeyCode.B);
              this.targetElement.keyUp(KeyCode.TAB);
            });

            it('then calls the longer combination\'s handler only', function() {
              expect(this.comboHandler).to.not.have.been.called;
              expect(this.longerCombinationHandler).to.have.been.calledOnce;
            });
          });
        });
      });
    })
  });

  [
    'keydown',
    'keypress',
    'keyup'
  ].forEach((keyEvent) => {
    describe(`when the actions are triggered by the ${keyEvent} event`, () => {
      beforeEach(function () {
        this.keyMap = {
          'COMBO1': { sequence: 'enter+tab', action: keyEvent },
          'COMBO2': { sequence: 'enter+tab+b', action: keyEvent },
        };

        this.comboHandler = sinon.spy();
        this.longerCombinationHandler = sinon.spy();

        const handlers = {
          'COMBO1': this.comboHandler,
          'COMBO2': this.longerCombinationHandler,
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

      describe('and NO key events have occurred', function () {
        it('then no handlers are called', function() {
          expect(this.comboHandler).to.not.have.been.called;
        });
      });

      describe('and the first key in the combination is pressed and released', function () {
        beforeEach(function () {
          this.targetElement.keyDown(KeyCode.ENTER);
          this.targetElement.keyPress(KeyCode.ENTER);
          this.targetElement.keyUp(KeyCode.ENTER);
        });

        it('then no handlers are called', function() {
          expect(this.comboHandler).to.not.have.been.called;
        });
      });

      describe('and the second key in the combination is pressed after the first is released', function () {
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

      describe('and the keys involved in the combination are released in an order different to how they appear in the combination', () => {
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

      describe('and the keys are released in an order different than when they are pressed', () => {
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

      describe('and the combination is used twice', () => {
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

      describe('and a key not in the combination is already held down', () => {

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

        describe('and released in the middle of the combination', () => {
          beforeEach(function () {
            this.targetElement.keyDown(KeyCode.A);
            this.targetElement.keyPress(KeyCode.A);

            this.targetElement.keyDown(KeyCode.ENTER);
            this.targetElement.keyPress(KeyCode.ENTER);

            this.targetElement.keyUp(KeyCode.A);

            this.targetElement.keyDown(KeyCode.TAB);
            this.targetElement.keyPress(KeyCode.TAB);

            this.targetElement.keyUp(KeyCode.TAB);
            this.targetElement.keyUp(KeyCode.ENTER);
          });

          it('then calls the key combination\'s handler', function() {
            expect(this.comboHandler).to.have.been.calledOnce;
          });
        });
      });
    })
  });

});
