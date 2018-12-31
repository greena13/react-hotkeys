import React from 'react';
import {mount} from 'enzyme';
import {expect} from 'chai';
import sinon from 'sinon';
import simulant from 'simulant';

import KeyCode from '../../support/Key';
import HotKeys from '../../../lib/HotKeys';

describe('Action and handler resolution for global HotKeys component:', function () {
  describe('when an action is defined', function () {
    describe('in the same component as its handlers', function () {
      beforeEach(function () {
        this.keyMap = {
          'ACTION': 'a',
        };

        this.handler = sinon.spy();

        const handlers = {
          'ACTION': this.handler,
        };

        this.reactDiv = document.createElement('div');
        document.body.appendChild(this.reactDiv);

        this.wrapper = mount(
          <HotKeys keyMap={ this.keyMap } handlers={ handlers } global>
            <div className="childElement" />
          </HotKeys>,
          { attachTo: this.reactDiv }
        );
      });

      afterEach(function() {
        document.body.removeChild(this.reactDiv);
      });

      describe('when the matching key is pressed', function () {
        it('then that action\'s handler is called', function() {
          simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.A });
          simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.A });
          simulant.fire(this.reactDiv, 'keyup', { key: KeyCode.A });

          expect(this.handler).to.have.been.calledOnce;
        });
      });
    });

    describe('in a parent component to the one that defines the handlers', function () {
      beforeEach(function () {
        this.keyMap = {
          'ACTION': 'a',
        };

        this.handler = sinon.spy();

        const handlers = {
          'ACTION': this.handler,
        };

        this.reactDiv = document.createElement('div');
        document.body.appendChild(this.reactDiv);

        this.wrapper = mount(
          <HotKeys keyMap={ this.keyMap } global>
            <HotKeys handlers={ handlers } global>
              <div className="childElement" />
            </HotKeys>
          </HotKeys>,
          { attachTo: this.reactDiv }
        );
      });

      afterEach(function() {
        document.body.removeChild(this.reactDiv);
      });

      describe('when the matching key is pressed', function () {
        it('then that action\'s handler is called', function() {
          simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.A });
          simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.A });
          simulant.fire(this.reactDiv, 'keyup', { key: KeyCode.A });

          expect(this.handler).to.have.been.calledOnce;
        });
      });
    });

    describe('in a grand parent component to the one that defines the handlers', function () {
      beforeEach(function () {
        this.keyMap = {
          'ACTION': 'a',
          ACTION2: 'b',
        };

        this.handler = sinon.spy();

        const handlers = {
          'ACTION': this.handler,
        };

        this.reactDiv = document.createElement('div');
        document.body.appendChild(this.reactDiv);

        this.wrapper = mount(
          <HotKeys keyMap={ this.keyMap }  global>
            <HotKeys keyMap={ { ACTION2: 'tab' } }  global>
              <div >
                <HotKeys handlers={ handlers } global>
                  <div className="childElement" />
                </HotKeys>
              </div>
            </HotKeys>
          </HotKeys>,
          { attachTo: this.reactDiv }
        );
      });

      afterEach(function() {
        document.body.removeChild(this.reactDiv);
      });

      describe('when the matching key is pressed', function () {
        it('then that action\'s handler is called', function() {
          simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.A });
          simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.A });
          simulant.fire(this.reactDiv, 'keyup', { key: KeyCode.A });

          expect(this.handler).to.have.been.calledOnce;
        });
      });
    });
  });
});
