import React from 'react';
import {mount} from 'enzyme';
import {expect} from 'chai';
import sinon from 'sinon';

import FocusableElement from '../../support/FocusableElement';
import KeyCode from '../../support/Key';

import {HotKeys} from '../../../src/';

describe('Handlers that change focus:', function () {
  describe('when there are handlers that change focus', function () {
    beforeEach(function () {
      this.keyMap = {
        'NEXT': 'a',
        'PREVIOUS': 'b',
      };

      this.nextHandler = sinon.spy();
      this.previousHandler = sinon.spy();

      const handlers = {
        'NEXT': () => {
          this.secondElement.focus();

          this.nextHandler();
        },
        'PREVIOUS': () => {
          this.firstElement.focus();

          this.previousHandler();
        },
      };

      this.wrapper = mount(
        <HotKeys keyMap={this.keyMap} handlers={handlers}>
          <div className='firstChildElement' />
          <div className='secondChildElement' />
        </HotKeys>
      );

      this.firstElement = new FocusableElement(this.wrapper, '.firstChildElement');
      this.secondElement = new FocusableElement(this.wrapper, '.secondChildElement');

      this.firstElement.focus();

      expect(this.firstElement.isFocused()).to.equal(true);
    });

    describe('and the key to change focus is pressed', function () {
      it('then focus is correctly managed', function() {
        this.firstElement.keyDown(KeyCode.A);
        this.firstElement.keyPress(KeyCode.A);
        this.firstElement.keyUp(KeyCode.A);

        expect(this.nextHandler).to.have.been.calledOnce;
        expect(this.previousHandler).to.not.have.been.called;

        expect(this.secondElement.isFocused()).to.equal(true);

        this.firstElement.keyDown(KeyCode.B);
        this.firstElement.keyPress(KeyCode.B);
        this.firstElement.keyUp(KeyCode.B);

        expect(this.nextHandler).to.have.been.calledOnce;
        expect(this.previousHandler).to.have.been.calledOnce;

        expect(this.firstElement.isFocused()).to.equal(true);
      });
    });
  });
});
