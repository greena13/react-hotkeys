import React from 'react';
import {mount} from 'enzyme';
import {expect} from 'chai';
import sinon from 'sinon';

import {HotKeys} from '../../src/';

import KeyCode from '../support/Key';
import FocusableElement from '../support/FocusableElement';

describe('Hard sequence handlers:', () => {
  beforeEach(function () {
    this.hardSequenceHandler = sinon.spy();

    this.handlers = {
      'enter': this.hardSequenceHandler,
    };
  });

  describe('when the key sequence has not been associated with an action', () => {
    beforeEach(function () {
      this.wrapper = mount(
        <div >
          <HotKeys handlers={this.handlers}>
            <div className="childElement" />
          </HotKeys>

          <div className="siblingElement" />
        </div>
      );

      this.targetElement = new FocusableElement(this.wrapper, '.childElement');
      this.targetElement.focus();
    });

    it('then calls the hard sequence handler when key sequence is pressed', function() {
      this.targetElement.keyDown(KeyCode.ENTER);

      expect(this.hardSequenceHandler).to.have.been.called;
    });
  });

  describe('when the key sequence has been associated with an action in the same HotKeys component', () => {
    beforeEach(function () {
      this.wrapper = mount(
        <div >
          <HotKeys actions={{ 'ENTER': 'enter' }} handlers={this.handlers}>
            <div className="childElement" />
          </HotKeys>

          <div className="siblingElement" />
        </div>
      );

      this.targetElement = new FocusableElement(this.wrapper, '.childElement');
      this.targetElement.focus();
    });

    it('then calls the hard sequence handler when key sequence is pressed', function() {
      this.targetElement.keyDown(KeyCode.ENTER);

      expect(this.hardSequenceHandler).to.have.been.called;
    });
  });

  describe('when the key sequence has been associated with an action in a parent HotKeys component', () => {
    beforeEach(function () {
      this.wrapper = mount(
        <div >

          <HotKeys actions={{ 'ENTER': 'enter' }} >
            <HotKeys handlers={this.handlers}>
              <div className="childElement" />
            </HotKeys>
          </HotKeys>

          <div className="siblingElement" />
        </div>
      );

      this.targetElement = new FocusableElement(this.wrapper, '.childElement');
      this.targetElement.focus();
    });

    it('then calls the hard sequence handler when key sequence is pressed', function() {
      this.targetElement.keyDown(KeyCode.ENTER);

      expect(this.hardSequenceHandler).to.have.been.called;
    });
  });

  describe('when the key sequence has been associated with an action and has a handler in the same HotKeys component', () => {
    beforeEach(function () {
      this.otherHandler = sinon.spy();

      this.wrapper = mount(
        <HotKeys actions={{ 'ACTION': 'enter' }} handlers={{ 'ACTION': this.otherHandler, ...this.handlers }}>
          <div className="childElement" />
        </HotKeys>
      );

      this.targetElement = new FocusableElement(this.wrapper, '.childElement');
      this.targetElement.focus();
    });

    it('then calls the hard sequence handler when key sequence is pressed', function() {
      this.targetElement.keyDown(KeyCode.ENTER);

      expect(this.hardSequenceHandler).to.have.been.called;
      expect(this.otherHandler).to.not.have.been.called;
    });
  });

  describe('when the key sequence has been associated with an action and has a handler in a parent HotKeys component', () => {
    beforeEach(function () {
      this.otherHandler = sinon.spy();

      this.wrapper = mount(
        <div >
          <HotKeys actions={{ 'ENTER': 'enter' }} handlers={{ 'ENTER': this.otherHandler }}>
            <HotKeys handlers={ this.handlers }>
              <div className="childElement" />
            </HotKeys>
          </HotKeys>

          <div className="siblingElement" />
        </div>
      );

      this.targetElement = new FocusableElement(this.wrapper, '.childElement');
      this.targetElement.focus();
    });

    it('then calls the hard sequence handler when key sequence is pressed', function() {
      this.targetElement.keyDown(KeyCode.ENTER);

      expect(this.hardSequenceHandler).to.have.been.called;
      expect(this.otherHandler).to.not.have.been.called;
    });
  });

  describe('when the hard key sequence handler has been defined in a parent HotKeys component', () => {
    beforeEach(function () {
      this.outerHardSequenceHandler = sinon.spy();

      this.wrapper = mount(
        <div >
          <HotKeys handlers={{ 'enter': this.outerHardSequenceHandler }}>
            <HotKeys handlers={ this.handlers }>
              <div className="childElement" />
            </HotKeys>
          </HotKeys>

          <div className="siblingElement" />
        </div>
      );

      this.targetElement = new FocusableElement(this.wrapper, '.childElement');
      this.targetElement.focus();
    });

    it('then calls the hard sequence handler in the child component', function() {
      this.targetElement.keyDown(KeyCode.ENTER);

      expect(this.hardSequenceHandler).to.have.been.called;
      expect(this.outerHardSequenceHandler).to.not.have.been.called;
    });
  });
});
