import React from 'react';
import {mount} from 'enzyme';
import {expect} from 'chai';
import sinon from 'sinon';
import simulant from 'simulant';

import { configure, GlobalHotKeys } from '../../src/';

describe('GlobalHotKeys: Using custom key codes:', function () {
  beforeEach(function () {
    this.reactDiv = document.createElement('div');
    document.body.appendChild(this.reactDiv);
  });

  afterEach(function() {
    document.body.removeChild(this.reactDiv);
  });

  describe('when a custom key code has been added and a keyMap has been defined in terms of the custom key', () => {
    beforeEach(function () {
      this.customKeyName = 'BackTV';

      configure({ customKeyCodes: { 10009: this.customKeyName }});

      const keyMap = {
        ACTION: this.customKeyName
      };

      this.handler = sinon.spy();

      const handlers = {
        ACTION: this.handler
      };

      this.wrapper = mount(
        <GlobalHotKeys keyMap={keyMap} handlers={handlers}>
          <div className="childElement" />
        </GlobalHotKeys>,
        { attachTo: this.reactDiv }
      );
    });

    afterEach(function() {
      configure({ customKeyCodes: {}});
    });

    it('then calls the corresponding handler when the custom key occurs', function() {
      expect(this.handler).to.not.have.been.called;

      simulant.fire(this.reactDiv, 'keydown', { keyCode: 10009 });

      expect(this.handler).to.have.been.calledOnce;
    });
  });
});
