import React from 'react';
import {mount} from 'enzyme';
import {expect} from 'chai';
import sinon from 'sinon';

import {HotKeys} from '../../src/';
import KeyCode from '../support/Key';
import FocusableElement from '../support/FocusableElement';

describe('Specifying key map using objects:', () => {
  context('when using a root object to specify sequence attributes', () => {
    context('for a keydown action', () => {
      beforeEach(function () {
        this.keyMap = {
          'ACTION1': {
            sequence: 'enter',
            action: 'keydown',
          },
        };

        this.handler = sinon.spy();

        this.handlers = {
          'ACTION1': this.handler,
        };

        this.wrapper = mount(
          <HotKeys keyMap={this.keyMap} handlers={this.handlers}>
            <div className="childElement" />
          </HotKeys>
        );

        this.targetElement = new FocusableElement(this.wrapper, '.childElement');
        this.targetElement.focus();
      });

      it('then calls the correct handler when a key is pressed that matches the keyMap', function() {
        this.targetElement.keyDown(KeyCode.ENTER);

        expect(this.handler).to.have.been.calledOnce;
      });
    });

    context('for a keyup action', () => {
      beforeEach(function () {
        this.keyMap = {
          'ACTION1': {
            sequence: 'enter',
            action: 'keyup',
          },
        };

        this.handler = sinon.spy();

        this.handlers = {
          'ACTION1': this.handler,
        };

        this.wrapper = mount(
          <HotKeys keyMap={this.keyMap} handlers={this.handlers}>
            <div className="childElement" />
          </HotKeys>
        );

        this.targetElement = new FocusableElement(this.wrapper, '.childElement');
        this.targetElement.focus();
      });

      it('then calls the correct handler when a key is pressed that matches the keyMap', function() {
        this.targetElement.keyDown(KeyCode.ENTER);
        this.targetElement.keyUp(KeyCode.ENTER);

        expect(this.handler).to.have.been.called;
      });
    });

    context('for a keypress action', () => {
      beforeEach(function () {
        this.keyMap = {
          'ACTION1': {
            sequence: 'a',
            action: 'keypress',
          },
        };

        this.handler = sinon.spy();

        this.handlers = {
          'ACTION1': this.handler,
        };

        this.wrapper = mount(
          <HotKeys keyMap={this.keyMap} handlers={this.handlers}>
            <div className="childElement" />
          </HotKeys>
        );

        this.targetElement = new FocusableElement(this.wrapper, '.childElement');
        this.targetElement.focus();
      });

      it('then calls the correct handler when a key is pressed that matches the keyMap', function() {
        this.targetElement.keyDown(KeyCode.A);
        this.targetElement.keyPress(KeyCode.A);

        expect(this.handler).to.have.been.called;
      });
    });

    context('for actions defined to different key events for the same key', () => {
      context('and the component is in focus', () => {
        beforeEach(function () {
          this.keyMap = {
            'KEY_DOWN': {
              sequence: 'command',
              action: 'keydown',
            },
            'KEY_UP': {
              sequence: 'command',
              action: 'keyup',
            }
          };

          this.keyDownHandler = sinon.spy();
          this.keyUpHandler = sinon.spy();

          this.handlers = {
            'KEY_DOWN': this.keyDownHandler,
            'KEY_UP': this.keyUpHandler,
          };

          this.wrapper = mount(
            <HotKeys keyMap={this.keyMap} handlers={this.handlers}>
              <div className="childElement" />
            </HotKeys>
          );

          this.targetElement = new FocusableElement(this.wrapper, '.childElement');
          this.targetElement.focus();
        });

        it('then calls the correct handler for each event', function() {
          this.targetElement.keyDown(KeyCode.COMMAND);

          expect(this.keyDownHandler).to.have.been.called;

          this.targetElement.keyUp(KeyCode.COMMAND);

          expect(this.keyUpHandler).to.have.been.called;
        });
      });

      context('and a child HotKeys component is in focus', () => {
        beforeEach(function () {
          this.keyMap = {
            'KEY_DOWN': {
              sequence: 'command',
              action: 'keydown',
            },
            'KEY_UP': {
              sequence: 'command',
              action: 'keyup',
            }
          };

          this.keyDownHandler = sinon.spy();
          this.keyUpHandler = sinon.spy();

          this.handlers = {
            'KEY_DOWN': this.keyDownHandler,
            'KEY_UP': this.keyUpHandler,
          };

          this.wrapper = mount(
            <HotKeys keyMap={this.keyMap} handlers={this.handlers}>
              <HotKeys>
                <div className="childElement" />
              </HotKeys>
            </HotKeys>
          );

          this.targetElement = new FocusableElement(this.wrapper, '.childElement');
          this.targetElement.focus();
        });

        it('then calls the correct handler for each event', function() {
          this.targetElement.keyDown(KeyCode.COMMAND);

          expect(this.keyDownHandler).to.have.been.called;

          this.targetElement.keyUp(KeyCode.COMMAND);

          expect(this.keyUpHandler).to.have.been.called;
        });
      });
    });

    context('for a keymap, without the action', () => {
      beforeEach(function () {
        this.keyMap = {
          'ACTION': {
            sequence: 'a',
          },
        };

        this.handler = sinon.spy();

        this.handlers = {
          'ACTION': this.handler,
        };

        this.wrapper = mount(
          <HotKeys keyMap={this.keyMap} handlers={this.handlers}>
            <div className="childElement" />
          </HotKeys>
        );

        this.targetElement = new FocusableElement(this.wrapper, '.childElement');
        this.targetElement.focus();
      });

      it('then calls the correct handler when a key is pressed that matches the keyMap', function() {
        this.targetElement.keyDown(KeyCode.A);

        expect(this.handler).to.have.been.called;
      });
    });
  });

  context('when using an object with the sequences attribute', () => {
    context('with an array of strings', () => {
      beforeEach(function () {
        this.keyMap = {
          'ACTION1': {
            sequences: ['enter'],
          },
        };

        this.handler = sinon.spy();

        this.handlers = {
          'ACTION1': this.handler,
        };

        this.wrapper = mount(
          <HotKeys keyMap={this.keyMap} handlers={this.handlers}>
            <div className="childElement" />
          </HotKeys>
        );

        this.targetElement = new FocusableElement(this.wrapper, '.childElement');
        this.targetElement.focus();
      });

      it('then calls the correct handler when a key is pressed that matches the keyMap', function() {
        this.targetElement.keyDown(KeyCode.ENTER);

        expect(this.handler).to.have.been.calledOnce;
      });
    });

    context('for a keydown action', () => {
      beforeEach(function () {
        this.keyMap = {
          'ACTION1': {
            sequences: [{ sequence: 'enter', action: 'keydown' }],
          },
        };

        this.handler = sinon.spy();

        this.handlers = {
          'ACTION1': this.handler,
        };

        this.wrapper = mount(
          <HotKeys keyMap={this.keyMap} handlers={this.handlers}>
            <div className="childElement" />
          </HotKeys>
        );

        this.targetElement = new FocusableElement(this.wrapper, '.childElement');
        this.targetElement.focus();
      });

      it('then calls the correct handler when a key is pressed that matches the keyMap', function() {
        this.targetElement.keyDown(KeyCode.ENTER);

        expect(this.handler).to.have.been.calledOnce;
      });
    });

    context('for a keyup action', () => {
      beforeEach(function () {
        this.keyMap = {
          'ACTION1': {
            sequences: [{ sequence: 'enter', action: 'keyup' }],
          },
        };

        this.handler = sinon.spy();

        this.handlers = {
          'ACTION1': this.handler,
        };

        this.wrapper = mount(
          <HotKeys keyMap={this.keyMap} handlers={this.handlers}>
            <div className="childElement" />
          </HotKeys>
        );

        this.targetElement = new FocusableElement(this.wrapper, '.childElement');
        this.targetElement.focus();
      });

      it('then calls the correct handler when a key is pressed that matches the keyMap', function() {
        this.targetElement.keyDown(KeyCode.ENTER);
        this.targetElement.keyUp(KeyCode.ENTER);

        expect(this.handler).to.have.been.called;
      });
    });

    context('for a keypress action', () => {
      beforeEach(function () {
        this.keyMap = {
          'ACTION1': {
            sequences: [{ sequence: 'a', action: 'keypress' }],
          },
        };

        this.handler = sinon.spy();

        this.handlers = {
          'ACTION1': this.handler,
        };

        this.wrapper = mount(
          <HotKeys keyMap={this.keyMap} handlers={this.handlers}>
            <div className="childElement" />
          </HotKeys>
        );

        this.targetElement = new FocusableElement(this.wrapper, '.childElement');
        this.targetElement.focus();
      });

      it('then calls the correct handler when a key is pressed that matches the keyMap', function() {
        this.targetElement.keyDown(KeyCode.A);
        this.targetElement.keyPress(KeyCode.A);

        expect(this.handler).to.have.been.called;
      });
    });

    context('for actions defined to different key events for the same key', () => {
      context('and the component is in focus', () => {
        beforeEach(function () {
          this.keyMap = {
            'KEY_DOWN': {
              sequences: [{ sequence: 'command', action: 'keydown' }],
            },
            'KEY_UP': {
              sequences: [{ sequence: 'command', action: 'keyup' }],
            },
          };

          this.keyDownHandler = sinon.spy();
          this.keyUpHandler = sinon.spy();

          this.handlers = {
            'KEY_DOWN': this.keyDownHandler,
            'KEY_UP': this.keyUpHandler,
          };

          this.wrapper = mount(
            <HotKeys keyMap={this.keyMap} handlers={this.handlers}>
              <div className="childElement" />
            </HotKeys>
          );

          this.targetElement = new FocusableElement(this.wrapper, '.childElement');
          this.targetElement.focus();
        });

        it('then calls the correct handler for each event', function() {
          this.targetElement.keyDown(KeyCode.COMMAND);

          expect(this.keyDownHandler).to.have.been.called;

          this.targetElement.keyUp(KeyCode.COMMAND);

          expect(this.keyUpHandler).to.have.been.called;
        });
      });

      context('and a child HotKeys component is in focus', () => {
        beforeEach(function () {
          this.keyMap = {
            'KEY_DOWN': {
              sequences: [{ sequence: 'command', action: 'keydown' }],
            },
            'KEY_UP': {
              sequences: [{ sequence: 'command', action: 'keyup' }],
            },
          };

          this.keyDownHandler = sinon.spy();
          this.keyUpHandler = sinon.spy();

          this.handlers = {
            'KEY_DOWN': this.keyDownHandler,
            'KEY_UP': this.keyUpHandler,
          };

          this.wrapper = mount(
            <HotKeys keyMap={this.keyMap} handlers={this.handlers}>
              <HotKeys>
                <div className="childElement" />
              </HotKeys>
            </HotKeys>
          );

          this.targetElement = new FocusableElement(this.wrapper, '.childElement');
          this.targetElement.focus();
        });

        it('then calls the correct handler for each event', function() {
          this.targetElement.keyDown(KeyCode.COMMAND);

          expect(this.keyDownHandler).to.have.been.called;

          this.targetElement.keyUp(KeyCode.COMMAND);

          expect(this.keyUpHandler).to.have.been.called;
        });
      });
    });

    context('for a keymap, without the action', () => {
      beforeEach(function () {
        this.keyMap = {
          'ACTION': {
            sequences: [{ sequence: 'a' }],
          },
        };

        this.handler = sinon.spy();

        this.handlers = {
          'ACTION': this.handler,
        };

        this.wrapper = mount(
          <HotKeys keyMap={this.keyMap} handlers={this.handlers}>
            <div className="childElement" />
          </HotKeys>
        );

        this.targetElement = new FocusableElement(this.wrapper, '.childElement');
        this.targetElement.focus();
      });

      it('then calls the correct handler when a key is pressed that matches the keyMap', function() {
        this.targetElement.keyDown(KeyCode.A);

        expect(this.handler).to.have.been.called;
      });
    });
  });
});
