import React from 'react';
import {mount} from 'enzyme';
import {expect} from 'chai';
import sinon from 'sinon';

import HotKeys from '../../lib/HotKeys';
import FocusableElement from '../support/FocusableElement';
import ShiftKeyMappings from '../support/ShiftKeyMappings';

describe('Sequences involving key aliases:', () => {
  Object.keys(ShiftKeyMappings).forEach((keyboardLayout) => {
    context(`when a user is using a ${keyboardLayout} keyboard layout`, () => {
      const keyboardLayoutShiftMappings = ShiftKeyMappings[keyboardLayout];

      Object.keys(keyboardLayoutShiftMappings).forEach((unshiftedKey) => {
        const shiftedKey = keyboardLayoutShiftMappings[unshiftedKey];

        [
          {
            description: `and there is a sequence with a combination that includes shift and ${shiftedKey}`,
            keyUsedInCombination: shiftedKey,
          },
          {
            description: `and there is a sequence with a combination that includes shift and ${unshiftedKey}`,
            keyUsedInCombination: unshiftedKey,
          },
        ].forEach(( { description, keyUsedInCombination }) => {
          context(description, () => {
            [
              {
                description: 'at the start of the sequence',
                keySequence: `shift+${keyUsedInCombination} a`,
                keyEvents: [
                  [ 'keyDown', 'Shift' ],

                  [ 'keyDown', shiftedKey ],
                  [ 'keyPress', shiftedKey ],

                  [ 'keyUp', shiftedKey ],
                  [ 'keyUp', 'Shift' ],

                  [ 'keyDown', 'a' ],
                  [ 'keyPress', 'a' ],
                ]
              },
              {
                description: `in the middle of the sequence`,
                keySequence: `a shift+${keyUsedInCombination} b`,
                keyEvents: [
                  [ 'keyDown', 'a' ],
                  [ 'keyPress', 'a' ],
                  [ 'keyUp', 'a' ],

                  [ 'keyDown', 'Shift' ],

                  [ 'keyDown', shiftedKey ],
                  [ 'keyPress', shiftedKey ],

                  [ 'keyUp', shiftedKey ],
                  [ 'keyUp', 'Shift' ],

                  [ 'keyDown', 'b' ],
                  [ 'keyPress', 'b' ],
                  [ 'keyUp', 'b' ],
                ]
              },
              {
                description: `at the end of the sequence`,
                keySequence: `a shift+${keyUsedInCombination}`,
                keyEvents: [
                  [ 'keyDown', 'a' ],
                  [ 'keyPress', 'a' ],
                  [ 'keyUp', 'a' ],

                  [ 'keyDown', 'Shift' ],

                  [ 'keyDown', shiftedKey ],
                  [ 'keyPress', shiftedKey ],

                  [ 'keyUp', shiftedKey ],
                  [ 'keyUp', 'Shift' ],
                ]
              },
            ].forEach(( { description, keySequence, keyEvents }) => {

              context(description, () => {
                context('and the matching keys are pressed in the correct order', () => {

                  beforeEach(function () {
                    this.keyMap = {
                      'ACTION': keySequence,
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

                  it('then calls the handler', function() {
                    keyEvents.forEach(([ event, key ]) => {
                      this.targetElement[event](key);
                    });

                    expect(this.handler).to.have.been.called;
                  });

                });
              })
            })

          });
        })
      });
    });
  });
});
