import React from 'react';
import {mount} from 'enzyme';
import {expect} from 'chai';
import sinon from 'sinon';

import FocusableElement from '../support/FocusableElement';
import KeyCode from '../support/Key';

import HotKeys from '../../lib/HotKeys';

describe('Matching hotkey sequences:', function () {
  describe('When the actions are triggered by the keydown event', function () {
    beforeEach(function () {
      this.keyMap = {
        'SEQUENCE': { sequence: 'enter tab', action: 'keydown' },
      };

      this.sequenceHandler = sinon.spy();

      const handlers = {
        'SEQUENCE': this.sequenceHandler,
      };

      this.wrapper = mount(
        <HotKeys keyMap={this.keyMap} handlers={handlers}>
          <div className="childElement" />
        </HotKeys>
      );

      this.targetElement = new FocusableElement(this.wrapper, '.childElement');
      this.targetElement.focus();
    });


    describe('after the keydown event for the first key in the sequence', function () {
      beforeEach(function () {
        this.targetElement.keyDown(KeyCode.ENTER);
      });

      it('then no handlers are called', function() {
        expect(this.sequenceHandler).to.not.have.been.called;
      });
    });

    describe('after the keydown event for the second key in the sequence', function () {
      beforeEach(function () {
        this.targetElement.keyDown(KeyCode.ENTER);
        this.targetElement.keyPress(KeyCode.ENTER);
        this.targetElement.keyUp(KeyCode.ENTER);

        this.targetElement.keyDown(KeyCode.TAB);
      });

      it('then the sequence\'s handler is called', function() {
        expect(this.sequenceHandler).to.have.been.calledOnce;
      });
    });

    describe('after the keypress event for the second key in the sequence', function () {
      beforeEach(function () {
        this.targetElement.keyDown(KeyCode.ENTER);
        this.targetElement.keyPress(KeyCode.ENTER);
        this.targetElement.keyUp(KeyCode.ENTER);

        console.warn('MatchingHotKeySequences.spec.js:65 HERE');
        this.targetElement.keyDown(KeyCode.TAB);
        this.targetElement.keyPress(KeyCode.TAB);
      });

      it('then the sequence\'s handler is NOT called again', function() {
        expect(this.sequenceHandler).to.have.been.calledOnce;
      });

    });

    describe('after the keyup event for the second key in the sequence', function () {
      beforeEach(function () {
        this.targetElement.keyDown(KeyCode.ENTER);
        this.targetElement.keyPress(KeyCode.ENTER);
        this.targetElement.keyUp(KeyCode.ENTER);

        this.targetElement.keyDown(KeyCode.TAB);
        this.targetElement.keyPress(KeyCode.TAB);
        this.targetElement.keyUp(KeyCode.TAB);
      });

      it('then the sequence\'s handler is NOT called again', function() {
        expect(this.sequenceHandler).to.have.been.calledOnce;
      });
    })
  });
});
