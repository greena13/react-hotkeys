import React from 'react';
import {mount} from 'enzyme';
import {expect} from 'chai';
import sinon from 'sinon';
import simulant from 'simulant';

import KeyCode from '../support/Key';
import {GlobalHotKeys} from '../../src';

describe('Matching Sequences When There Are Longer Ones Available:', function () {
  beforeEach(function () {
    this.keyMap = {
      'ACTION': { sequence: 'shift+?', action: 'keyup' },
      'OTHER_ACTION': 'a b',
    };

    this.handler = sinon.spy();

    const handlers = {
      'ACTION': this.handler,
      'OTHER_ACTION': this.handler,
    };

    this.reactDiv = document.createElement('div');
    document.body.appendChild(this.reactDiv);

    this.wrapper = mount(
      <GlobalHotKeys keyMap={ this.keyMap } handlers={ handlers }>
        <div className="childElement" />
      </GlobalHotKeys>,
      { attachTo: this.reactDiv }
    );
  });

  afterEach(function() {
    document.body.removeChild(this.reactDiv);
  });

  describe('When the keys in the shorter action sequence are pressed twice', function () {
    it('then that action\'s handler is called twice', function() {
      simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.SHIFT });
      simulant.fire(this.reactDiv, 'keydown', { key: '?' });
      simulant.fire(this.reactDiv, 'keypress', { key: '?' });
      simulant.fire(this.reactDiv, 'keyup', { key: '?' });
      simulant.fire(this.reactDiv, 'keyup', { key: KeyCode.SHIFT });

      expect(this.handler).to.have.been.calledOnce;

      simulant.fire(this.reactDiv, 'keydown', { key: 'Escape' });
      simulant.fire(this.reactDiv, 'keyup', { key: 'Escape' });

      simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.SHIFT });
      simulant.fire(this.reactDiv, 'keydown', { key: '?' });
      simulant.fire(this.reactDiv, 'keypress', { key: '?' });
      simulant.fire(this.reactDiv, 'keyup', { key: '?' });
      simulant.fire(this.reactDiv, 'keyup', { key: KeyCode.SHIFT });

      expect(this.handler).to.have.been.calledTwice;
    });
  });
});
