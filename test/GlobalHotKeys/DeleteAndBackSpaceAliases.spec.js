import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import simulant from 'simulant';

import { GlobalHotKeys } from '../../src/';

['backspace', 'BackSpace'].forEach(function(keyAlias) {
  describe(`When an action is defined using the combination '${keyAlias}':`, () => {
    context('and a Backspace event is triggered', () => {
      beforeEach(function () {
        this.keyMap = {
          'ACTION1': keyAlias,
        };

        this.handler = sinon.spy();

        this.handlers = {
          'ACTION1': this.handler,
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

      it('then calls the associated handler', function() {
        simulant.fire(this.reactDiv, 'keydown', { key: 'Backspace' });

        expect(this.handler).to.have.been.calledOnce;
      });
    });
  })
});

['del', 'Delete'].forEach(function(keyAlias) {
  describe(`When an action is defined using the combination '${keyAlias}':`, () => {
    context('and a Delete event is triggered', () => {
      beforeEach(function () {
        this.keyMap = {
          'ACTION1': keyAlias,
        };

        this.handler = sinon.spy();

        this.handlers = {
          'ACTION1': this.handler,
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

      it('then calls the associated handler', function() {
        simulant.fire(this.reactDiv, 'keydown', { key: 'Delete' });

        expect(this.handler).to.have.been.calledOnce;
      });
    });
  })
});
