import React from 'react';
import {mount} from 'enzyme';
import {expect} from 'chai';
import sinon from 'sinon';

import FocusableElement from '../support/FocusableElement';

import {HotKeys} from '../../src/';
import ShiftKeyMappings from '../support/ShiftKeyMappings';

describe('Combinations involving shift key:', function () {
  Object.keys(ShiftKeyMappings).forEach((keyboardLayout) => {
    context(`when a user is using a ${keyboardLayout} keyboard layout`, () => {
      const keyboardLayoutShiftMappings = ShiftKeyMappings[keyboardLayout];

      Object.keys(keyboardLayoutShiftMappings).forEach((nonShiftKeyCode) => {
        const shiftKeyCode = keyboardLayoutShiftMappings[nonShiftKeyCode];

        [ nonShiftKeyCode, shiftKeyCode ].forEach((keyCode) => {
          describe(`and there is a handler defined for 'shift+${keyCode}'`, () => {
            beforeEach(function () {
              this.keyMap = {
                'ACTION': `shift+${keyCode}`,
              };

              this.handler = sinon.spy();

              const handlers = {
                'ACTION': this.handler,
              };

              this.wrapper = mount(
                <HotKeys keyMap={this.keyMap} handlers={handlers}>
                  <div className="childElement" />
                </HotKeys>
              );

              this.targetElement = new FocusableElement(this.wrapper, '.childElement');
              this.targetElement.focus();
            });

            it(`then calls the handler when shift and ${nonShiftKeyCode} are pressed at the same time`, function() {
              this.targetElement.keyDown('Shift');

              this.targetElement.keyDown(shiftKeyCode);
              this.targetElement.keyPress(shiftKeyCode);
              this.targetElement.keyUp(shiftKeyCode);

              this.targetElement.keyUp('Shift');

              expect(this.handler).to.have.been.called;
            });
          });
        })
      });
    });
  });

  /**
   * This test scenario is created to verify the bug with "Shift+Space" and "Shift+Enter" combinations:
   * https://github.com/greena13/react-hotkeys/issues/300
   */
  describe('and there are handlers defined for "Shift+Space", "Shift+Enter" and "Shift+R"', () => {
    beforeEach(function () {
      this.keyMap = {
        'ACTION1': 'shift+space',
        'ACTION2': 'shift+enter',
        'ACTION3': 'shift+r'
      };

      this.handler1 = sinon.spy();
      this.handler2 = sinon.spy();
      this.handler3 = sinon.spy();

      const handlers = {
        'ACTION1': this.handler1,
        'ACTION2': this.handler2,
        'ACTION3': this.handler3
      };

      this.wrapper = mount(
        <HotKeys keyMap={this.keyMap} handlers={handlers}>
          <div className="childElement" />
        </HotKeys>
      );

      this.targetElement = new FocusableElement(this.wrapper, '.childElement');
      this.targetElement.focus();
    });

    it(`then calls the handler for "Shift+Space" and press "Shift"`, function() {
      this.targetElement.keyDown('Shift');
      this.targetElement.keyDown(' ');

      this.targetElement.focus();
      this.targetElement.keyDown('Shift');
      this.targetElement.keyUp('Shift');
      expect(this.handler1).to.have.been.calledOnce;
    });

    it(`then calls the handler for "Shift+Enter" and press "Shift"`, function() {
      this.targetElement.keyDown('Shift');
      this.targetElement.keyDown('Enter');

      this.targetElement.focus();
      this.targetElement.keyDown('Shift');
      this.targetElement.keyUp('Shift');
      expect(this.handler2).to.have.been.calledOnce;
    });

    it(`then calls the handler for "Shift+Space" and "Shift+R"`, function() {
      this.targetElement.keyDown('Shift');
      this.targetElement.keyDown(' ');

      this.targetElement.focus();
      this.targetElement.keyDown('Shift');
      this.targetElement.keyDown('r');
      this.targetElement.keyUp('r');
      this.targetElement.keyUp('Shift');
      expect(this.handler3).to.have.been.called;

    });

  });
});
