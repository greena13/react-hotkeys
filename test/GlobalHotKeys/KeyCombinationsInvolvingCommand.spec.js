import React from 'react';
import {mount} from 'enzyme';
import {expect} from 'chai';
import simulant from 'simulant';
import sinon from 'sinon';

import {GlobalHotKeys} from '../../src';
import KeyCode from '../support/Key';

describe('When a GlobalHotKeys key combination involves the command key:', () => {
  [
    {
      action: 'keydown',
      preMatchEvents: ['keydown'],
      postMatchEvents: ['keyup', 'keydown']
    },
    {
      action: 'keypress',
      preMatchEvents: ['keydown'],
      postMatchEvents: ['keyup', 'keydown']
    },
    {
      action: 'keyup',
      preMatchEvents: ['keydown', 'keyup'],
      postMatchEvents: ['keydown', 'keyup']
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
          <div>
            <GlobalHotKeys keyMap={this.keyMap} handlers={this.handlers} />
          </div>,
          { attachTo: this.reactDiv }
        );
      });

      afterEach(function() {
        document.body.removeChild(this.reactDiv);
      });

      it('then calls the handler when all keys in the combination are pressed down', function() {
        preMatchEvents.forEach((keyEvent) => {
          simulant.fire(this.reactDiv, keyEvent, { key: KeyCode.COMMAND });
          simulant.fire(this.reactDiv, keyEvent, { key: 'k' });
        });

        expect(this.handler).to.have.been.calledOnce;

        postMatchEvents.forEach((keyEvent) => {
          simulant.fire(this.reactDiv, keyEvent, { key: KeyCode.COMMAND });
        });

        expect(this.handler).to.have.been.calledOnce;
      });
    })
  });
});
