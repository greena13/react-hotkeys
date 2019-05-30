import React from 'react';
import { expect } from 'chai';
import {mount} from 'enzyme';
import sinon from 'sinon';

import Key from '../support/Key';
import KeyEventManager from '../../src/lib/KeyEventManager';
import { HotKeys } from '../../src';
import FocusableElement from '../support/FocusableElement';

describe('Binding to keys with simulated keypress events:', function () {
  context('when HotKeys has actions defined for the keydown and keyup event of the same key', () => {
    beforeEach(function () {
      this.keyMap = {
        'ACTION1': {sequence: 'command', action: 'keydown'},
        'ACTION2': {sequence: 'command', action: 'keyup'},
      };

      this.action1Handler = sinon.spy();
      this.action2Handler = sinon.spy();

      this.handlers = {
        'ACTION1': this.action1Handler,
        'ACTION2': this.action2Handler,
      };

      this.wrapper = mount(
        <HotKeys keyMap={this.keyMap} handlers={this.handlers}>
          <div className="childElement" />
        </HotKeys>
      );

      this.keyEventManager = KeyEventManager.getInstance();

      this.targetElement = new FocusableElement(this.wrapper, '.childElement');
      this.targetElement.focus();
    });

    it('then calls the handlers for both key events (https://github.com/greena13/react-hotkeys/issues/166)', function () {
      this.targetElement.keyDown(Key.COMMAND, { metaKey: true });

      expect(this.action1Handler).to.have.been.calledOnce;
      expect(this.action2Handler).to.not.have.been.called;

      this.targetElement.keyUp(Key.COMMAND, { metaKey: false });

      expect(this.action1Handler).to.have.been.calledOnce;
      expect(this.action2Handler).to.have.been.calledOnce;
    });
  });
});
