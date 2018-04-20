import React from 'react';
import {mount} from 'enzyme';
import {expect} from 'chai';
import sinon from 'sinon';

import FocusableElement from '../support/FocusableElement';

import HotKeys from '../../lib/HotKeys';

const keyMapping = {
  "Escape": [ "escape", "esc" , "Escape"],
  "F1": ["f1", "F1"],
  "F2": ["f2", "F2"],
  "F3": ["f3", "F3"],
  "F4": ["f4", "F4"],
  "F5": ["f5", "F5"],
  "F6": ["f6", "F6"],
  "F7": ["f7", "F7"],
  "F8": ["f8", "F8"],
  "F9": ["f9", "F9"],
  "F10": ["f10", "F10"],
  "F11": ["f11", "F11"],
  "F12": ["f12", "F12"],
  "`": ["`"],
  "1": ["1"],
  "2": ["2"],
  "3": ["3"],
  "4": ["4"],
  "5": ["5"],
  "6": ["6"],
  "7": ["7"],
  "8": ["8"],
  "9": ["9"],
  "0": ["0"],
  "-": ["-"],
  "=": ["="],
  "!": ["!"],
  "@": ["@"],
  "#": ["#"],
  "$": ["$"],
  "%": ["%"],
  "^": ["^"],
  "&": ["&"],
  "*": ["*"],
  "(": ["("],
  ")": [")"],
  "_": ["_"],
  "+": ["plus", "+"],
  "Tab": ["tab", "Tab"],
  "Backspace": ["del", "backspace", "Backspace"],
  "CapsLock": ["capslock", "CapsLock"],
  "Enter": ["enter", "return", "Enter"],
  "Shift": ["shift", "Shift"],
  "Meta": ["command", "meta", "Meta"],
  "Alt": ["option", "alt", "Alt"],
  "ArrowLeft": ["left", "ArrowLeft"],
  "ArrowRight": ["right", "ArrowRight"],
  "ArrowUp": ["up", "ArrowUp"],
  "ArrowDown": ["down", "ArrowDown"],
  "Insert": ["ins", "Insert"],
  "Control": ["ctrl", "Control"],
  "PageUp": ["pageup", "PageUp"],
  "PageDown": ["pagedown", "PageDown"],
  "End": ["end", "End"],
  "Home": ["home", "Home"],
  " ": ["space"],
  "a": ["a"],
  "b": ["b"],
  "c": ["c"],
  "d": ["d"],
  "e": ["e"],
  "f": ["f"],
  "g": ["g"],
  "h": ["h"],
  "i": ["i"],
  "j": ["j"],
  "k": ["k"],
  "l": ["l"],
  "m": ["m"],
  "n": ["n"],
  "o": ["o"],
  "p": ["p"],
  "q": ["q"],
  "r": ["r"],
  "s": ["s"],
  "t": ["t"],
  "u": ["u"],
  "v": ["v"],
  "w": ["w"],
  "x": ["x"],
  "y": ["y"],
  "z": ["z"],
  "A": ["A"],
  "B": ["B"],
  "C": ["C"],
  "D": ["D"],
  "E": ["E"],
  "F": ["F"],
  "G": ["G"],
  "H": ["H"],
  "I": ["I"],
  "J": ["J"],
  "K": ["K"],
  "L": ["L"],
  "M": ["M"],
  "N": ["N"],
  "O": ["O"],
  "P": ["P"],
  "Q": ["Q"],
  "R": ["R"],
  "S": ["S"],
  "T": ["T"],
  "U": ["U"],
  "V": ["V"],
  "W": ["W"],
  "X": ["X"],
  "Y": ["Y"],
  "Z": ["Z"],
  "[": ["["],
  "{": ["{"],
  "]": ["]"],
  "}": ["}"],
  "\\": ["\\"],
  "|": ["|"],
  "'": ["'"],
  '"': ['"'],
  ";": [";"],
  ":": [":"],
  ",": [","],
  "<": ["<"],
  ".": ["."],
  ">": [">"],
  "/": ["/"],
  "?": ["?"],
};

describe('Key mappings:', function () {
  Object.keys(keyMapping).forEach((reactKeyCode) => {
    const mousetrapKeyCodes = keyMapping[reactKeyCode];

    mousetrapKeyCodes.forEach((mousetrapKeyCode) => {
      describe(`when there is a handler defined for '${mousetrapKeyCode}'`, () => {
        beforeEach(function () {
          this.keyMap = {
            'ACTION': mousetrapKeyCode,
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

        it(`then calls the handler when ${reactKeyCode} is pressed`, function() {
          this.targetElement.keyPress(reactKeyCode);

          expect(this.handler).to.have.been.called;
        });
      })

    })
  })
});
