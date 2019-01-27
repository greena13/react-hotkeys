import React from 'react';
import {mount} from 'enzyme';
import {expect} from 'chai';
import sinon from 'sinon';

import {GlobalHotKeys} from '../../src';
import {HotKeys} from '../../src/';
import KeyCode from '../support/Key';
import FocusableElement from '../support/FocusableElement';
import KeyEventManager from '../../src/lib/KeyEventManager';

describe('Global shortcuts:', () => {
  beforeEach(function() {
    KeyEventManager.clear();
  });

  before(function () {
    this.globalKeyMap = {
      'GLOBAL_ACTION': 'a',
      'COMMON_ACTION': 'b',
    };
  });

  context('when GlobalHotKeys defines handlers at the root of a React application', () => {
    beforeEach(function () {
      this.globalHandler = sinon.spy();

      this.parentDiv = document.createElement('div');
      this.reactDiv = document.createElement('div');

      document.body.appendChild(this.parentDiv);
      this.parentDiv.appendChild(this.reactDiv);
    });

    afterEach(function() {
      document.body.removeChild(this.parentDiv);
    });

    context('and there are no other GlobalHotKeys component', () => {
      beforeEach(function () {
        const handlers = {
          'GLOBAL_ACTION': this.globalHandler,
        };

        this.wrapper = mount(
          <GlobalHotKeys keyMap={this.globalKeyMap} handlers={handlers}>
            <div className="childElement" />
          </GlobalHotKeys>,
          { attachTo: this.reactDiv }
        );
      });

      context('and the React application is in focus', () => {
        beforeEach(function () {
          this.targetElement = new FocusableElement(this.wrapper, '.childElement', { nativeElement: true });
          this.targetElement.focus();
        });

        context('and a key is pressed that matches a GlobalHotKeys action', function(){
          beforeEach(function () {
            this.targetElement.keyDown(KeyCode.A);
          });

          it('then calls the correct handler', function() {
            expect(this.globalHandler).to.have.been.called;
          });
        });

        context('and a key is pressed that does NOT match a GlobalHotKeys action', () => {
          beforeEach(function () {
            this.targetElement.keyDown(KeyCode.B);
          });

          it('then does NOT call the handler ', function() {
            expect(this.globalHandler).to.not.have.been.called;
          });
        });
      });

      context('and the React application is in NOT focus', () => {
        beforeEach(function () {
          this.targetElement = new FocusableElement(this.wrapper, '.childElement', { nativeElement: true });
        });

        context('a key is pressed that matches a GlobalHotKeys action', () => {
          beforeEach(function () {
            this.targetElement.keyDown(KeyCode.A);
          });

          it('then calls the correct GlobalHotKeys handler', function() {
            expect(this.globalHandler).to.have.been.called;
          });
        });


        context('and a key is pressed that does NOT match any GlobalHotKeys actions', () => {
          beforeEach(function () {
            this.targetElement.keyDown(KeyCode.B);
          });

          it('then does NOT call the handler', function() {
            expect(this.globalHandler).to.not.have.been.called;
          });
        });
      });
    });

    context('and there is a HotKeys component inside it', () => {
      beforeEach(function () {
        this.globalCommonActionHandler = sinon.spy();

        const globalHandlers = {
          'GLOBAL_ACTION': this.globalHandler,
          'COMMON_ACTION': this.globalCommonActionHandler
        };

        this.focusKeyMap = {
          'COMMON_ACTION': 'b',
          'FOCUS_ACTION': 'c',
        };

        this.focusActionHandler = sinon.spy();
        this.focusCommonActionHandler = sinon.spy();

        const focusHandlers = {
          'FOCUS_ACTION': this.focusActionHandler,
          'COMMON_ACTION': this.focusCommonActionHandler,
        };

        this.wrapper = mount(
          <GlobalHotKeys keyMap={this.globalKeyMap} handlers={globalHandlers}>
            <HotKeys keyMap={ this.focusKeyMap } handlers={ focusHandlers }>
              <div className="childElement" />
            </HotKeys>

            <div className="siblingElement" />
          </GlobalHotKeys>,
          { attachTo: this.reactDiv }
        );
      });

      context('and the HotKeys component is focused', () => {
        beforeEach(function () {
          this.targetElement = new FocusableElement(this.wrapper, '.childElement', { nativeElement: true });
          this.targetElement.focus();
        });

        context('and a key that matches a GlobalHotKeys action is pressed', () => {
          beforeEach(function () {
            this.targetElement.keyDown(KeyCode.A);
          });

          it('then calls the correct GlobalHotKeys handler', function() {
            expect(this.globalHandler).to.have.been.called;
          });
        });

        context('and a key that matches a HotKeys action is pressed', () => {
          beforeEach(function () {
            this.targetElement.keyDown(KeyCode.C);
          });

          it('then calls the HotKeys handler', function() {
            expect(this.focusActionHandler).to.have.been.called;
          });
        });

        context('and a key that matches HotKeys and GlobalHotKeys actions is pressed', () => {
          beforeEach(function () {
            this.targetElement.keyDown(KeyCode.B);
          });

          it('then calls the closest HotKeys handler (over the GlobalHotKeys handler)', function() {
            expect(this.focusCommonActionHandler).to.have.been.called;
            expect(this.globalCommonActionHandler).to.not.have.been.called;
          });
        });
      });

      context('and the HotKeys component is NOT in focus (but the React app still is)', () => {
        beforeEach(function () {
          this.targetElement = new FocusableElement(this.wrapper, '.siblingElement', { nativeElement: true });
          this.targetElement.focus();
        });

        context('and a key that matches a GlobalHotKeys action is pressed', () => {
          beforeEach(function () {
            this.targetElement.keyDown(KeyCode.A);
          });

          it('then calls the HotKeys handler', function() {
            expect(this.globalHandler).to.have.been.called;
          });
        });

        context('and a key that matches a HotKeys action is pressed', () => {
          beforeEach(function () {
            this.targetElement.keyDown(KeyCode.C);
          });

          it('then does NOT call the HotKeys handler', function() {
            expect(this.focusActionHandler).to.not.have.been.called;
          });
        });

        context('and a key that matches both HotKeys and the GlobalHotKeys actions is pressed', () => {
          beforeEach(function () {
            this.targetElement.keyDown(KeyCode.B);
          });

          it('then calls the GlobalHotKeys handler', function() {
            expect(this.globalCommonActionHandler).to.have.been.called;
            expect(this.focusCommonActionHandler).to.not.have.been.called;
          });
        });
      });

      context('and the React app is NOT in focus', () => {
        beforeEach(function () {
          this.targetElement = new FocusableElement(this.wrapper, '.childElement', { nativeElement: true });
        });

        context('and a key that matches a GlobalHotKeys action is pressed', () => {
          beforeEach(function () {
            this.targetElement.keyDown(KeyCode.A);
          });

          it('then calls the GlobalHotKeys handler', function() {
            expect(this.globalHandler).to.have.been.called;
          });
        });

        context('and a key that matches a HotKeys action is pressed', () => {
          beforeEach(function () {
            this.targetElement.keyDown(KeyCode.C);
          });

          it('then does NOT call the HotKeys handler', function() {
            expect(this.focusActionHandler).to.not.have.been.called;
          });
        });

        context('and a key that matches both HotKeys and the GlobalHotKeys is pressed', () => {
          beforeEach(function () {
            this.targetElement.keyDown(KeyCode.B);
          });

          it('then calls the GlobalHotKeys handler', function() {
            expect(this.globalCommonActionHandler).to.have.been.called;
            expect(this.focusCommonActionHandler).to.not.have.been.called;
          });
        });
      });
    });
  });

  context('when a GlobalHotKeys component is nested inside a HotKeys component', () => {
    beforeEach(function () {
      this.globalHandler = sinon.spy();

      this.parentDiv = document.createElement('div');
      this.reactDiv = document.createElement('div');

      document.body.appendChild(this.parentDiv);
      this.parentDiv.appendChild(this.reactDiv);

      this.globalCommonActionHandler = sinon.spy();

      const globalHandlers = {
        'GLOBAL_ACTION': this.globalHandler,
        'COMMON_ACTION': this.globalCommonActionHandler
      };

      this.focusKeyMap = {
        'COMMON_ACTION': 'b',
        'FOCUS_ACTION': 'c',
      };

      this.focusActionHandler = sinon.spy();
      this.focusCommonActionHandler = sinon.spy();

      const focusHandlers = {
        'FOCUS_ACTION': this.focusActionHandler,
        'COMMON_ACTION': this.focusCommonActionHandler,
      };

      this.wrapper = mount(
        <div>
          <HotKeys keyMap={ this.focusKeyMap } handlers={ focusHandlers }>
            <GlobalHotKeys keyMap={this.globalKeyMap} handlers={globalHandlers}>
              <div className="childElement" />
            </GlobalHotKeys>
          </HotKeys>

          <div className="siblingElement" />
        </div>,
        { attachTo: this.reactDiv }
      );
    });

    afterEach(function() {
      document.body.removeChild(this.parentDiv);
    });

    context('and the GlobalHotKeys component is in focus', () => {
      beforeEach(function () {
        this.targetElement = new FocusableElement(this.wrapper, '.childElement', { nativeElement: true });
        this.targetElement.focus();
      });

      context('and key that matches a GlobalHotKeys action is pressed', () => {
        beforeEach(function () {
          this.targetElement.keyDown(KeyCode.A);
        });

        it('then calls the GlobalHotKeys handler', function() {
          expect(this.globalHandler).to.have.been.called;
        });
      });

      context('and a key that matches a HotKeys action is pressed', () => {
        beforeEach(function () {
          this.targetElement.keyDown(KeyCode.C);
        });

        it('then calls the HotKeys handler', function() {
          expect(this.focusActionHandler).to.have.been.called;
        });
      });

      context('and a key matching both HotKeys and the GlobalHotKeys is pressed', () => {
        beforeEach(function () {
          this.targetElement.keyDown(KeyCode.B);
        });

        it('then calls the closest HotKeys handler (over the GlobalHotKeys handler)', function() {
          expect(this.focusCommonActionHandler).to.have.been.called;
          expect(this.globalCommonActionHandler).to.not.have.been.called;
        });
      });
    });

    context('and the GlobalHotKeys is NOT in focus (but the React app still is)', () => {
      beforeEach(function () {
        this.targetElement = new FocusableElement(this.wrapper, '.siblingElement', { nativeElement: true });
        this.targetElement.focus();
      });

      context('and a key that matches a GlobalHotKeys action is pressed', () => {
        beforeEach(function () {
          this.targetElement.keyDown(KeyCode.A);
        });

        it('then calls the GlobalHotKeys handler', function() {
          expect(this.globalHandler).to.have.been.called;
        });
      });

      context('and a key that matches a HotKeys action is pressed', () => {
        beforeEach(function () {
          this.targetElement.keyDown(KeyCode.C);
        });

        it('then does NOT call the HotKeys handler', function() {
          expect(this.focusActionHandler).to.not.have.been.called;
        });
      });

      context('and a key that matches both HotKeys and the GlobalHotKeys actions is pressed', () => {
        beforeEach(function () {
          this.targetElement.keyDown(KeyCode.B);
        });

        it('then calls the GlobalHotKeys handler', function() {
          expect(this.globalCommonActionHandler).to.have.been.called;
          expect(this.focusCommonActionHandler).to.not.have.been.called;
        });
      });
    });

    context('and the React app is NOT in focus', () => {
      beforeEach(function () {
        this.targetElement = new FocusableElement(this.wrapper, '.childElement', { nativeElement: true });
      });

      context('and a key that matches a GlobalHotKeys action is pressed', () => {
        beforeEach(function () {
          this.targetElement.keyDown(KeyCode.A);
        });

        it('then calls the GlobalHotKeys handler', function() {
          expect(this.globalHandler).to.have.been.called;
        });
      });

      context('and a key that matches a HotKeys handles is pressed', () => {
        beforeEach(function () {
          this.targetElement.keyDown(KeyCode.C);
        });

        it('then does NOT call the HotKeys handler', function() {
          expect(this.focusActionHandler).to.not.have.been.called;
        });
      });

      context('and a key that matches both HotKeys and GlobalHotKeys actions is pressed', () => {
        beforeEach(function () {
          this.targetElement.keyDown(KeyCode.B);
        });

        it('then calls the GlobalHotKeys handler', function() {
          expect(this.globalCommonActionHandler).to.have.been.called;
          expect(this.focusCommonActionHandler).to.not.have.been.called;
        });
      });
    });

  });
});
