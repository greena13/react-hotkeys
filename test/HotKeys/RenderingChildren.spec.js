import React from 'react';
import {mount} from 'enzyme';
import {expect} from 'chai';
import sinon from 'sinon';

import {HotKeys} from '../../src/';

describe('Rendering children', () => {
  before(function () {
    this.keyMap = {
      'ENTER': 'enter',
      'TAB': 'tab',
    };
  });

  context('when the component prop is not defined', () => {

    beforeEach(function () {
      this.handler = sinon.spy();

      const handlers = {
        'ENTER': this.handler,
      };

      this.wrapper = mount(
        <HotKeys keyMap={this.keyMap} handlers={handlers}>
          <div className="childElement" />
        </HotKeys>
      );

    });

    it('then renders its children wrapped in a div', function() {
      let div = this.wrapper.find('div');
      expect(div).to.containMatchingElement(<div className="childElement" />);
    });

    it('then sets a tabIndex of -1', function() {
      let div = this.wrapper.find('div').not('.childElement');
      expect(div).to.have.attr('tabindex', '-1');
    });

  });

  context('when the component prop is a string', () => {

    beforeEach(function () {
      this.handler = sinon.spy();

      const handlers = {
        'ENTER': this.handler,
      };

      this.wrapper = mount(
        <HotKeys keyMap={this.keyMap} handlers={handlers} component={'span'}>
          <div className="childElement" />
        </HotKeys>
      );

    });

    it('then renders its children wrapped in a component matching the string', function() {
      let div = this.wrapper.find('span');
      expect(div).to.containMatchingElement(<div className="childElement" />);
    });

    it('then sets a tabIndex of -1', function() {
      let div = this.wrapper.find('span');
      expect(div).to.have.attr('tabindex', '-1');
    });
  });
});
