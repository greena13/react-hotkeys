import React from 'react';
import {mount} from 'enzyme';
import {expect} from 'chai';
import sinon from 'sinon';

import { HotKeys } from '../../src';
import KeyCode from '../support/Key';
import FocusableElement from '../support/FocusableElement';

describe('When a HotKeys key combination involves the command key:', () => {
  [
    {
      action: 'keydown',
      preMatchEvents: ['keyDown'],
      postMatchEvents: ['keyUp', 'keyDown']
    },
    {
      action: 'keypress',
      preMatchEvents: ['keyDown'],
      postMatchEvents: ['keyUp', 'keyDown']
    },
    {
      action: 'keyup',
      preMatchEvents: ['keyDown', 'keyUp'],
      postMatchEvents: ['keyDown', 'keyUp']
    },
  ].forEach(({action, preMatchEvents, postMatchEvents}) => {
    context(`and the action is triggered on the ${action} event`, () => {
      beforeEach(function () {
        this.keyMap = {
          'ACTION1': { sequence: 'cmd+k', action },
        };

        this.handler = sinon.spy();

        this.handlers = {
          'ACTION1': this.handler
        };

        this.reactDiv = document.createElement('div');
        document.body.appendChild(this.reactDiv);

        this.wrapper = mount(
          <HotKeys keyMap={this.keyMap} handlers={this.handlers}>
            <div className="childElement" />
          </HotKeys>
        );

        this.targetElement = new FocusableElement(this.wrapper, '.childElement');
        this.targetElement.focus();
      });

      it('then calls the handler when all keys in the combination are pressed down', function() {
        preMatchEvents.forEach((keyEvent) => {
          this.targetElement[keyEvent](KeyCode.COMMAND);
          this.targetElement[keyEvent]('k');
        });

        expect(this.handler).to.have.been.calledOnce;

        postMatchEvents.forEach((keyEvent) => {
          this.targetElement[keyEvent](KeyCode.COMMAND);
        });

        expect(this.handler).to.have.been.calledOnce;
      });
    })
  });
});
