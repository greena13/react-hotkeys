import React from 'react';
import { expect } from 'chai';
import {mount} from 'enzyme';
import sinon from 'sinon';

import Key from '../support/Key';
import KeyEventManager from '../../src/lib/KeyEventManager';
import { GlobalHotKeys, HotKeys } from '../../src';
import FocusableElement from '../support/FocusableElement';

describe('Simulating keypress events hidden by cmd:', function () {
  context('when HotKeys and GlobalHotkeys are mounted at the same time', () => {
    context('and there is NO action bound to the cmd combination', () => {
      beforeEach(function () {
        this.keyMap = {
          'ACTION1': 'enter'
        };

        this.globalKeyMap = {
          'ACTION2': 'enter'
        };

        this.handler = sinon.spy();

        this.handlers = {
          'ACTION1': this.handler,
        };

        this.globalHandlers = {
          'ACTION2': sinon.spy()
        };

        this.reactDiv = document.createElement('div');
        document.body.appendChild(this.reactDiv);

        this.wrapper = mount(
          <HotKeys keyMap={this.keyMap} handlers={this.handlers}>
            <div className="childElement" ref={(element) => this.childElement = element}/>

            <GlobalHotKeys
              keyMap={this.globalKeyMap}
              handlers={this.globalHandlers}
            />
          </HotKeys>,
          { attachTo: this.reactDiv }
        );

        this.keyEventManager = KeyEventManager.getInstance();

        this.targetElement = new FocusableElement(this.wrapper, '.childElement', {nativeElement: this.reactDiv});
        this.targetElement.focus();
      });

      afterEach(function() {
        document.body.removeChild(this.reactDiv);
      });

      it('then simulates the cmd keypress event and the non-modifier key\'s keypress event', function () {
        this.targetElement.keyDown(Key.COMMAND);

        expect(this.keyEventManager._focusOnlyEventStrategy.keyCombinationHistory).to.eql([
          {
            'keys': {
              'Meta': [
                [true, false, false],
                [true, true, false]
              ]
            },
            'ids': ['Meta'],
            'keyAliases': {}
          }
        ]);

        expect(this.keyEventManager._globalEventStrategy.keyCombinationHistory).to.eql([
          {
            'keys': {
              'Meta': [
                [true, false, false],
                [true, true, false]
              ]
            },
            'ids': ['Meta'],
            'keyAliases': {}
          }
        ]);

        this.targetElement.keyDown(Key.A);

        expect(this.keyEventManager._focusOnlyEventStrategy.keyCombinationHistory).to.eql([
          {
            'keys': {
              'Meta': [
                [true, false, false],
                [true, true, false]
              ],
              'a': [
                [true, false, false],
                [true, true, false]
              ]
            },
            'ids': ['Meta+a'],
            'keyAliases': {}
          }
        ]);

        expect(this.keyEventManager._globalEventStrategy.keyCombinationHistory).to.eql([
          {
            'keys': {
              'Meta': [
                [true, false, false],
                [true, true, false]
              ],
              'a': [
                [true, false, false],
                [true, true, false]
              ]
            },
            'ids': ['Meta+a'],
            'keyAliases': {}
          }
        ]);

        this.targetElement.keyUp(Key.COMMAND);

        expect(this.keyEventManager._focusOnlyEventStrategy.keyCombinationHistory).to.eql([
          {
            'keys': {
              'Meta': [
                [true, true, false],
                [true, true, true]
              ],
              'a': [
                [true, true, false],
                [true, true, true]
              ]
            },
            'ids': ['Meta+a'],
            'keyAliases': {}
          }
        ]);

        expect(this.keyEventManager._globalEventStrategy.keyCombinationHistory).to.eql([
          {
            'keys': {
              'Meta': [
                [true, true, false],
                [true, true, true]
              ],
              'a': [
                [true, true, false],
                [true, true, true]
              ]
            },
            'ids': ['Meta+a'],
            'keyAliases': {}
          }
        ]);
      });
    });

    context('and there is an action bound to the cmd combination', () => {
      beforeEach(function () {
        this.keyMap = {
          'ACTION1': 'cmd+a'
        };

        this.globalKeyMap = {
          'ACTION2': 'enter'
        };

        this.handler = sinon.spy();

        this.handlers = {
          'ACTION1': this.handler,
        };

        this.globalHandlers = {
          'ACTION2': sinon.spy()
        };

        this.reactDiv = document.createElement('div');
        document.body.appendChild(this.reactDiv);

        this.wrapper = mount(
          <HotKeys keyMap={this.keyMap} handlers={this.handlers}>
            <div className="childElement" ref={(element) => this.childElement = element}/>

            <GlobalHotKeys
              keyMap={this.globalKeyMap}
              handlers={this.globalHandlers}
            />
          </HotKeys>,
          { attachTo: this.reactDiv }
        );

        this.keyEventManager = KeyEventManager.getInstance();

        this.targetElement = new FocusableElement(this.wrapper, '.childElement', {nativeElement: this.reactDiv});
        this.targetElement.focus();
      });

      afterEach(function() {
        document.body.removeChild(this.reactDiv);
      });

      it('then simulates the cmd keypress event and the non-modifier key\'s keypress event', function () {
        this.targetElement.keyDown(Key.COMMAND);

        expect(this.keyEventManager._focusOnlyEventStrategy.keyCombinationHistory).to.eql([
          {
            'keys': {
              'Meta': [
                [true, false, false],
                [true, true, false]
              ]
            },
            'ids': ['Meta'],
            'keyAliases': {}
          }
        ]);

        expect(this.keyEventManager._globalEventStrategy.keyCombinationHistory).to.eql([
          {
            'keys': {
              'Meta': [
                [true, false, false],
                [true, true, false]
              ]
            },
            'ids': ['Meta'],
            'keyAliases': {}
          }
        ]);

        this.targetElement.keyDown(Key.A);

        expect(this.keyEventManager._focusOnlyEventStrategy.keyCombinationHistory).to.eql([
          {
            'keys': {
              'Meta': [
                [true, false, false],
                [true, true, false]
              ],
              'a': [
                [true, false, false],
                [true, true, false]
              ]
            },
            'ids': ['Meta+a'],
            'keyAliases': {}
          }
        ]);

        /**
         * The global event strategy ignores the a key entirely, as it was handled
         * by the React app
         */
        expect(this.keyEventManager._globalEventStrategy.keyCombinationHistory).to.eql([
          {
            'keys': {
              'Meta': [
                [true, false, false],
                [true, true, false]
              ]
            },
            'ids': ['Meta'],
            'keyAliases': {}
          }
        ]);

        this.targetElement.keyUp(Key.COMMAND);

        expect(this.keyEventManager._focusOnlyEventStrategy.keyCombinationHistory).to.eql([
          {
            'keys': {
              'Meta': [
                [true, true, false],
                [true, true, true]
              ],
              'a': [
                [true, true, false],
                [true, true, true]
              ]
            },
            'ids': ['Meta+a'],
            'keyAliases': {}
          }
        ]);

        expect(this.keyEventManager._globalEventStrategy.keyCombinationHistory).to.eql([
          {
            'keys': {
              'Meta': [
                [true, true, false],
                [true, true, true]
              ]
            },
            'ids': ['Meta'],
            'keyAliases': {}
          }
        ]);
      });
    });
  });
});
