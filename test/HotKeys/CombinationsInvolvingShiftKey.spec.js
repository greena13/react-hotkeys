import React from 'react';
import {mount} from 'enzyme';
import {expect} from 'chai';
import sinon from 'sinon';

import FocusableElement from '../support/FocusableElement';

import HotKeys from '../../lib/HotKeys';
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
              this.targetElement.keyPress('Shift');

              this.targetElement.keyDown(shiftKeyCode);
              this.targetElement.keyPress(shiftKeyCode);

              expect(this.handler).to.have.been.called;
            });
          });
        })
      });
    });
  })
});
