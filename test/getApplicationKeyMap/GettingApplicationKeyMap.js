import React from 'react';
import {mount} from 'enzyme';
import {expect} from 'chai';
import sinon from 'sinon';

import {HotKeys, GlobalHotKeys} from '../../src/';
import {getApplicationKeyMap} from '../../src/';

describe('Getting the application key map:', () => {
  context('when a keydown keymap is specified as string', () => {
    beforeEach(function () {
      this.keyMap = {
        'ACTION1': 'enter'
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
    });

    it('generates the correct application key map', function() {
      expect(getApplicationKeyMap()).to.eql({
        'ACTION1': ['enter']
      })
    });
  });

  context('when a keydown keymap is specified as an object', () => {
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
    });

    it('generates the correct application key map', function() {
      expect(getApplicationKeyMap()).to.eql({
        'ACTION1': ['enter']
      })
    });
  });

  context('when component doesn\'t define any handlers', () => {
    beforeEach(function () {
      this.keyMap = {
        'ACTION1': 'enter'
      };

      this.wrapper = mount(
        <HotKeys keyMap={this.keyMap}>
          <div className="childElement" />
        </HotKeys>
      );
    });

    it('generates the correct application key map', function() {
      expect(getApplicationKeyMap()).to.eql({
        'ACTION1': ['enter']
      })
    });
  });

  context('when component doesn\'t define any keyMap', () => {
    beforeEach(function () {
      this.handler = sinon.spy();

      this.handlers = {
        'ACTION1': this.handler,
      };

      this.wrapper = mount(
        <HotKeys handlers={this.handlers}>
          <div className="childElement" />
        </HotKeys>
      );
    });

    it('generates the correct application key map', function() {
      expect(getApplicationKeyMap()).to.eql({})
    });
  });

  context('when components are nested', () => {
    beforeEach(function () {
      this.wrapper = mount(
        <HotKeys keyMap={{ 'ACTION1': 'enter' }}>
          <HotKeys keyMap={{ 'ACTION2': 'enter' }}>
          </HotKeys>
        </HotKeys>
      );
    });

    it('generates the correct application key map', function() {
      expect(getApplicationKeyMap()).to.eql({
        'ACTION1': ['enter'],
        'ACTION2': ['enter']
      })
    });
  });

  context('when components are siblings', () => {
    beforeEach(function () {
      this.wrapper = mount(
        <HotKeys keyMap={{ 'ACTION1': 'enter' }}>
          <HotKeys keyMap={{ 'ACTION2': 'enter' }} />
          <HotKeys keyMap={{ 'ACTION3': 'shift' }} />
        </HotKeys>
      );
    });

    it('generates the correct application key map', function() {
      expect(getApplicationKeyMap()).to.eql({
        'ACTION1': ['enter'],
        'ACTION2': ['enter'],
        'ACTION3': ['shift']
      })
    });
  });

  context('when there are GlobalHotkeys and HotKeys components', () => {
    beforeEach(function () {
      this.wrapper = mount(
        <GlobalHotKeys keyMap={{ 'ACTION0': 'cmd' }}>
          <HotKeys keyMap={{ 'ACTION1': 'enter' }}>
            <GlobalHotKeys keyMap={{ 'ACTION2': 'enter' }} />
            <HotKeys keyMap={{ 'ACTION3': 'shift' }} />
          </HotKeys>
        </GlobalHotKeys>
      );
    });

    it('generates the correct application key map', function() {
      expect(getApplicationKeyMap()).to.eql({
        'ACTION0': ['cmd'],
        'ACTION1': ['enter'],
        'ACTION2': ['enter'],
        'ACTION3': ['shift']
      })
    });
  });
});
