import React from 'react';
import ReactDOM from 'react-dom';
import {mount} from 'enzyme';
import {expect} from 'chai';
import sinon from 'sinon';

import HotKeys from '../../lib/HotKeys';
import KeyCode from '../support/KeyCode';
import FocusableElement from '../support/FocusableElement';

describe('Activating hotkeys by Using Focused Function without FocusTrap', function() {
  
  before(function () {
    

    this.keyMap = {
      'ENTER': 'enter',
      'TAB': 'tab',
    };
  });

  context('when a keyMap and a handler are provided to the same component', function() {
    beforeEach(function () {
      this.handler = sinon.spy();

      const handlers = {
        'ENTER': this.handler,
      };

      this.isFocused = () => {
        return document.activeElement === this.input.getInstance();
      }

      this.wrapper = mount(
        <div >
          <HotKeys 
            useFocusTrap={false}
            keyMap={this.keyMap}
            handlers={handlers}
            focused={this.isFocused}
          >
            <input className="childElement" />
          </HotKeys>

          <input className="siblingElement" />
        </div>
        );

        this.input = new FocusableElement(this.wrapper, '.childElement');
    });

    it('then renders children without any wrapping divs', function() {
      let html = this.wrapper.html();
      expect(html).to.equal('<div><input class="childElement"><input class="siblingElement"></div>');
    });

    context('and a child element is focused', function() {
      beforeEach(function () {
        this.input = new FocusableElement(this.wrapper, '.childElement');
        this.input.getInstance().focus();
      });

      it('then calls the correct handler when a key is pressed that matches the keyMap', function() {
        this.input.keyDown(KeyCode.ENTER);

        expect(this.handler).to.have.been.called;
      });

      it('then does NOT call the handler when a key is pressed that does NOT matches the keyMap', function() {
        this.input.keyDown(KeyCode.TAB);

        expect(this.handler).to.not.have.been.called;
      });
    });

    context('and a sibling element is focused', function() {
      beforeEach(function () {
        this.input = new FocusableElement(this.wrapper, '.siblingElement');
        this.input.focus();
      });

      it('then does NOT calls the handler when a key is pressed that matches the keyMap', function() {
        this.input.keyDown(KeyCode.ENTER);

        expect(this.handler).to.not.have.been.called;
      });
    });
  });

  context('when a keyMap is provided to a parent component and a handler to a child component', function() {

    beforeEach(function () {

      this.handlerIsFocused = () => {
        return document.activeElement === this.input.getInstance();
      }

      this.handler = sinon.spy();

      const handlers = {
        'ENTER': this.handler,
      };

      this.wrapper = mount(
        <div >
          <HotKeys keyMap={this.keyMap}>
            <div >
              <HotKeys useFocusTrap={false} handlers={handlers} focused={this.handlerIsFocused}>
                <input className={'handlerChildElement'}/>
              </HotKeys>
            </div>
            <input className={'keyMapChildElement'}/>
          </HotKeys>

          <input className={'siblingElement'}/>
        </div>
        );

        this.input = new FocusableElement(this.wrapper, '.handlerChildElement');
    });

    context('and a child element of the component defining the handlers is focused', function() {
      beforeEach(function () {
        this.input.getInstance().focus();
      });

      it('renders the handlerChild input without a wrapper', function() {
        let html = this.wrapper.html();
        expect(html).to.equal('<div><div tabindex="-1"><div><input class="handlerChildElement"></div><input class="keyMapChildElement"></div><input class="siblingElement"></div>');
      });

      it('then calls the correct handler when a key is pressed that matches the keyMap', function() {
        this.input.keyDown(KeyCode.ENTER);

        expect(this.handler).to.have.been.called;
      });

      it('then does NOT call the handler when a key is pressed that does NOT matches the keyMap', function() {
        this.input.keyDown(KeyCode.TAB);

        expect(this.handler).to.not.have.been.called;
      });
    });

    context('and a child element of the component defining the keyMap is focused', function() {
      beforeEach(function () {
        this.input = new FocusableElement(this.wrapper, '.keyMapChildElement');
        this.input.focus();
      });

      it('then does NOT call the handler when a key is pressed that matches the keyMap', function() {
        this.input.keyDown(KeyCode.ENTER);

        expect(this.handler).to.not.have.been.called;
      });
    });

    context('and a sibling element is focused', function() {
      beforeEach(function () {
        this.input = new FocusableElement(this.wrapper, '.siblingElement');
        this.input.focus();
      });

      it('then does NOT calls the handler when a key is pressed that matches the keyMap', function() {
        this.input.keyDown(KeyCode.ENTER);

        expect(this.handler).to.not.have.been.called;
      });
    });
  });

  context('when HotKey components defining handlers are nested inside each other', function() {

    beforeEach(function () {
      this.outerEnterHandler = sinon.spy();
      this.outerTabHandler = sinon.spy();
      this.innerEnterHandler = sinon.spy();

      this.focusedInner = () => {
        return document.activeElement === this.innerElement.getInstance();
      }
    
      this.focusedOuter = () => {
        return this.outerContainer.contains(document.activeElement);
      }

      this.outerHandlers = {
        'ENTER': this.outerEnterHandler,
        'TAB': this.outerTabHandler,
      };

      this.innerHandlers = {
        'ENTER': this.innerEnterHandler,
      };

      this.wrapper = mount(
        <HotKeys keyMap={this.keyMap}>
          <div >
            <HotKeys useFocusTrap={false} handlers={this.outerHandlers} focused={this.focusedOuter}>
            <div className="myOwnWrapper">
              <input className={'outerElement'}/>

              <HotKeys useFocusTrap={false} handlers={this.innerHandlers} focused={this.focusedInner}>
                <input className={'innerElement'}/>
              </HotKeys>
              </div>
            </HotKeys>
          </div>
        </HotKeys>
      );

      this.innerElement = new FocusableElement(this.wrapper, '.innerElement');
      this.outerContainer = ReactDOM.findDOMNode(this.wrapper.find('.myOwnWrapper').instance());
    });

    context('and a child element of the inner component is in focus', function() {
      beforeEach(function () {
        
        this.input = new FocusableElement(this.wrapper, '.innerElement');
        this.input.getInstance().focus();
      });

      it('renders the innerElement and outerElement without a wrapper', function() {
        let html = this.wrapper.html();
        expect(html).to.equal('<div tabindex="-1"><div><div class="myOwnWrapper"><input class="outerElement"><input class="innerElement"></div></div></div>');
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

    context('and a child element of the outer component is in focus', function() {
      beforeEach(function () {
        this.input = new FocusableElement(this.wrapper, '.outerElement');
        this.input.getInstance().focus();
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
  });
});
