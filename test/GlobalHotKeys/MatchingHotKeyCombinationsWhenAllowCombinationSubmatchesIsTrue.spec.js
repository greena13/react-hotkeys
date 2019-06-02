import React from 'react';
import {mount} from 'enzyme';
import {expect} from 'chai';
import sinon from 'sinon';
import simulant from 'simulant';

import KeyCode from '../support/Key';
import { configure, GlobalHotKeys } from '../../src';

describe('Matching hotkey combinations for GlobalHotKeys when allowCombinationSubmatches is true:', function () {
  before(function(){
    configure({allowCombinationSubmatches: true });
  });

  after(function() {
    configure({allowCombinationSubmatches: false });
  });

  beforeEach(function () {
    this.parentDiv = document.createElement('div');
    this.reactDiv = document.createElement('div');

    document.body.appendChild(this.parentDiv);
    this.parentDiv.appendChild(this.reactDiv);
  });

  afterEach(function() {
    document.body.removeChild(this.parentDiv);
  });

  describe('when the actions are triggered by the keydown event', function () {
    beforeEach(function () {
      this.keyMap = {
        'COMBO1': { sequence: 'a+b', action: 'keydown' },
        'COMBO2': { sequence: 'a+b+c', action: 'keydown' },
      };

      this.comboHandler = sinon.spy();
      this.longerCombinationHandler = sinon.spy();

      const handlers = {
        'COMBO1': this.comboHandler,
        'COMBO2': this.longerCombinationHandler,
      };

      this.wrapper = mount(
        <div >
          <GlobalHotKeys keyMap={this.keyMap} handlers={handlers}>
            <div className="childElement" />
          </GlobalHotKeys>

          <div className="siblingElement" />
        </div>,
        { attachTo: this.reactDiv }
      );
    });

    describe('and the first key is pressed and held', function () {
      describe('and the keydown event for the second key in the combination occurs', () => {
        beforeEach(function () {
          simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.A });
          simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.A });

          simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.B });
        });

        it('then calls the key combination\'s handler', function() {
          expect(this.comboHandler).to.have.been.calledOnce;
        });
      });

      describe('and the keypress event for the second key in the combination occurs', () => {
        beforeEach(function () {
          simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.A });
          simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.A });

          simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.B });
          simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.B });
        });

        it('then does NOT call the key combination\'s handler again', function() {
          expect(this.comboHandler).to.have.been.calledOnce;
        });
      });

      describe('and the keyup event for the second key in the combination occurs', () => {
        beforeEach(function () {
          simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.A });
          simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.A });

          simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.B });
          simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.B });
          simulant.fire(this.reactDiv, 'keyup', { key: KeyCode.B });

          simulant.fire(this.reactDiv, 'keyup', { key: KeyCode.A });
        });

        it('then does NOT call the key combination\'s handler again', function() {
          expect(this.comboHandler).to.have.been.calledOnce;
        });
      });
    });

    describe('and there is a combination that is a subset of a longer one', () => {
      describe('and the keys have been pressed to satisfy the shorter combination without releasing the keys', () => {
        beforeEach(function () {
          simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.A });
          simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.A });

          simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.B });
          simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.B });
        });

        it('then calls the shorter key combination\'s handler', function() {
          expect(this.comboHandler).to.have.been.calledOnce;
          expect(this.longerCombinationHandler).to.not.have.been.called;
        });

        describe('and the remaining keys to satisfy the longer combination are pressed', () => {
          beforeEach(function () {
            simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.C });
            simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.C });
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
        'COMBO1': { sequence: 'a+b', action: 'keypress' },
        'COMBO2': { sequence: 'a+b+c', action: 'keypress' },
      };

      this.comboHandler = sinon.spy();
      this.longerCombinationHandler = sinon.spy();

      const handlers = {
        'COMBO1': this.comboHandler,
        'COMBO2': this.longerCombinationHandler,
      };

      this.wrapper = mount(
        <div >
          <GlobalHotKeys keyMap={this.keyMap} handlers={handlers}>
            <div className="childElement" />
          </GlobalHotKeys>

          <div className="siblingElement" />
        </div>,
        { attachTo: this.reactDiv }
      );
    });

    describe('and the first key is pressed and held', function () {
      describe('and the keydown event for the second key in the combination occurs', () => {
        beforeEach(function () {
          simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.A });
          simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.A });

          simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.B });
        });

        it('then no handlers are called', function() {
          expect(this.comboHandler).to.not.have.been.called;
        });
      });

      describe('and the keypress event for the second key in the combination occurs', () => {
        beforeEach(function () {
          simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.A });
          simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.A });

          simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.B });
          simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.B });
        });

        it('then calls the key combination\'s handler', function() {
          expect(this.comboHandler).to.have.been.calledOnce;
        });
      });

      describe('and the keyup event for the second key in the combination occurs', () => {
        beforeEach(function () {
          simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.A });
          simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.A });

          simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.B });
          simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.B });
          simulant.fire(this.reactDiv, 'keyup', { key: KeyCode.B });

          simulant.fire(this.reactDiv, 'keyup', { key: KeyCode.A });
        });

        it('then does NOT call the key combination\'s handler again', function() {
          expect(this.comboHandler).to.have.been.calledOnce;
        });
      });

      describe('and there is a combination that is a subset of a longer one', () => {
        describe('and the keys have been pressed to satisfy the shorter combination without releasing the keys', () => {
          beforeEach(function () {
            simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.A });
            simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.A });

            simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.B });
            simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.B });
          });

          it('then calls the shorter key combination\'s handler', function() {
            expect(this.comboHandler).to.have.been.calledOnce;
            expect(this.longerCombinationHandler).to.not.have.been.called;
          });

          describe('and the remaining keys to satisfy the longer combination are pressed', () => {
            beforeEach(function () {
              simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.C });
              simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.C });
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
        'COMBO1': { sequence: 'a+b', action: 'keyup' },
        'COMBO2': { sequence: 'a+b+c', action: 'keyup' },
      };

      this.comboHandler = sinon.spy();
      this.longerCombinationHandler = sinon.spy();

      const handlers = {
        'COMBO1': this.comboHandler,
        'COMBO2': this.longerCombinationHandler,
      };

      this.wrapper = mount(
        <GlobalHotKeys keyMap={this.keyMap} handlers={handlers}>
          <div className="childElement" />
        </GlobalHotKeys>,
        { attachTo: this.reactDiv }
      );
    });

    describe('and the first key is pressed and held', function () {
      describe('and the keydown event for the second key in the combination occurs', () => {
        beforeEach(function () {
          simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.A });
          simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.A });

          simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.B });
        });

        it('then no handlers are called', function() {
          expect(this.comboHandler).to.not.have.been.called;
        });
      });

      describe('and the keypress event for the second key in the combination occurs', () => {
        beforeEach(function () {
          simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.A });
          simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.A });

          simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.B });
          simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.B });
        });

        it('then no handlers are called', function() {
          expect(this.comboHandler).to.not.have.been.called;
        });
      });

      describe('and the keyup event for the second key in the combination occurs', () => {
        beforeEach(function () {
          simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.A });
          simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.A });

          simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.B });
          simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.B });
          simulant.fire(this.reactDiv, 'keyup', { key: KeyCode.B });

          simulant.fire(this.reactDiv, 'keyup', { key: KeyCode.A });
        });

        it('then calls the key combination\'s handler', function() {
          expect(this.comboHandler).to.have.been.calledOnce;
        });
      });
    });

    describe('and there is a combination that is a subset of a longer one', () => {
      describe('and the keys have been pressed to satisfy the shorter combination without releasing the keys', () => {
        beforeEach(function () {
          simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.A });
          simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.A });

          simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.B });
          simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.B });
        });

        it('then no handlers are called', function() {
          expect(this.comboHandler).to.not.have.been.called;
        });

        describe('and the remaining keys to satisfy the longer combination are pressed', () => {
          beforeEach(function () {
            simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.C });
            simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.C });
          });

          it('then no handlers are called', function() {
            expect(this.comboHandler).to.not.have.been.called;
          });

          describe('and a key in both combinations is released', function () {
            beforeEach(function () {
              simulant.fire(this.reactDiv, 'keyup', { key: KeyCode.A });
            });

            it('then no handlers are called', function() {
              expect(this.comboHandler).to.not.have.been.called;
            });
          });

          describe('and all the keys in the shorter combination are released followed by the key only in the longer combination', function () {
            beforeEach(function () {
              simulant.fire(this.reactDiv, 'keyup', { key: KeyCode.A });
              simulant.fire(this.reactDiv, 'keyup', { key: KeyCode.B });

              simulant.fire(this.reactDiv, 'keyup', { key: KeyCode.C });
            });

            it('then calls the shorter combination\'s handler followed by the longer combination\'s handler', function() {
              expect(this.comboHandler).to.have.been.calledOnce;
              expect(this.longerCombinationHandler).to.have.been.calledOnce;

              expect(this.comboHandler).to.have.been.calledBefore(this.longerCombinationHandler);
            });
          });

          describe('and all the keys are released with the key only in the longer combination released first', function () {
            beforeEach(function () {
              simulant.fire(this.reactDiv, 'keyup', { key: KeyCode.C });

              simulant.fire(this.reactDiv, 'keyup', { key: KeyCode.A });
              simulant.fire(this.reactDiv, 'keyup', { key: KeyCode.B });
            });

            it('then calls the longer combination\'s handler only', function() {
              expect(this.comboHandler).to.not.have.been.called;
              expect(this.longerCombinationHandler).to.have.been.calledOnce;
            });
          });

          describe('and all the keys are released in an order that doesn\'t match the shorter combination', function () {
            beforeEach(function () {
              simulant.fire(this.reactDiv, 'keyup', { key: KeyCode.A });
              simulant.fire(this.reactDiv, 'keyup', { key: KeyCode.C });
              simulant.fire(this.reactDiv, 'keyup', { key: KeyCode.B });

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
          'COMBO1': { sequence: 'a+b', action: keyEvent },
          'COMBO2': { sequence: 'a+b+c', action: keyEvent },
        };

        this.comboHandler = sinon.spy();
        this.longerCombinationHandler = sinon.spy();

        const handlers = {
          'COMBO1': this.comboHandler,
          'COMBO2': this.longerCombinationHandler,
        };

        this.wrapper = mount(
          <div >
            <GlobalHotKeys keyMap={this.keyMap} handlers={handlers}>
              <div className="childElement" />
            </GlobalHotKeys>

            <div className="siblingElement" />
          </div>,
          { attachTo: this.reactDiv }
        );
      });

      describe('and NO key events have occurred', function () {
        it('then no handlers are called', function() {
          expect(this.comboHandler).to.not.have.been.called;
        });
      });

      describe('and the first key in the combination is pressed and released', function () {
        beforeEach(function () {
          simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.A });
          simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.A });
          simulant.fire(this.reactDiv, 'keyup', { key: KeyCode.A });
        });

        it('then no handlers are called', function() {
          expect(this.comboHandler).to.not.have.been.called;
        });
      });

      describe('and the second key in the combination is pressed after the first is released', function () {
        beforeEach(function () {
          simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.A });
          simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.A });
          simulant.fire(this.reactDiv, 'keyup', { key: KeyCode.A });

          simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.B });
          simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.B });
          simulant.fire(this.reactDiv, 'keyup', { key: KeyCode.B });
        });

        it('then no handlers are called', function() {
          expect(this.comboHandler).to.not.have.been.called;
        });
      });

      describe('and the keys involved in the combination are released in an order different to how they appear in the combination', () => {
        beforeEach(function () {
          simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.B });
          simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.B });

          simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.A });
          simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.A });

          simulant.fire(this.reactDiv, 'keyup', { key: KeyCode.B });
          simulant.fire(this.reactDiv, 'keyup', { key: KeyCode.A });
        });

        it('then calls the key combination\'s handler', function() {
          expect(this.comboHandler).to.have.been.calledOnce;
        });
      });

      describe('and the keys are released in an order different than when they are pressed', () => {
        beforeEach(function () {
          simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.A });
          simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.A });

          simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.B });
          simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.B });

          simulant.fire(this.reactDiv, 'keyup', { key: KeyCode.B });
          simulant.fire(this.reactDiv, 'keyup', { key: KeyCode.A });
        });

        it('then calls the key combination\'s handler', function() {
          expect(this.comboHandler).to.have.been.calledOnce;
        });
      });

      describe('and the combination is used twice', () => {
        beforeEach(function () {
          for(let i = 0; i < 2; i++) {
            simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.A });
            simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.A });

            simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.B });
            simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.B });

            simulant.fire(this.reactDiv, 'keyup', { key: KeyCode.B });
            simulant.fire(this.reactDiv, 'keyup', { key: KeyCode.A });
          }
        });

        it('then calls the key combination\'s handler twice', function() {
          expect(this.comboHandler).to.have.been.calledTwice;
        });
      });

      describe('and a key not in the combination is already held down', () => {

        describe('and released afterwards', () => {
          beforeEach(function () {
            simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.A });
            simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.A });

            simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.A });
            simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.A });

            simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.B });
            simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.B });

            simulant.fire(this.reactDiv, 'keyup', { key: KeyCode.B });
            simulant.fire(this.reactDiv, 'keyup', { key: KeyCode.A });

            simulant.fire(this.reactDiv, 'keyup', { key: KeyCode.A });
          });

          it('then calls the key combination\'s handler', function() {
            expect(this.comboHandler).to.have.been.calledOnce;
          });
        });

        describe('and released in the middle of the combination', () => {
          beforeEach(function () {
            simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.ENTER });

            simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.A });
            simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.A });

            simulant.fire(this.reactDiv, 'keyup', { key: KeyCode.ENTER });

            simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.B });
            simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.B });

            simulant.fire(this.reactDiv, 'keyup', { key: KeyCode.B });
            simulant.fire(this.reactDiv, 'keyup', { key: KeyCode.A });
          });

          it('then calls the key combination\'s handler', function() {
            expect(this.comboHandler).to.have.been.calledOnce;
          });
        });
      });
    })
  });
});
