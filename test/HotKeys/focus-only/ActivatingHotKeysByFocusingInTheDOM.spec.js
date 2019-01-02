import React from 'react';
import {mount} from 'enzyme';
import {expect} from 'chai';
import sinon from 'sinon';

import HotKeys from '../../../src/HotKeys';
import KeyCode from '../../support/Key';
import FocusableElement from '../../support/FocusableElement';
import KeyEventManager from '../../../src/lib/KeyEventManager';

beforeEach(function() {
  KeyEventManager.clear();
});

describe('Activating hotkeys by focusing in the DOM:', () => {
  before(function () {
    this.keyMap = {
      'ACTION1': 'a',
      'ACTION2': 'b',
    };
  });

  context('when a keyMap and a handler are provided to the same component', () => {
    beforeEach(function () {
      this.handler = sinon.spy();

      const handlers = {
        'ACTION1': this.handler,
      };

      this.wrapper = mount(
        <div >
          <HotKeys keyMap={this.keyMap} handlers={handlers}>
            <div className="childElement" />
          </HotKeys>

          <div className="siblingElement" />
        </div>
        );
    });

    context('and a child element is focused', () => {
      beforeEach(function () {
        this.targetElement = new FocusableElement(this.wrapper, '.childElement');
        this.targetElement.focus();
      });

      it('then calls the correct handler when a key is pressed that matches the keyMap', function() {
        this.targetElement.keyPress(KeyCode.A);

        expect(this.handler).to.have.been.called;
      });

      it('then does NOT call the handler when a key is pressed that does NOT matches the keyMap', function() {
        this.targetElement.keyPress(KeyCode.B);

        expect(this.handler).to.not.have.been.called;
      });
    });

    context('and a sibling element is focused', () => {
      beforeEach(function () {
        this.targetElement = new FocusableElement(this.wrapper, '.siblingElement');
        this.targetElement.focus();
      });

      it('then does NOT calls the handler when a key is pressed that matches the keyMap', function() {
        this.targetElement.keyPress(KeyCode.A);

        expect(this.handler).to.not.have.been.called;
      });
    });
  });

  context('when a keyMap is provided to a parent component and a handler to a child component', () => {

    beforeEach(function () {
      this.handler = sinon.spy();

      const handlers = {
        'ACTION1': this.handler,
      };

      this.wrapper = mount(
        <div >
          <HotKeys keyMap={this.keyMap}>
            <div >
              <HotKeys handlers={handlers}>
                <div className={'handlerChildElement'}/>
              </HotKeys>
            </div>
            <div className={'keyMapChildElement'}/>
          </HotKeys>

          <div className={'siblingElement'}/>
        </div>
        );
    });

    context('and a child element of the component defining the handlers is focused', () => {
      beforeEach(function () {
        this.targetElement = new FocusableElement(this.wrapper, '.handlerChildElement');
        this.targetElement.focus();
      });

      it('then calls the correct handler when a key is pressed that matches the keyMap', function() {
        this.targetElement.keyPress(KeyCode.A);

        expect(this.handler).to.have.been.called;
      });

      it('then does NOT call the handler when a key is pressed that does NOT matches the keyMap', function() {
        this.targetElement.keyPress(KeyCode.B);

        expect(this.handler).to.not.have.been.called;
      });
    });

    context('and a child element of the component defining the keyMap is focused', () => {
      beforeEach(function () {
        this.targetElement = new FocusableElement(this.wrapper, '.keyMapChildElement');
        this.targetElement.focus();
      });

      it('then does NOT call the handler when a key is pressed that matches the keyMap', function() {
        this.targetElement.keyPress(KeyCode.A);

        expect(this.handler).to.not.have.been.called;
      });
    });

    context('and a sibling element is focused', () => {
      beforeEach(function () {
        this.targetElement = new FocusableElement(this.wrapper, '.siblingElement');
        this.targetElement.focus();
      });

      it('then does NOT calls the handler when a key is pressed that matches the keyMap', function() {
        this.targetElement.keyPress(KeyCode.A);

        expect(this.handler).to.not.have.been.called;
      });
    });
  });

  context('when HotKey components defining handlers are nested inside each other', () => {

    beforeEach(function () {
      this.outerEnterHandler = sinon.spy();
      this.outerTabHandler = sinon.spy();
      this.innerEnterHandler = sinon.spy();

      this.outerHandlers = {
        'ACTION1': this.outerEnterHandler,
        'ACTION2': this.outerTabHandler,
      };

      this.innerHandlers = {
        'ACTION1': this.innerEnterHandler,
      };

      this.wrapper = mount(
        <HotKeys keyMap={this.keyMap}>
          <div >
            <HotKeys handlers={this.outerHandlers}>
              <div className={'outerElement'}/>

              <HotKeys handlers={this.innerHandlers}>
                <div className={'innerElement'}/>
              </HotKeys>
            </HotKeys>
          </div>
        </HotKeys>
      );
    });

    context('and a child element of the inner component is in focus', () => {
      beforeEach(function () {
        this.targetElement = new FocusableElement(this.wrapper, '.innerElement');
        this.targetElement.focus();
      });

      it('then only calls the handler defined in the inner component when a key is pressed for which handlers are defined in both components', function() {
        this.targetElement.keyPress(KeyCode.A);

        expect(this.innerEnterHandler).to.have.been.called;
        expect(this.outerEnterHandler).to.not.have.been.called;
      });

      it('then calls the handler defined in the outer component when a key is pressed that only the outer component has a handler for', function() {
        this.targetElement.keyPress(KeyCode.B);

        expect(this.outerTabHandler).to.have.been.called;
      });

      it('then does not call any handlers when a key that doesn\'t match any handlers is pressed', function() {
        this.targetElement.keyPress(KeyCode.C);

        expect(this.innerEnterHandler).to.not.have.been.called;
        expect(this.outerTabHandler).to.not.have.been.called;
        expect(this.outerEnterHandler).to.not.have.been.called;
      });

    });

    context('and a child element of the outer component is in focus', () => {
      beforeEach(function () {
        this.targetElement = new FocusableElement(this.wrapper, '.outerElement');
        this.targetElement.focus();
      });

      it('then only calls the handler defined in the outer component when a key is pressed for which handlers are defined in both components', function() {
        this.targetElement.keyPress(KeyCode.A);

        expect(this.innerEnterHandler).to.not.have.been.called;
        expect(this.outerEnterHandler).to.have.been.called;
      });

      it('then calls the handler defined in the outer component when a key is pressed that only the outer component has a handler for', function() {
        this.targetElement.keyPress(KeyCode.B);

        expect(this.outerTabHandler).to.have.been.called;
      });

      it('then does not call any handlers when a key that doesn\'t match any handlers is pressed', function() {
        this.targetElement.keyPress(KeyCode.C);

        expect(this.innerEnterHandler).to.not.have.been.called;
        expect(this.outerTabHandler).to.not.have.been.called;
        expect(this.outerEnterHandler).to.not.have.been.called;
      });

    });
  });
});
