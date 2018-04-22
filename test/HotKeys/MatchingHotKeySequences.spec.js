import React from 'react';
import {mount} from 'enzyme';
import {expect} from 'chai';
import sinon from 'sinon';

import FocusableElement from '../support/FocusableElement';
import KeyCode from '../support/Key';

import HotKeys from '../../lib/HotKeys';

describe('Matching hotkey sequences:', function () {
  describe('when the actions are occur on the keydown event', function () {
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

  describe('when the actions are occur on the keypress event', function () {
    beforeEach(function () {
      this.keyMap = {
        'SEQUENCE': { sequence: 'enter tab', action: 'keypress' },
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


    describe('after the keypress event for the first key in the sequence', function () {
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

      it('then no handlers are called', function() {
        expect(this.sequenceHandler).to.not.have.been.called;
      });

    });

    describe('after the keypress event for the second key in the sequence', function () {
      beforeEach(function () {
        this.targetElement.keyDown(KeyCode.ENTER);
        this.targetElement.keyPress(KeyCode.ENTER);
        this.targetElement.keyUp(KeyCode.ENTER);

        this.targetElement.keyDown(KeyCode.TAB);
        this.targetElement.keyPress(KeyCode.TAB);
      });

      it('then the sequence\'s handler is called', function() {
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

  describe('when the actions are occur on the keyup event', function () {
    beforeEach(function () {
      this.keyMap = {
        'SEQUENCE': { sequence: 'enter tab', action: 'keyup' },
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


    describe('after the keypress event for the first key in the sequence', function () {
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

      it('then no handlers are called', function() {
        expect(this.sequenceHandler).to.not.have.been.called;
      });

    });

    describe('after the keypress event for the second key in the sequence', function () {
      beforeEach(function () {
        this.targetElement.keyDown(KeyCode.ENTER);
        this.targetElement.keyPress(KeyCode.ENTER);
        this.targetElement.keyUp(KeyCode.ENTER);

        this.targetElement.keyDown(KeyCode.TAB);
        this.targetElement.keyPress(KeyCode.TAB);
      });

      it('then no handlers are called', function() {
        expect(this.sequenceHandler).to.not.have.been.called;
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

      it('then the sequence\'s handler is called', function() {
        expect(this.sequenceHandler).to.have.been.calledOnce;
      });
    })
  });

  describe('when there is a sequence that is a subset of a longer one (which includes more keys at the end)', function () {
    beforeEach(function () {
      this.keyMap = {
        'SHORT_SEQUENCE': 'enter tab',
        'LONG_SEQUENCE': 'enter tab b',
      };

      this.shortSequenceHandler = sinon.spy();
      this.longSequenceHandler = sinon.spy();

      const handlers = {
        'SHORT_SEQUENCE': this.shortSequenceHandler,
        'LONG_SEQUENCE': this.longSequenceHandler,
      };

      this.wrapper = mount(
        <HotKeys keyMap={this.keyMap} handlers={handlers}>
          <div className="childElement" />
        </HotKeys>
      );

      this.targetElement = new FocusableElement(this.wrapper, '.childElement');
      this.targetElement.focus();
    });

    describe('and the keys for the shorter sequence are pressed', function () {
      beforeEach(function () {
        this.targetElement.keyDown(KeyCode.ENTER);
        this.targetElement.keyPress(KeyCode.ENTER);
        this.targetElement.keyUp(KeyCode.ENTER);

        this.targetElement.keyDown(KeyCode.TAB);
        this.targetElement.keyPress(KeyCode.TAB);
        this.targetElement.keyUp(KeyCode.TAB);
      });

      it('then the handler for the shorter sequence is called', function() {
        expect(this.shortSequenceHandler).to.have.been.calledOnce;
      });
    });

    describe('and the keys for the shorter sequence are pressed followed by the remaining keys to match the longer sequence', function () {
      beforeEach(function () {
        this.targetElement.keyDown(KeyCode.ENTER);
        this.targetElement.keyPress(KeyCode.ENTER);
        this.targetElement.keyUp(KeyCode.ENTER);

        this.targetElement.keyDown(KeyCode.TAB);
        this.targetElement.keyPress(KeyCode.TAB);
        this.targetElement.keyUp(KeyCode.TAB);

        this.targetElement.keyDown(KeyCode.B);
        this.targetElement.keyPress(KeyCode.B);
        this.targetElement.keyUp(KeyCode.B);
      });

      it('then the handler for the shorter sequence is called followed by the handler for the longer sequence', function() {
        expect(this.shortSequenceHandler).to.have.been.calledOnce;
        expect(this.longSequenceHandler).to.have.been.calledOnce;

        expect(this.shortSequenceHandler).to.have.been.calledBefore(this.longSequenceHandler);
      });
    });
  });

  describe('when there is a sequence that is a subset of a longer one (which includes more keys at the start)', function () {
    beforeEach(function () {
      this.keyMap = {
        'SHORT_SEQUENCE': 'enter tab',
        'LONG_SEQUENCE': 'b enter tab',
      };

      this.shortSequenceHandler = sinon.spy();
      this.longSequenceHandler = sinon.spy();

      const handlers = {
        'SHORT_SEQUENCE': this.shortSequenceHandler,
        'LONG_SEQUENCE': this.longSequenceHandler,
      };

      this.wrapper = mount(
        <HotKeys keyMap={this.keyMap} handlers={handlers}>
          <div className="childElement" />
        </HotKeys>
      );

      this.targetElement = new FocusableElement(this.wrapper, '.childElement');
      this.targetElement.focus();
    });

    describe('and the keys for the shorter sequence are pressed', function () {
      beforeEach(function () {
        this.targetElement.keyDown(KeyCode.ENTER);
        this.targetElement.keyPress(KeyCode.ENTER);
        this.targetElement.keyUp(KeyCode.ENTER);

        this.targetElement.keyDown(KeyCode.TAB);
        this.targetElement.keyPress(KeyCode.TAB);
        this.targetElement.keyUp(KeyCode.TAB);
      });

      it('then the handler for the shorter sequence is called', function() {
        expect(this.shortSequenceHandler).to.have.been.calledOnce;
      });
    });

    describe('and the keys for the longer sequence are pressed', function () {
      beforeEach(function () {
        this.targetElement.keyDown(KeyCode.B);
        this.targetElement.keyPress(KeyCode.B);
        this.targetElement.keyUp(KeyCode.B);

        this.targetElement.keyDown(KeyCode.ENTER);
        this.targetElement.keyPress(KeyCode.ENTER);
        this.targetElement.keyUp(KeyCode.ENTER);

        this.targetElement.keyDown(KeyCode.TAB);
        this.targetElement.keyPress(KeyCode.TAB);
        this.targetElement.keyUp(KeyCode.TAB);
      });

      it('then the handler for the shorter sequence is called followed by the handler for the longer sequence', function() {
        expect(this.longSequenceHandler).to.have.been.calledOnce;

        expect(this.shortSequenceHandler).to.not.have.been.called;
      });
    });
  });

  describe('when there is a sequence', function () {
    beforeEach(function () {
      this.keyMap = {
        'SEQUENCE': 'enter tab',
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

    describe('and the keys that match it are pressed in the wrong order', function () {
      beforeEach(function () {
        this.targetElement.keyDown(KeyCode.TAB);
        this.targetElement.keyPress(KeyCode.TAB);
        this.targetElement.keyUp(KeyCode.TAB);

        this.targetElement.keyDown(KeyCode.ENTER);
        this.targetElement.keyPress(KeyCode.ENTER);
        this.targetElement.keyUp(KeyCode.ENTER);
      });

      it('then the the sequence\'s handler is NOT called', function() {
        expect(this.sequenceHandler).to.not.have.been.called;
      });
    });

    describe('and the first key in the sequence is pressed twice before the remaining keys', function () {
      beforeEach(function () {
        this.targetElement.keyDown(KeyCode.ENTER);
        this.targetElement.keyPress(KeyCode.ENTER);
        this.targetElement.keyUp(KeyCode.ENTER);

        this.targetElement.keyDown(KeyCode.ENTER);
        this.targetElement.keyPress(KeyCode.ENTER);
        this.targetElement.keyUp(KeyCode.ENTER);

        this.targetElement.keyDown(KeyCode.TAB);
        this.targetElement.keyPress(KeyCode.TAB);
        this.targetElement.keyUp(KeyCode.TAB);
      });

      it('then the the sequence\'s handler is called', function() {
        expect(this.sequenceHandler).to.have.been.calledOnce;
      });
    });

    describe('and the last key in the sequence is pressed twice at the end of sequence', function () {
      beforeEach(function () {
        this.targetElement.keyDown(KeyCode.ENTER);
        this.targetElement.keyPress(KeyCode.ENTER);
        this.targetElement.keyUp(KeyCode.ENTER);

        this.targetElement.keyDown(KeyCode.TAB);
        this.targetElement.keyPress(KeyCode.TAB);
        this.targetElement.keyUp(KeyCode.TAB);

        this.targetElement.keyDown(KeyCode.TAB);
        this.targetElement.keyPress(KeyCode.TAB);
        this.targetElement.keyUp(KeyCode.TAB);
      });

      it('then the the sequence\'s handler is called once', function() {
        expect(this.sequenceHandler).to.have.been.calledOnce;
      });
    });

    describe('and key NOT in the sequence is pressed in the middle of pressing the keys that are', function () {
      beforeEach(function () {
        this.targetElement.keyDown(KeyCode.ENTER);
        this.targetElement.keyPress(KeyCode.ENTER);
        this.targetElement.keyUp(KeyCode.ENTER);

        this.targetElement.keyDown(KeyCode.B);
        this.targetElement.keyPress(KeyCode.B);
        this.targetElement.keyUp(KeyCode.B);

        this.targetElement.keyDown(KeyCode.TAB);
        this.targetElement.keyPress(KeyCode.TAB);
        this.targetElement.keyUp(KeyCode.TAB);
      });

      it('then the the sequence\'s handler is NOT called', function() {
        expect(this.sequenceHandler).to.not.have.been.called;
      });
    });

    describe('and the keys in the sequence are pressed at the same time', function () {
      beforeEach(function () {
        this.targetElement.keyDown(KeyCode.ENTER);
        this.targetElement.keyPress(KeyCode.ENTER);

        this.targetElement.keyDown(KeyCode.TAB);
        this.targetElement.keyPress(KeyCode.TAB);

        this.targetElement.keyUp(KeyCode.ENTER);
        this.targetElement.keyUp(KeyCode.TAB);
      });

      it('then the the sequence\'s handler is NOT called', function() {
        expect(this.sequenceHandler).to.not.have.been.called;
      });
    });
  });

  describe('when there is a sequence with a combination at the start', function () {
    beforeEach(function () {
      this.keyMap = {
        'SEQUENCE': 'enter+tab b',
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

    describe('and the keys that match the combination are pressed, followed by the remaining keys in the sequence', function () {
      beforeEach(function () {
        this.targetElement.keyDown(KeyCode.TAB);
        this.targetElement.keyPress(KeyCode.TAB);

        this.targetElement.keyDown(KeyCode.ENTER);
        this.targetElement.keyPress(KeyCode.ENTER);

        this.targetElement.keyUp(KeyCode.TAB);
        this.targetElement.keyUp(KeyCode.ENTER);

        this.targetElement.keyDown(KeyCode.B);
        this.targetElement.keyPress(KeyCode.B);
        this.targetElement.keyUp(KeyCode.B);
      });

      it('then the the sequence\'s handler is called', function() {
        expect(this.sequenceHandler).to.have.been.calledOnce;
      });
    });
  });

  describe('when there is a sequence with a combination at the end', function () {
    beforeEach(function () {
      this.keyMap = {
        'SEQUENCE': 'b enter+tab',
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

    describe('and the keys are pressed in the correct order to match combination and the sequence it is in', function () {
      beforeEach(function () {
        this.targetElement.keyDown(KeyCode.B);
        this.targetElement.keyPress(KeyCode.B);
        this.targetElement.keyUp(KeyCode.B);

        this.targetElement.keyDown(KeyCode.TAB);
        this.targetElement.keyPress(KeyCode.TAB);

        this.targetElement.keyDown(KeyCode.ENTER);
        this.targetElement.keyPress(KeyCode.ENTER);

        this.targetElement.keyUp(KeyCode.TAB);
        this.targetElement.keyUp(KeyCode.ENTER);
      });

      it('then the the sequence\'s handler is called', function() {
        expect(this.sequenceHandler).to.have.been.calledOnce;
      });
    });
  })

});
