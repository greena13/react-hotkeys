import React from 'react';
import {mount} from 'enzyme';
import {expect} from 'chai';
import sinon from 'sinon';

import {HotKeys} from '../../src/';
import FocusableElement from '../support/FocusableElement';

const keyAliases = ['del', 'backspace', 'Delete', 'BackSpace' ];
const keyNames = [ 'Delete', 'Backspace' ];

keyAliases.forEach(function(keyAlias) {
  keyNames.forEach(function(keyName) {
    describe(`When an action is defined using the combination '${keyAlias}':`, () => {
      context(`and a ${keyName} event is triggered`, () => {
        beforeEach(function () {
          this.keyMap = {
            'ACTION1': keyAlias,
          };

          this.handler = sinon.spy();

          this.handlers = {
            'ACTION1': this.handler,
          };

          this.wrapper = mount(
            <HotKeys keyMap={this.keyMap} handlers={this.handlers}>
              <div className="childElement" />
            </HotKeys>
          );

          this.targetElement = new FocusableElement(this.wrapper, '.childElement');
          this.targetElement.focus();
        });

        it('then calls the associated handler', function() {
          this.targetElement.keyDown(keyName);

          expect(this.handler).to.have.been.calledOnce;
        });
      });
    })
  })
});
