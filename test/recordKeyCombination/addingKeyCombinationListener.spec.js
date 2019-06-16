import React from 'react';
import {mount} from 'enzyme';
import {expect} from 'chai';
import sinon from 'sinon';
import simulant from 'simulant';

import {HotKeys, GlobalHotKeys,recordKeyCombination} from '../../src/';
import KeyCode from '../support/Key';
import FocusableElement from '../support/FocusableElement';

describe('Adding key combination listener:', () => {
  context('when only a HotKeys component is mounted', () => {
    context('without any keyMap or handlers', () => {
      beforeEach(function () {
        this.reactDiv = document.createElement('div');
        document.body.appendChild(this.reactDiv);

        this.wrapper = mount(
          <HotKeys>
            <div className="childElement" />
          </HotKeys>,
          { attachTo: this.reactDiv }
        );
      });

      afterEach(function() {
        document.body.removeChild(this.reactDiv);
      });

      it('calls the combination listener', function() {
        const callback = sinon.spy();
        recordKeyCombination(callback);

        simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.A });
        simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.A });

        expect(callback).to.not.have.been.called;

        simulant.fire(this.reactDiv, 'keyup', { key: KeyCode.A });

        expect(callback).to.have.been.calledOnce;

        expect(callback).to.have.been.calledWithMatch({
          keys: { a: true },
          id: 'a'
        });
      });
    });

    context('with a keyMap', () => {
      beforeEach(function () {
        this.keyMap = {
          'ACTION1': 'a'
        };

        this.handler = sinon.spy();

        this.handlers = {
          'ACTION1': this.handler,
        };

        this.reactDiv = document.createElement('div');
        document.body.appendChild(this.reactDiv);

        this.wrapper = mount(
          <HotKeys keyMap={this.keyMap} handlers={this.handlers}>
            <div className="childElement" />
          </HotKeys>,
          { attachTo: this.reactDiv }
        );

        this.firstElement = new FocusableElement(this.wrapper, '.childElement');
        this.firstElement.focus();
      });

      afterEach(function() {
        document.body.removeChild(this.reactDiv);
      });

      it('then calls the combination listener after any matching handlers', function() {
        const callback = sinon.spy();
        recordKeyCombination(callback);

        this.firstElement.keyDown(KeyCode.A);
        simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.A });

        this.firstElement.keyPress(KeyCode.A);
        simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.A });

        this.firstElement.keyUp(KeyCode.A);
        simulant.fire(this.reactDiv, 'keyup', { key: KeyCode.A });

        expect(this.handler).to.have.been.calledOnce;
        expect(callback).to.have.been.calledOnce;

        expect(callback).to.have.been.calledAfter(this.handler);
      });
    });
  });

  context('when only a GlobalHotKeys component is mounted', () => {
    context('without any keyMap or handlers', () => {
      beforeEach(function () {
        this.reactDiv = document.createElement('div');
        document.body.appendChild(this.reactDiv);

        this.wrapper = mount(
          <GlobalHotKeys>
            <div className="childElement" />
          </GlobalHotKeys>,
          { attachTo: this.reactDiv }
        );
      });

      afterEach(function() {
        document.body.removeChild(this.reactDiv);
      });

      it('then calls the combination listener', function() {
        const callback = sinon.spy();
        recordKeyCombination(callback);

        simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.A });
        simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.A });

        expect(callback).to.not.have.been.called;

        simulant.fire(this.reactDiv, 'keyup', { key: KeyCode.A });

        expect(callback).to.have.been.calledOnce;

        expect(callback).to.have.been.calledWithMatch({
          keys: { a: true },
          id: 'a'
        });
      });
    });

    context('with a keyMap', () => {
      beforeEach(function () {
        this.keyMap = {
          'ACTION1': 'a'
        };

        this.handler = sinon.spy();

        this.handlers = {
          'ACTION1': this.handler,
        };

        this.reactDiv = document.createElement('div');
        document.body.appendChild(this.reactDiv);

        this.wrapper = mount(
          <GlobalHotKeys keyMap={this.keyMap} handlers={this.handlers}>
            <div className="childElement" />
          </GlobalHotKeys>,
          { attachTo: this.reactDiv }
        );
      });

      afterEach(function() {
        document.body.removeChild(this.reactDiv);
      });

      it('then calls the combination listener after any matching handlers', function() {
        const callback = sinon.spy();
        recordKeyCombination(callback);

        simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.A });
        simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.A });
        simulant.fire(this.reactDiv, 'keyup', { key: KeyCode.A });

        expect(this.handler).to.have.been.calledOnce;
        expect(callback).to.have.been.calledOnce;

        expect(callback).to.have.been.calledAfter(this.handler);
      });
    });
  });

  context('when the cancel function is called', () => {
    beforeEach(function () {
      this.reactDiv = document.createElement('div');
      document.body.appendChild(this.reactDiv);

      this.wrapper = mount(
        <HotKeys>
          <div className="childElement" />
        </HotKeys>,
        { attachTo: this.reactDiv }
      );

      this.callback = sinon.spy();
      const cancel = recordKeyCombination(this.callback);

      cancel();
    });

    afterEach(function() {
      document.body.removeChild(this.reactDiv);
    });

    it('then doesn\'t call the key combination listener', function() {
      simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.A });
      simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.A });
      simulant.fire(this.reactDiv, 'keyup', { key: KeyCode.A });

      expect(this.callback).to.not.have.been.called;
    });
  });

  context('when the listener has already been called', () => {
    beforeEach(function () {
      this.reactDiv = document.createElement('div');
      document.body.appendChild(this.reactDiv);

      this.wrapper = mount(
        <HotKeys>
          <div className="childElement" />
        </HotKeys>,
        { attachTo: this.reactDiv }
      );

      this.callback = sinon.spy();
      recordKeyCombination(this.callback);

      simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.A });
      simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.A });
      simulant.fire(this.reactDiv, 'keyup', { key: KeyCode.A });

      expect(this.callback).to.have.been.called;
    });

    afterEach(function() {
      document.body.removeChild(this.reactDiv);
    });

    context('and it\'s not rebound', () => {
      it('then doesn\'t call the key combination listener again', function() {
        simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.B });
        simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.B });
        simulant.fire(this.reactDiv, 'keyup', { key: KeyCode.B });

        expect(this.callback).to.have.been.calledOnce;
      });
    });

    context('and it\'s rebound', () => {
      beforeEach(function () {
        this.newCallback = sinon.spy();
        recordKeyCombination(this.newCallback);
      });

      it('then calls the new key combination listener', function() {
        simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.B });
        simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.B });
        simulant.fire(this.reactDiv, 'keyup', { key: KeyCode.B });

        expect(this.newCallback).to.have.been.calledWithMatch({
          keys: { b: true },
          id: 'b'
        });
      });
    });
  });
});
