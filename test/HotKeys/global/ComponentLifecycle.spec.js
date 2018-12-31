import React from 'react';
import {mount} from 'enzyme';
import {expect} from 'chai';
import sinon from 'sinon';
import simulant from 'simulant';

import HotKeys from '../../../lib/HotKeys';
import KeyCode from '../../support/Key';

describe('Component lifecycle for global HotKeys component:', () => {
  before(function () {
    this.keyMap = {
      'ACTION1': 'a',
      'ACTION2': 'b',
    };
  });

  context('when component mounts', () => {
    beforeEach(function () {
      this.handler = sinon.spy();

      const handlers = {
        'ACTION1': this.handler,
      };

      this.reactDiv = document.createElement('div');
      document.body.appendChild(this.reactDiv);

      this.wrapper = mount(
        <HotKeys keyMap={this.keyMap} handlers={handlers} global>
          <div className="childElement" />
        </HotKeys>,
        { attachTo: this.reactDiv }
      );
    });

    afterEach(function() {
      document.body.removeChild(this.reactDiv);
    });

    it('then none of the handlers are called', function() {
      expect(this.handler).to.not.have.been.called;
    });
  });

  context('when the component has been unmounted', () => {
    beforeEach(function () {
      this.handler = sinon.spy();

      const handlers = {
        'ACTION1': this.handler,
      };

      this.reactDiv = document.createElement('div');
      document.body.appendChild(this.reactDiv);

      this.wrapper = mount(
        <HotKeys keyMap={this.keyMap} handlers={handlers} global>
          <div className="childElement" />
        </HotKeys>,
        { attachTo: this.reactDiv }
      );
    });

    it('then does not call the handler when a key matching a hot key is pressed', function() {
      simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.A });

      expect(this.handler).to.have.been.calledOnce;

      this.wrapper.unmount();

      simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.A });

      expect(this.handler).to.have.been.calledOnce;
    });
  });

});
