import React from 'react';
import {mount} from 'enzyme';
import {expect} from 'chai';
import sinon from 'sinon';

import {HotKeys} from '../../src/';
import FocusableElement from '../support/FocusableElement';

describe('Passing props to HotKeys:', () => {
  context('when an onFocus function is passed to HotKeys', () => {
    beforeEach(function () {
      this.onFocus = sinon.spy();

      this.wrapper = mount(
        <HotKeys onFocus={this.onFocus}>
          <div className="childElement" />
        </HotKeys>
      );

      this.targetElement = new FocusableElement(this.wrapper, '.childElement');
    });

    it('then calls the function when the component is focused', function() {
      this.targetElement.focus();
      expect(this.onFocus).to.have.been.calledOnce;
    });
  });

  context('when an onBlur function is passed to HotKeys', () => {
    beforeEach(function () {
      this.onBlur = sinon.spy();

      this.wrapper = mount(
        <HotKeys onBlur={this.onBlur}>
          <div className="childElement" />
        </HotKeys>
      );

      this.targetElement = new FocusableElement(this.wrapper, '.childElement');
    });

    it('then calls the function when the component is blurred', function() {
      this.targetElement.focus();
      expect(this.onBlur).to.not.have.been.called;

      this.targetElement.blur();
      expect(this.onBlur).to.have.been.calledOnce;
    });
  });
});
