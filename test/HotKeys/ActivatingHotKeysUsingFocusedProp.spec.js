import React from 'react';
import {mount} from 'enzyme';
import {expect} from 'chai';
import sinon from 'sinon';

import HotKeys from '../../lib/HotKeys';
import KeyCode from '../support/Key';
import FocusableElement from '../support/FocusableElement';

xdescribe('Activating hotkeys using focused prop:', () => {
  before(function () {
    this.keyMap = {
      'ACTION1': 'a',
      'ACTION2': 'b',
    };
  });

  context('when a keyMap and a handler are provided to the same component and a child element is NOT focused', () => {

    beforeEach(function () {
      this.handler = sinon.spy();

      this.handlers = {
        'ACTION1': this.handler,
      };
    });

    context('and no value has been passed to focused', () => {
      beforeEach(function () {
        this.wrapper = mount(
          <HotKeys keyMap={this.keyMap} handlers={this.handlers}>
            <div className="childElement" />
          </HotKeys>
        );

        this.targetElement = new FocusableElement(this.wrapper, '.childElement');
      });

      it('then DOES NOT call the handler when a key is pressed that matches the keyMap', function() {
        this.targetElement.keyPress(KeyCode.A);

        expect(this.handler).to.not.have.been.called;
      });
    });

    context('and focused has been set to true', () => {
      beforeEach(function () {
        this.wrapper = mount(
          <HotKeys keyMap={this.keyMap} handlers={this.handlers} focused>
            <div className="childElement" />
          </HotKeys>
        );

        this.targetElement = new FocusableElement(this.wrapper, '.childElement');
      });

      it('then calls the correct handler when a key is pressed that matches the keyMap', function() {
        this.targetElement.keyPress(KeyCode.A);

        expect(this.handler).to.have.been.called;
      });
    });
  });

  context('when a keyMap is provided to a parent component and a handler to a child component', () => {

    beforeEach(function () {
      this.handler = sinon.spy();

      this.handlers = {
        'ACTION1': this.handler,
      };
    });

    context('and no value has been passed to focused', () => {
      beforeEach(function () {
        this.wrapper = mount(
          <HotKeys keyMap={this.keyMap}>
            <div >
              <HotKeys handlers={this.handlers}>
                <div className={'handlerChildElement'}/>
              </HotKeys>
            </div>
          </HotKeys>
        );

        this.targetElement = new FocusableElement(this.wrapper, '.handlerChildElement');
      });

      it('then DOES NOT call the handler when a key is pressed that matches the keyMap', function() {
        this.targetElement.keyPress(KeyCode.A);

        expect(this.handler).to.not.have.been.called;
      });
    });

    context('and focused has been set to true on the component that defines the keyMap', () => {
      beforeEach(function () {
        this.wrapper = mount(
          <HotKeys keyMap={this.keyMap} focused>
            <div >
              <HotKeys handlers={this.handlers}>
                <div className={'handlerChildElement'}/>
              </HotKeys>
            </div>
          </HotKeys>
        );

        this.targetElement = new FocusableElement(this.wrapper, '.handlerChildElement');
      });

      it('then DOES NOT call the handler when a key is pressed that matches the keyMap', function() {
        this.targetElement.keyPress(KeyCode.A);

        expect(this.handler).to.not.have.been.called;
      });
    });

    context('and focused has been set to true on the component that defines the handlers', () => {
      beforeEach(function () {
        this.wrapper = mount(
          <HotKeys keyMap={this.keyMap}>
            <div >
              <HotKeys handlers={this.handlers} focused>
                <div className={'handlerChildElement'}/>
              </HotKeys>
            </div>
          </HotKeys>
        );

        this.targetElement = new FocusableElement(this.wrapper, '.handlerChildElement');
      });

      it('then calls the handler when a key is pressed that matches the keyMap', function() {
        this.targetElement.keyPress(KeyCode.A);

        expect(this.handler).to.have.been.called;
      });
    });
  });

  context('when HotKey components defining handlers are nested inside each other', () => {

    beforeEach(function () {
      this.outerAction1Handler = sinon.spy();
      this.outerAction2Handler = sinon.spy();
      this.innerAction1Handler = sinon.spy();

      this.outerHandlers = {
        'ACTION1': this.outerAction1Handler,
        'ACTION2': this.outerAction2Handler,
      };

      this.innerHandlers = {
        'ACTION1': this.innerAction1Handler,
      };
    });

    context('and the inner component has a focused prop of true', () => {
      beforeEach(function () {
        this.wrapper = mount(
          <HotKeys keyMap={this.keyMap}>
            <div >
              <HotKeys handlers={this.outerHandlers}>
                <div className={'outerElement'}/>

                <HotKeys handlers={this.innerHandlers} focused>
                  <div className={'innerElement'}/>
                </HotKeys>
              </HotKeys>
            </div>
          </HotKeys>
        );

        this.targetElement = new FocusableElement(this.wrapper, '.innerElement');
      });

      it('then only calls the handler defined in the inner component when a key is pressed for which handlers are defined in both components', function() {
        this.targetElement.keyPress(KeyCode.A);

        expect(this.innerAction1Handler).to.have.been.called;
        expect(this.outerAction1Handler).to.not.have.been.called;
      });

      it('then does NOT call the handler defined in the outer component when a key is pressed that only the outer component has a handler for', function() {
        this.targetElement.keyPress(KeyCode.B);

        expect(this.outerAction2Handler).to.not.have.been.called;
      });

      it('then does not call any handlers when a key that doesn\'t match any handlers is pressed', function() {
        this.targetElement.keyPress(KeyCode.C);

        expect(this.innerAction1Handler).to.not.have.been.called;
        expect(this.outerAction2Handler).to.not.have.been.called;
        expect(this.outerAction1Handler).to.not.have.been.called;
      });
    });

    context('and the outer component has a focused prop of true', () => {
      beforeEach(function () {
        this.wrapper = mount(
          <HotKeys keyMap={this.keyMap}>
            <div >
              <HotKeys handlers={this.outerHandlers} focused>
                <div className={'outerElement'}/>

                <HotKeys handlers={this.innerHandlers} >
                  <div className={'innerElement'}/>
                </HotKeys>
              </HotKeys>
            </div>
          </HotKeys>
        );

        this.targetElement = new FocusableElement(this.wrapper, '.innerElement');
      });

      it('then only calls the handler defined in the outer component when a key is pressed for which handlers are defined in both components', function() {
        this.targetElement.keyPress(KeyCode.A);

        expect(this.innerAction1Handler).to.not.have.been.called;
        expect(this.outerAction1Handler).to.have.been.called;
      });

      it('then calls the handler defined in the outer component when a key is pressed that only the outer component has a handler for', function() {
        this.targetElement.keyPress(KeyCode.B);

        expect(this.outerAction2Handler).to.have.been.called;
      });

      it('then does not call any handlers when a key that doesn\'t match any handlers is pressed', function() {
        this.targetElement.keyPress(KeyCode.C);

        expect(this.innerAction1Handler).to.not.have.been.called;
        expect(this.outerAction2Handler).to.not.have.been.called;
        expect(this.outerAction1Handler).to.not.have.been.called;
      });
    });

    context('and both components have a focused prop of true', () => {
      beforeEach(function () {
        this.wrapper = mount(
          <HotKeys keyMap={this.keyMap}>
            <div >
              <HotKeys handlers={this.outerHandlers} focused>
                <div className={'outerElement'}/>

                <HotKeys handlers={this.innerHandlers} focused>
                  <div className={'innerElement'}/>
                </HotKeys>
              </HotKeys>
            </div>
          </HotKeys>
        );

        this.targetElement = new FocusableElement(this.wrapper, '.innerElement');
      });

      it('then only calls the handler defined in the inner component when a key is pressed for which handlers are defined in both components', function() {
        this.targetElement.keyPress(KeyCode.A);

        expect(this.innerAction1Handler).to.have.been.called;
        expect(this.outerAction1Handler).to.not.have.been.called;
      });

      it('then calls the handler defined in the outer component when a key is pressed that only the outer component has a handler for', function() {
        this.targetElement.keyPress(KeyCode.B);

        expect(this.outerAction2Handler).to.have.been.called;
      });

      it('then does not call any handlers when a key that doesn\'t match any handlers is pressed', function() {
        this.targetElement.keyPress(KeyCode.C);

        expect(this.innerAction1Handler).to.not.have.been.called;
        expect(this.outerAction2Handler).to.not.have.been.called;
        expect(this.outerAction1Handler).to.not.have.been.called;
      });
    });
  });

  context('when HotKeys components are siblings', () => {
    context('and both components have a focused prop of true', () => {
      beforeEach(function () {
        this.firstAction1Handler = sinon.spy();
        this.firstAction2Handler = sinon.spy();
        this.secondAction1Handler = sinon.spy();

        this.firstHandlers = {
          'ACTION1': this.firstAction1Handler,
          'ACTION2': this.firstAction2Handler,
        };

        this.secondHandlers = {
          'ACTION1': this.secondAction1Handler,
        };

        this.wrapper = mount(
          <HotKeys keyMap={this.keyMap}>
            <div >
              <HotKeys handlers={this.firstHandlers} focused>
                <div className={'firstElement'}/>
              </HotKeys>

              <HotKeys handlers={this.secondHandlers} focused>
                <div className={'secondElement'}/>
              </HotKeys>
            </div>
          </HotKeys>
        );

        this.targetElement = new FocusableElement(this.wrapper, '.firstElement');
      });

      context('and the focus is on a child of the first component', () => {
        it('then only calls the handlers on the first component when a key is pressed for which handlers are defined in both components', function() {
          this.targetElement.keyPress(KeyCode.A);

          expect(this.firstAction1Handler).to.have.been.called;
          expect(this.secondAction1Handler).to.not.have.been.called;
        });

        it('then calls the handler defined in the first component when a key is pressed that only the first component has a handler for', function() {
          this.targetElement.keyPress(KeyCode.B);

          expect(this.firstAction2Handler).to.have.been.called;
        });

        it('then does not call any handlers when a key that doesn\'t match any handlers is pressed', function() {
          this.targetElement.keyPress(KeyCode.C);

          expect(this.secondAction1Handler).to.not.have.been.called;
          expect(this.firstAction2Handler).to.not.have.been.called;
          expect(this.firstAction1Handler).to.not.have.been.called;
        });
      });
    });
  });
});
