import React from 'react';
import {mount} from 'enzyme/build';
import {expect} from 'chai';
import sinon from 'sinon';
import simulant from 'simulant';

import FocusableElement from '../support/FocusableElement';
import KeyEventManager from '../../src/lib/KeyEventManager';
import KeyCode from '../support/Key';

import {HotKeys, GlobalHotKeys, configure} from '../../src';

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

      this.reactDiv = document.createElement('div');
      document.body.appendChild(this.reactDiv);

      this.wrapper = mount(
        <div>
          <GlobalHotKeys />

          <HotKeys keyMap={this.keyMap} handlers={handlers}>
            <div className='firstChildElement' />
          </HotKeys>

          <div className='secondChildElement' />
        </div>,
        { attachTo: this.reactDiv }
      );

      this.firstElement = new FocusableElement(this.wrapper, '.firstChildElement');
      this.secondElement = new FocusableElement(this.wrapper, '.secondChildElement');

      this.firstElement.focus();

      expect(this.firstElement.isFocused()).to.equal(true);
    });

    afterEach(function() {
      document.body.removeChild(this.reactDiv);
    });

    describe('and nested HotKeys component has a handler that changes focus to another element bound to keydown', function () {
      it('then the root HotKeys still records the keyup event', function() {
        this.firstElement.keyDown(KeyCode.A);

        expect(this.nextHandler).to.have.been.calledOnce;

        expect(this.secondElement.isFocused()).to.equal(true);

        simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.A });
        simulant.fire(this.reactDiv, 'keyup', { key: KeyCode.A });

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
