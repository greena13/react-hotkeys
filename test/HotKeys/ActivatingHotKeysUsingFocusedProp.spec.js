import React from 'react';
import {mount} from 'enzyme';
import {expect} from 'chai';
import sinon from 'sinon';

import HotKeys from '../../lib/HotKeys';
import KeyCode from '../support/KeyCode';
import FocusableElement from '../support/FocusableElement';

describe('Activating hotkeys using focused prop:', () => {
  before(function () {
    this.keyMap = {
      'ENTER': 'enter',
      'TAB': 'tab',
    };
  });

  context('when a keyMap and a handler are provided to the same component and a child element is NOT focused', () => {

    beforeEach(function () {
      this.handler = sinon.spy();

      this.handlers = {
        'ENTER': this.handler,
      };
    });

    context('and no value has been passed to focused', () => {
      beforeEach(function () {
        this.wrapper = mount(
          <HotKeys keyMap={this.keyMap} handlers={this.handlers}>
            <input className="childElement" />
          </HotKeys>
        );

        this.input = new FocusableElement(this.wrapper, '.childElement');
      });

      it('then DOES NOT call the handler when a key is pressed that matches the keyMap', function() {
        this.input.keyDown(KeyCode.ENTER);

        expect(this.handler).to.not.have.been.called;
      });
    });

    context('and focused has been set to true', () => {
      beforeEach(function () {
        this.wrapper = mount(
          <HotKeys keyMap={this.keyMap} handlers={this.handlers} focused>
            <input className="childElement" />
          </HotKeys>
        );

        this.input = new FocusableElement(this.wrapper, '.childElement');
      });

      it('then calls the correct handler when a key is pressed that matches the keyMap', function() {
        this.input.keyDown(KeyCode.ENTER);

        expect(this.handler).to.have.been.called;
      });
    });
  });

  context('when a keyMap is provided to a parent component and a handler to a child component', () => {

    beforeEach(function () {
      this.handler = sinon.spy();

      this.handlers = {
        'ENTER': this.handler,
      };
    });

    context('and no value has been passed to focused', () => {
      beforeEach(function () {
        this.wrapper = mount(
          <HotKeys keyMap={this.keyMap}>
            <div >
              <HotKeys handlers={this.handlers}>
                <input className={'handlerChildElement'}/>
              </HotKeys>
            </div>
          </HotKeys>
        );

        this.input = new FocusableElement(this.wrapper, '.handlerChildElement');
      });

      it('then DOES NOT call the handler when a key is pressed that matches the keyMap', function() {
        this.input.keyDown(KeyCode.ENTER);

        expect(this.handler).to.not.have.been.called;
      });
    });

    context('and focused has been set to true on the component that defines the keyMap', () => {
      beforeEach(function () {
        this.wrapper = mount(
          <HotKeys keyMap={this.keyMap} focused>
            <div >
              <HotKeys handlers={this.handlers}>
                <input className={'handlerChildElement'}/>
              </HotKeys>
            </div>
          </HotKeys>
        );

        this.input = new FocusableElement(this.wrapper, '.handlerChildElement');
      });

      it('then DOES NOT call the handler when a key is pressed that matches the keyMap', function() {
        this.input.keyDown(KeyCode.ENTER);

        expect(this.handler).to.not.have.been.called;
      });
    });

    context('and focused has been set to true on the component that defines the handlers', () => {
      beforeEach(function () {
        this.wrapper = mount(
          <HotKeys keyMap={this.keyMap}>
            <div >
              <HotKeys handlers={this.handlers} focused>
                <input className={'handlerChildElement'}/>
              </HotKeys>
            </div>
          </HotKeys>
        );

        this.input = new FocusableElement(this.wrapper, '.handlerChildElement');
      });

      it('then calls the handler when a key is pressed that matches the keyMap', function() {
        this.input.keyDown(KeyCode.ENTER);

        expect(this.handler).to.have.been.called;
      });
    });
  });

  context('when HotKey components defining handlers are nested inside each other', () => {

    beforeEach(function () {
      this.outerEnterHandler = sinon.spy();
      this.outerTabHandler = sinon.spy();
      this.innerEnterHandler = sinon.spy();

      this.outerHandlers = {
        'ENTER': this.outerEnterHandler,
        'TAB': this.outerTabHandler,
      };

      this.innerHandlers = {
        'ENTER': this.innerEnterHandler,
      };
    });

    context('and the inner component has a focused prop of true', () => {
      beforeEach(function () {
        this.wrapper = mount(
          <HotKeys keyMap={this.keyMap}>
            <div >
              <HotKeys handlers={this.outerHandlers}>
                <input className={'outerElement'}/>

                <HotKeys handlers={this.innerHandlers} focused>
                  <input className={'innerElement'}/>
                </HotKeys>
              </HotKeys>
            </div>
          </HotKeys>
        );

        this.input = new FocusableElement(this.wrapper, '.innerElement');
      });

      it('then only calls the handler defined in the inner component when a key is pressed for which handlers are defined in both components', function() {
        this.input.keyDown(KeyCode.ENTER);

        expect(this.innerEnterHandler).to.have.been.called;
        expect(this.outerEnterHandler).to.not.have.been.called;
      });

      it('then does NOT call the handler defined in the outer component when a key is pressed that only the outer component has a handler for', function() {
        this.input.keyDown(KeyCode.TAB);

        expect(this.outerTabHandler).to.not.have.been.called;
      });

      it('then does not call any handlers when a key that doesn\'t match any handlers is pressed', function() {
        this.input.keyDown(KeyCode.ALT);

        expect(this.innerEnterHandler).to.not.have.been.called;
        expect(this.outerTabHandler).to.not.have.been.called;
        expect(this.outerEnterHandler).to.not.have.been.called;
      });
    });

    context('and the outer component has a focused prop of true', () => {
      beforeEach(function () {
        this.wrapper = mount(
          <HotKeys keyMap={this.keyMap}>
            <div >
              <HotKeys handlers={this.outerHandlers} focused>
                <input className={'outerElement'}/>

                <HotKeys handlers={this.innerHandlers} >
                  <input className={'innerElement'}/>
                </HotKeys>
              </HotKeys>
            </div>
          </HotKeys>
        );

        this.input = new FocusableElement(this.wrapper, '.innerElement');
      });

      it('then only calls the handler defined in the outer component when a key is pressed for which handlers are defined in both components', function() {
        this.input.keyDown(KeyCode.ENTER);

        expect(this.innerEnterHandler).to.not.have.been.called;
        expect(this.outerEnterHandler).to.have.been.called;
      });

      it('then calls the handler defined in the outer component when a key is pressed that only the outer component has a handler for', function() {
        this.input.keyDown(KeyCode.TAB);

        expect(this.outerTabHandler).to.have.been.called;
      });

      it('then does not call any handlers when a key that doesn\'t match any handlers is pressed', function() {
        this.input.keyDown(KeyCode.ALT);

        expect(this.innerEnterHandler).to.not.have.been.called;
        expect(this.outerTabHandler).to.not.have.been.called;
        expect(this.outerEnterHandler).to.not.have.been.called;
      });
    });

    context('and both components have a focused prop of true', () => {
      beforeEach(function () {
        this.wrapper = mount(
          <HotKeys keyMap={this.keyMap}>
            <div >
              <HotKeys handlers={this.outerHandlers} focused>
                <input className={'outerElement'}/>

                <HotKeys handlers={this.innerHandlers} focused>
                  <input className={'innerElement'}/>
                </HotKeys>
              </HotKeys>
            </div>
          </HotKeys>
        );

        this.input = new FocusableElement(this.wrapper, '.innerElement');
      });

      it('then only calls the handler defined in the inner component when a key is pressed for which handlers are defined in both components', function() {
        this.input.keyDown(KeyCode.ENTER);

        expect(this.innerEnterHandler).to.have.been.called;
        expect(this.outerEnterHandler).to.not.have.been.called;
      });

      it('then calls the handler defined in the outer component when a key is pressed that only the outer component has a handler for', function() {
        this.input.keyDown(KeyCode.TAB);

        expect(this.outerTabHandler).to.have.been.called;
      });

      it('then does not call any handlers when a key that doesn\'t match any handlers is pressed', function() {
        this.input.keyDown(KeyCode.ALT);

        expect(this.innerEnterHandler).to.not.have.been.called;
        expect(this.outerTabHandler).to.not.have.been.called;
        expect(this.outerEnterHandler).to.not.have.been.called;
      });
    });
  });

  context('when HotKeys components are siblings', () => {
    context('and both components have a focused prop of true', () => {
      beforeEach(function () {
        this.firstEnterHandler = sinon.spy();
        this.firstTabHandler = sinon.spy();
        this.secondEnterHandler = sinon.spy();

        this.firstHandlers = {
          'ENTER': this.firstEnterHandler,
          'TAB': this.firstTabHandler,
        };

        this.secondHandlers = {
          'ENTER': this.secondEnterHandler,
        };

        this.wrapper = mount(
          <HotKeys keyMap={this.keyMap}>
            <div >
              <HotKeys handlers={this.firstHandlers} focused>
                <input className={'firstElement'}/>
              </HotKeys>

              <HotKeys handlers={this.secondHandlers} focused>
                <input className={'secondElement'}/>
              </HotKeys>
            </div>
          </HotKeys>
        );

        this.input = new FocusableElement(this.wrapper, '.firstElement');
      });

      context('and the focus is on a child of the first component', () => {
        it('then only calls the handlers on the first component when a key is pressed for which handlers are defined in both components', function() {
          this.input.keyDown(KeyCode.ENTER);

          expect(this.firstEnterHandler).to.have.been.called;
          expect(this.secondEnterHandler).to.not.have.been.called;
        });

        it('then calls the handler defined in the first component when a key is pressed that only the first component has a handler for', function() {
          this.input.keyDown(KeyCode.TAB);

          expect(this.firstTabHandler).to.have.been.called;
        });

        it('then does not call any handlers when a key that doesn\'t match any handlers is pressed', function() {
          this.input.keyDown(KeyCode.ALT);

          expect(this.secondEnterHandler).to.not.have.been.called;
          expect(this.firstTabHandler).to.not.have.been.called;
          expect(this.firstEnterHandler).to.not.have.been.called;
        });
      });
    });
  });
});
