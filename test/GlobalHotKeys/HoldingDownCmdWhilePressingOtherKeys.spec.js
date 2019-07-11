import React from 'react';
import {mount} from 'enzyme';
import {expect} from 'chai';
import sinon from 'sinon';
import simulant from 'simulant';

import KeyCode from '../support/Key';
import { configure, GlobalHotKeys } from '../../src';

describe('Holding down Cmd while pressing other keys:', function () {
  after(function() {
    configure({allowCombinationSubmatches: false });
  });

  [true, false].forEach((allowCombinationSubmatches) => {
    describe(`when allowCombinationSubmatches is ${allowCombinationSubmatches}`, () => {
      before(function(){
        configure({allowCombinationSubmatches: allowCombinationSubmatches });
      });

      describe('and there are two actions with combinations that involve cmd (cmd+a and cmd+b) (https://github.com/greena13/react-hotkeys/issues/201)', function () {
        beforeEach(function () {
          this.keyMap = {
            'ACTION1': 'cmd+a',
            'ACTION2': 'cmd+b',
          };

          this.handler1 = sinon.spy();
          this.handler2 = sinon.spy();

          const handlers = {
            'ACTION1': this.handler1,
            'ACTION2': this.handler2
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

        describe('and cmd and \'a\' are pressed, and \'a\' is released and \'b\' is pressed instead', function () {
          it('then both actions are triggered', function() {
            simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.COMMAND });

            simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.A });

            expect(this.handler1).to.have.been.calledOnce;

            simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.B });
            simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.B });

            simulant.fire(this.reactDiv, 'keyup', { key: KeyCode.COMMAND });

            expect(this.handler2).to.have.been.calledOnce;
          });
        });
      })
    });
  });
});
