import React from 'react';
import {mount} from 'enzyme';
import {expect} from 'chai';
import sinon from 'sinon';

import FocusableElement from '../support/FocusableElement';

import HotKeys from '../../lib/HotKeys';

const shiftKeyMappings = {
  'US': {
    "`": "~",
    "1": "!",
    "2": "@",
    "3": "#",
    "4": "$",
    "5": "%",
    "6": "^",
    "7": "&",
    "8": "*",
    "9": "(",
    "0": ")",
    "-": "_",
    "=": "+",
    "a": "A",
    "b": "B",
    "c": "C",
    "d": "D",
    "e": "E",
    "f": "F",
    "g": "G",
    "h": "H",
    "i": "I",
    "j": "J",
    "k": "K",
    "l": "L",
    "m": "M",
    "n": "N",
    "o": "O",
    "p": "P",
    "q": "Q",
    "r": "R",
    "s": "S",
    "t": "T",
    "u": "U",
    "v": "V",
    "w": "W",
    "x": "X",
    "y": "Y",
    "z": "Z",
    "[": "{",
    "]": "}",
    "\\": "|",
    "'": '"',
    ";": ":",
    ",": "<",
    ".": ">",
    "/": "?",
  },

  'UK': {
    "\\": "|",
    "1": "!",
    "2": '"',
    "3": "£",
    "4": "$",
    "5": "%",
    "6": "^",
    "7": "&",
    "8": "*",
    "9": "9",
    "0": "0",
    "-": "_",
    "=": "+",
    "a": "A",
    "b": "B",
    "c": "C",
    "d": "D",
    "e": "E",
    "f": "F",
    "g": "G",
    "h": "H",
    "i": "I",
    "j": "J",
    "k": "K",
    "l": "L",
    "m": "M",
    "n": "N",
    "o": "O",
    "p": "P",
    "q": "Q",
    "r": "R",
    "s": "S",
    "t": "T",
    "u": "U",
    "v": "V",
    "w": "W",
    "x": "X",
    "y": "Y",
    "z": "Z",
    "[": "{",
    "]": "}",
    "#": "~",
    ";": ":",
    "'": "@",
    ",": "<",
    ".": ">",
    "/": "?",
  }

};

describe('Combinations involving shift key:', function () {
  Object.keys(shiftKeyMappings).forEach((keyboardLayout) => {
    context(`when a user is using a ${keyboardLayout} keyboard layout`, () => {
      const keyboardLayoutShiftMappings = shiftKeyMappings[keyboardLayout];

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
