import React from 'react';
import {mount} from 'enzyme/build';
import {expect} from 'chai';
import sinon from 'sinon';
import simulant from 'simulant';

import FocusableElement from '../support/FocusableElement';
import KeyEventManager from '../../src/lib/KeyEventManager';
import KeyEventRecordState from '../../src/const/KeyEventRecordState';
import KeyCode from '../support/Key';

import {HotKeys, GlobalHotKeys} from '../../src';

describe('Closing hanging combinations in HotKeys Components:', function () {
  describe('when a HotKeys component has a handler on keydown that changes the focus to outside its descendants', function () {
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

    describe('and there is a GlobalHotKeys component also mounted', function () {
      it('then the GlobalHotKeys component will close the hanging combination by reporting the missed keypress and keyup events to the HotKeys component', function() {
        this.firstElement.keyDown(KeyCode.A);

        expect(this.nextHandler).to.have.been.calledOnce;

        expect(this.secondElement.isFocused()).to.equal(true);

        simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.A });
        simulant.fire(this.reactDiv, 'keyup', { key: KeyCode.A });

        expect(KeyEventManager.getInstance()._focusOnlyEventStrategy.keyCombinationHistory).to.eql([
          {
            'keys': {
              'a': [
                [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.unseen],
                [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.simulated]
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
