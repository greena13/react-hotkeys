import React from 'react';
import {mount} from 'enzyme';
import {expect} from 'chai';
import sinon from 'sinon';

import FocusableElement from '../../support/FocusableElement';
import KeyEventManager from '../../../src/lib/KeyEventManager';
import KeyCode from '../../support/Key';

import {HotKeys} from '../../../src/';

describe('HotKeys root prop:', function () {
  describe('when a HotKeys component has a root prop value of true', function () {
    beforeEach(function () {
      this.keyMap = {
        'NEXT': 'a',
      };

      this.nextHandler = sinon.spy();

      const handlers = {
        'NEXT': () => {
          this.secondElement.focus();

          this.nextHandler();
        }
      };

      this.wrapper = mount(
        <HotKeys root>
          <HotKeys keyMap={this.keyMap} handlers={handlers}>
            <div className='firstChildElement' />
          </HotKeys>

          <div className='secondChildElement' />
        </HotKeys>
      );

      this.firstElement = new FocusableElement(this.wrapper, '.firstChildElement');
      this.secondElement = new FocusableElement(this.wrapper, '.secondChildElement');

      this.firstElement.focus();

      expect(this.firstElement.isFocused()).to.equal(true);
    });

    describe('and nested HotKeys component has a handler that changes focus to another element bound to keydown', function () {
      it('then the root HotKeys still records the keyup event', function() {
        this.firstElement.keyDown(KeyCode.A);

        expect(this.nextHandler).to.have.been.calledOnce;

        expect(this.secondElement.isFocused()).to.equal(true);

        this.secondElement.keyPress(KeyCode.A);
        this.secondElement.keyUp(KeyCode.A);

        expect(KeyEventManager.getInstance()._focusOnlyEventStrategy.keyCombinationHistory).to.eql([
          {
            'keys': {
              'a': [
                [true, true, false],
                [true, true, true]
              ]
            },
            'ids': ['a'],
            'keyAliases': {}
          }
        ]);
      });
    });
  });
});
