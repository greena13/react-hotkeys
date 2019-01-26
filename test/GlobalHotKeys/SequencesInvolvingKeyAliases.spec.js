import React from 'react';
import {mount} from 'enzyme';
import {expect} from 'chai';
import sinon from 'sinon';
import simulant from 'simulant';

import {GlobalHotKeys} from '../../src';
import ShiftKeyMappings from '../support/ShiftKeyMappings';

describe('Sequences involving key aliases for GlobalHotKeys components:', () => {
  beforeEach(function () {
    this.reactDiv = document.createElement('div');
    document.body.appendChild(this.reactDiv);
  });

  afterEach(function() {
    document.body.removeChild(this.reactDiv);
  });

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
                  [ 'keydown', 'Shift' ],

                  [ 'keydown', shiftedKey ],
                  [ 'keypress', shiftedKey ],

                  [ 'keyup', shiftedKey ],
                  [ 'keyup', 'Shift' ],

                  [ 'keydown', 'a' ],
                  [ 'keypress', 'a' ],
                ]
              },
              {
                description: 'in the middle of the sequence',
                keySequence: `a shift+${keyUsedInCombination} b`,
                keyEvents: [
                  [ 'keydown', 'a' ],
                  [ 'keypress', 'a' ],
                  [ 'keyup', 'a' ],

                  [ 'keydown', 'Shift' ],

                  [ 'keydown', shiftedKey ],
                  [ 'keypress', shiftedKey ],

                  [ 'keyup', shiftedKey ],
                  [ 'keyup', 'Shift' ],

                  [ 'keydown', 'b' ],
                  [ 'keypress', 'b' ],
                  [ 'keyup', 'b' ],
                ]
              },
              {
                description: 'at the end of the sequence',
                keySequence: `a shift+${keyUsedInCombination}`,
                keyEvents: [
                  [ 'keydown', 'a' ],
                  [ 'keypress', 'a' ],
                  [ 'keyup', 'a' ],

                  [ 'keydown', 'Shift' ],

                  [ 'keydown', shiftedKey ],
                  [ 'keypress', shiftedKey ],

                  [ 'keyup', shiftedKey ],
                  [ 'keyup', 'Shift' ],
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
                      <GlobalHotKeys keyMap={this.keyMap} handlers={handlers}>
                        <div className="childElement" />
                      </GlobalHotKeys>,
                      { attachTo: this.reactDiv }
                    );
                  });

                  it('then calls the handler', function() {
                    keyEvents.forEach(([ event, key]) => {
                      simulant.fire(document, event, { key });
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
