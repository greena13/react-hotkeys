import React from 'react';
import {mount} from 'enzyme';
import {expect} from 'chai';
import sinon from 'sinon';

import {HotKeys, configure} from '../../src/';
import FocusableElement from '../support/FocusableElement';

describe('Using custom key codes:', function () {
  describe('when a custom key code has been added and a keyMap has been defined in terms of the custom key', () => {
    beforeEach(function () {
      this.customKeyName = 'BackTV';
      this.customKeyCode = 10009;

      configure({ customKeyCodes: { [this.customKeyCode]: this.customKeyName }});

      const keyMap = {
        ACTION: this.customKeyName
      };

      this.handler = sinon.spy();

      this.wrapper = mount(
        <HotKeys keyMap={keyMap} handlers={{ACTION: this.handler}}>
          <div className="childElement" />
        </HotKeys>
      );

      this.targetElement = new FocusableElement(this.wrapper, '.childElement');
      this.targetElement.focus();
    });

    afterEach(function() {
      configure({ customKeyCodes: {}});
    });

    it('then calls the corresponding handler when the custom key occurs', function() {
      expect(this.handler).to.not.have.been.called;

      this.targetElement.keyDown(undefined, { keyCode: this.customKeyCode });

      expect(this.handler).to.have.been.calledOnce;
    });
  });
});
