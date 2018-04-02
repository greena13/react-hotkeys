import React from 'react';
import {mount} from 'enzyme';
import {expect} from 'chai';
import sinon from 'sinon';

import HotKeys from '../../lib/HotKeys';
import KeyCode from '../support/Key';
import FocusableElement from '../support/FocusableElement';

/**
 * v3.0.0 Sees a change in this behaviour
 */
describe('Nested key map definitions:', () => {
  before(function () {
    this.outerKeyMap = {
      'ENTER_OUTER': 'enter',
      'TAB_OUTER': 'tab',
    };

    this.innerKeyMap = {
      'ENTER_INNER': 'enter',
      'ALT_INNER': 'alt',
    };

  });

  context('when components are nested with key maps that overlap', () => {

    context('and only the outer component has handlers defined', () => {
      beforeEach(function () {
        this.enterOuterHandler = sinon.spy();
        this.tabHandler = sinon.spy();
        this.enterInnerHandler = sinon.spy();
        this.altHandler = sinon.spy();

        const handlers = {
          'ENTER_OUTER': this.enterOuterHandler,
          'TAB_OUTER': this.tabHandler,
          'ENTER_INNER': this.enterInnerHandler,
          'ALT_INNER': this.altHandler,
        };

        this.wrapper = mount(
          <HotKeys keyMap={this.outerKeyMap} handlers={handlers}>
            <div className="outerChildElement" />

            <HotKeys keyMap={this.innerKeyMap}>
              <div className="innerChildElement" />
            </HotKeys>
          </HotKeys>
        );

      });

      context('and a child of the outer component is in focus', () => {
        beforeEach(function () {
          this.targetElement = new FocusableElement(this.wrapper, '.outerChildElement');
          this.targetElement.focus();
        });

        it('then calls the handler for the action defined in the outer component when keys that match hotkeys defined only in the outer component are pressed', function() {
          this.targetElement.keyPress(KeyCode.TAB);

          expect(this.tabHandler).to.have.been.called;

          expect(this.enterOuterHandler).to.not.have.been.called;
          expect(this.enterInnerHandler).to.not.have.been.called;
          expect(this.altHandler).to.not.have.been.called;
        });

        it('then does not trigger any action when keys that match hotkeys defined only in the inner component are pressed', function() {
          this.targetElement.keyPress(KeyCode.ALT);

          expect(this.tabHandler).to.not.have.been.called;
          expect(this.enterOuterHandler).to.not.have.been.called;
          expect(this.enterInnerHandler).to.not.have.been.called;
          expect(this.altHandler).to.not.have.been.called;
        });

        it('then calls the handler for the action defined in the outer component when keys that match hotkeys defined in both components are pressed', function() {
          this.targetElement.keyPress(KeyCode.ENTER);

          expect(this.enterOuterHandler).to.have.been.called;

          expect(this.tabHandler).to.not.have.been.called;
          expect(this.enterInnerHandler).to.not.have.been.called;
          expect(this.altHandler).to.not.have.been.called;
        });

      });

      context('and a child of the inner component is in focus', () => {
        beforeEach(function () {
          this.targetElement = new FocusableElement(this.wrapper, '.innerChildElement');
          this.targetElement.focus();
        });

        it('then calls the handler for the action defined in the outer component when keys that match hotkeys defined only in the outer component are pressed', function() {
          this.targetElement.keyPress(KeyCode.TAB);

          expect(this.tabHandler).to.have.been.called;

          expect(this.enterOuterHandler).to.not.have.been.called;
          expect(this.enterInnerHandler).to.not.have.been.called;
          expect(this.altHandler).to.not.have.been.called;
        });

        it('then calls the handler defined in the outer component when keys that match an action defined only in the inner component are pressed', function() {
          this.targetElement.keyPress(KeyCode.ALT);

          expect(this.altHandler).to.have.been.called;

          expect(this.enterOuterHandler).to.not.have.been.called;
          expect(this.enterInnerHandler).to.not.have.been.called;
          expect(this.tabHandler).to.not.have.been.called;
        });

        it('then calls the handler defined in the outer component for the action defined in the inner component when keys that match hotkeys defined in both components are pressed', function() {
          this.targetElement.keyPress(KeyCode.ENTER);

          expect(this.enterInnerHandler).to.have.been.called;
          expect(this.enterOuterHandler).to.not.have.been.called;

          expect(this.tabHandler).to.not.have.been.called;
          expect(this.altHandler).to.not.have.been.called;
        });

      });

    });

    context('and only the inner component has handlers defined', () => {
      beforeEach(function () {
        this.enterOuterHandler = sinon.spy();
        this.tabHandler = sinon.spy();
        this.enterInnerHandler = sinon.spy();
        this.altHandler = sinon.spy();

        const handlers = {
          'ENTER_OUTER': this.enterOuterHandler,
          'TAB': this.tabHandler,
          'ENTER_INNER': this.enterInnerHandler,
          'ALT': this.altHandler,
        };

        this.wrapper = mount(
          <HotKeys keyMap={this.outerKeyMap} >
            <div className="outerChildElement" />

            <HotKeys keyMap={this.innerKeyMap} handlers={handlers}>
              <div className="innerChildElement" />
            </HotKeys>
          </HotKeys>
        );

      });

      context('and a child of the outer component is in focus', () => {
        beforeEach(function () {
          this.targetElement = new FocusableElement(this.wrapper, '.outerChildElement');
          this.targetElement.focus();
        });

        it('then does not trigger any action when keys that match hotkeys defined only in the outer component are pressed', function() {
          this.targetElement.keyPress(KeyCode.TAB);

          expect(this.tabHandler).to.not.have.been.called;
          expect(this.enterOuterHandler).to.not.have.been.called;
          expect(this.enterInnerHandler).to.not.have.been.called;
          expect(this.altHandler).to.not.have.been.called;
        });

        it('then does not trigger any action when keys that match hotkeys defined only in the inner component are pressed', function() {
          this.targetElement.keyPress(KeyCode.ALT);

          expect(this.tabHandler).to.not.have.been.called;
          expect(this.enterOuterHandler).to.not.have.been.called;
          expect(this.enterInnerHandler).to.not.have.been.called;
          expect(this.altHandler).to.not.have.been.called;
        });

        it('then does not trigger any action when keys that match hotkeys defined in both components are pressed', function() {
          this.targetElement.keyPress(KeyCode.ENTER);

          expect(this.enterOuterHandler).to.not.have.been.called;
          expect(this.tabHandler).to.not.have.been.called;
          expect(this.enterInnerHandler).to.not.have.been.called;
          expect(this.altHandler).to.not.have.been.called;
        });

      });

      context('and a child of the inner component is in focus', () => {
        beforeEach(function () {
          this.targetElement = new FocusableElement(this.wrapper, '.innerChildElement');
          this.targetElement.focus();
        });

        it('then calls the handler for the action defined in the outer component when keys that match hotkeys defined only in the outer component are pressed', function() {
          this.targetElement.keyPress(KeyCode.TAB);

          expect(this.tabHandler).to.have.been.called;

          expect(this.enterOuterHandler).to.not.have.been.called;
          expect(this.enterInnerHandler).to.not.have.been.called;
          expect(this.altHandler).to.not.have.been.called;
        });

        xit('then calls the handler for the action defined in the inner component when keys that match hotkeys defined only in the inner component are pressed', function() {
          this.targetElement.keyPress(KeyCode.ALT);

          expect(this.altHandler).to.have.been.called;

          expect(this.tabHandler).to.not.have.been.called;
          expect(this.enterOuterHandler).to.not.have.been.called;
          expect(this.enterInnerHandler).to.not.have.been.called;
        });

        it('then calls the handler for the action defined in the inner component when keys that match hotkeys defined in both components are pressed', function() {
          this.targetElement.keyPress(KeyCode.ENTER);

          expect(this.enterInnerHandler).to.have.been.called;

          expect(this.enterOuterHandler).to.not.have.been.called;
          expect(this.tabHandler).to.not.have.been.called;
          expect(this.altHandler).to.not.have.been.called;
        });

      });
    });

    context('and both components have handlers defined', () => {
      beforeEach(function () {
        this.enterOuterActionOuterHandler = sinon.spy();
        this.tabOuterHandler = sinon.spy();
        this.enterInnerActionOuterHandler = sinon.spy();
        this.altOuterHandler = sinon.spy();

        this.enterOuterActionInnerHandler = sinon.spy();
        this.tabInnerHandler = sinon.spy();
        this.enterInnerActionInnerHandler = sinon.spy();
        this.altInnerHandler = sinon.spy();

        const outerHandlers = {
          'ENTER_OUTER': this.enterOuterActionOuterHandler,
          'TAB': this.tabOuterHandler,
          'ENTER_INNER': this.enterInnerActionOuterHandler,
          'ALT': this.altOuterHandler,
        };

        const innerHandlers = {
          'ENTER_OUTER': this.enterOuterActionInnerHandler,
          'TAB': this.tabInnerHandler,
          'ENTER_INNER': this.enterInnerActionInnerHandler,
          'ALT': this.altInnerHandler,
        };

        this.wrapper = mount(
          <HotKeys keyMap={this.outerKeyMap} handlers={outerHandlers}>
            <div className="outerChildElement" />

            <HotKeys keyMap={this.innerKeyMap} handlers={innerHandlers}>
              <div className="innerChildElement" />
            </HotKeys>
          </HotKeys>
        );

      });

      context('and a child of the outer component is in focus', () => {
        beforeEach(function () {
          this.targetElement = new FocusableElement(this.wrapper, '.outerChildElement');
          this.targetElement.focus();
        });

        it('then calls the handler defined in the outer component for the the action defined in the outer component when keys that match hotkeys defined only in the outer component are pressed', function() {
          this.targetElement.keyPress(KeyCode.TAB);

          expect(this.enterOuterActionOuterHandler).to.have.not.been.called;
          expect(this.tabOuterHandler).to.have.been.called;
          expect(this.enterInnerActionOuterHandler).to.have.not.been.called;
          expect(this.altOuterHandler).to.have.not.been.called;

          expect(this.enterOuterActionInnerHandler).to.have.not.been.called;
          expect(this.tabInnerHandler).to.have.not.been.called;
          expect(this.enterInnerActionInnerHandler).to.have.not.been.called;
          expect(this.altInnerHandler).to.have.not.been.called;
        });

        it('then does not trigger any action when keys that match hotkeys defined only in the inner component are pressed', function() {
          this.targetElement.keyPress(KeyCode.ALT);

          expect(this.altOuterHandler).to.have.been.called;
          expect(this.enterOuterActionOuterHandler).to.have.not.been.called;
          expect(this.tabOuterHandler).to.have.not.been.called;
          expect(this.enterInnerActionOuterHandler).to.have.not.been.called;

          expect(this.enterOuterActionInnerHandler).to.have.not.been.called;
          expect(this.tabInnerHandler).to.have.not.been.called;
          expect(this.enterInnerActionInnerHandler).to.have.not.been.called;
          expect(this.altInnerHandler).to.have.not.been.called;
        });

        it('then calls the handler defined in the outer component for the action defined in the outer component when keys that match hotkeys defined in both components are pressed', function() {
          this.targetElement.keyPress(KeyCode.ENTER);

          expect(this.enterOuterActionOuterHandler).to.have.been.called;
          expect(this.tabOuterHandler).to.have.not.been.called;
          expect(this.enterInnerActionOuterHandler).to.have.not.been.called;
          expect(this.altOuterHandler).to.have.not.been.called;

          expect(this.enterOuterActionInnerHandler).to.have.not.been.called;
          expect(this.tabInnerHandler).to.have.not.been.called;
          expect(this.enterInnerActionInnerHandler).to.have.not.been.called;
          expect(this.altInnerHandler).to.have.not.been.called;
        });

      });

      context('and a child of the inner component is in focus', () => {
        beforeEach(function () {
          this.targetElement = new FocusableElement(this.wrapper, '.innerChildElement');
          this.targetElement.focus();
        });

        it('then calls the handler defined in the inner component for the action defined in the outer component when keys that match hotkeys defined only in the outer component are pressed', function() {
          this.targetElement.keyPress(KeyCode.TAB);

          expect(this.enterOuterActionOuterHandler).to.have.not.been.called;
          expect(this.tabOuterHandler).to.have.not.been.called;
          expect(this.enterInnerActionOuterHandler).to.have.not.been.called;
          expect(this.altOuterHandler).to.have.not.been.called;

          expect(this.enterOuterActionInnerHandler).to.have.not.been.called;
          expect(this.tabInnerHandler).to.have.been.called;
          expect(this.enterInnerActionInnerHandler).to.have.not.been.called;
          expect(this.altInnerHandler).to.have.not.been.called;
        });

        xit('then calls the handler defined in the inner component for the action defined in the inner component when keys that match hotkeys defined only in the inner component are pressed', function() {
          this.targetElement.keyPress(KeyCode.ALT);

          expect(this.enterOuterActionOuterHandler).to.have.not.been.called;
          expect(this.tabOuterHandler).to.have.not.been.called;
          expect(this.enterInnerActionOuterHandler).to.have.not.been.called;
          expect(this.altOuterHandler).to.have.not.been.called;

          expect(this.enterOuterActionInnerHandler).to.have.not.been.called;
          expect(this.tabInnerHandler).to.have.not.been.called;
          expect(this.enterInnerActionInnerHandler).to.have.not.been.called;
          expect(this.altInnerHandler).to.have.been.called;
        });

        it('then calls the handler defined in the inner component for the action defined in the inner component when keys that match hotkeys defined in both components are pressed', function() {
          this.targetElement.keyPress(KeyCode.ENTER);

          expect(this.enterOuterActionOuterHandler).to.have.not.been.called;
          expect(this.tabOuterHandler).to.have.not.been.called;
          expect(this.enterInnerActionOuterHandler).to.have.not.been.called;
          expect(this.altOuterHandler).to.have.not.been.called;

          expect(this.enterOuterActionInnerHandler).to.have.not.been.called;
          expect(this.tabInnerHandler).to.have.not.been.called;
          expect(this.enterInnerActionInnerHandler).to.have.been.called;
          expect(this.altInnerHandler).to.have.not.been.called;
        });

      });

    });
  });

});
