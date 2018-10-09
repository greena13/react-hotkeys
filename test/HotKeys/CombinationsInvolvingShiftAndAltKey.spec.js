import React from 'react';
import {mount} from 'enzyme';
import {expect} from 'chai';
import sinon from 'sinon';

import FocusableElement from '../support/FocusableElement';

import HotKeys from '../../lib/HotKeys';
import AltShiftKeyMappings from '../support/AltShiftKeyMappings';

describe('Combinations involving shift and alt key:', function () {
  Object.keys(AltShiftKeyMappings).forEach((keyboardLayout) => {
    context(`when a user is using a ${keyboardLayout} keyboard layout`, () => {
      const keyboardLayoutAltMappings = AltShiftKeyMappings[keyboardLayout];

      Object.keys(keyboardLayoutAltMappings).forEach((nonAltKeyCode) => {
        const altKeyCode = keyboardLayoutAltMappings[nonAltKeyCode];

        describe(`and there is a handler defined for 'shift+alt+${nonAltKeyCode}'`, () => {
          beforeEach(function () {
            this.keyMap = {
              'ACTION': `shift+alt+${nonAltKeyCode}`,
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

          it(`then calls the handler when shift, alt and ${nonAltKeyCode} are pressed at the same time`, function() {
            this.targetElement.keyDown('Alt');
            this.targetElement.keyDown('Shift');

            this.targetElement.keyDown(altKeyCode);
            this.targetElement.keyPress(altKeyCode);
            this.targetElement.keyUp(altKeyCode);

            this.targetElement.keyUp('Alt');
            this.targetElement.keyUp('Shift');

            expect(this.handler).to.have.been.called;
          });
        });
      });
    });
  })
});
