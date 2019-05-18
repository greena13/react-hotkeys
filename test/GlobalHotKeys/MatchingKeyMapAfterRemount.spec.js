import {mount} from 'enzyme';
import {expect} from 'chai';
import sinon from 'sinon';
import simulant from 'simulant';
import React, {Component} from 'react'

import KeyCode from '../support/Key';
import {GlobalHotKeys} from '../../src';

describe('Matching key map after remount for a GlobalHotKeys component:', function () {
  beforeEach(function () {
    const keyMap = this.keyMap = {
      'ACTION_A': 'a',
    };

    const keyMap2 = this.keyMap2 = {
      'ACTION_B': 'b',
    };

    this.handler = sinon.spy();
    this.handler2 = sinon.spy();

    const handlers = this.handlers = {
      'ACTION_A': this.handler,
    };

    const handlers2 = this.handlers2 = {
      'ACTION_B': this.handler2,
    };

    class ToggleComponent extends Component {
      render(){
        const { secondKeyMapActive } = this.props;

        return (
          <div>
            <GlobalHotKeys keyMap={keyMap} handlers={handlers} />
            { secondKeyMapActive && <GlobalHotKeys keyMap={keyMap2} handlers={handlers2} />}
          </div>
        );
      }
    }

    this.reactDiv = document.createElement('div');
    document.body.appendChild(this.reactDiv);

    this.wrapper = mount(
      <ToggleComponent secondKeyMapActive={true} />,
      { attachTo: this.reactDiv }
    );
  });

  after(function() {
    document.body.removeChild(this.reactDiv);
  });

  describe('when two GlobalHotKeys components are mounted, unmounted and remounted', () => {
    it('then both of their key maps work while they are mounted and not, when they aren\'t (BUG: https://github.com/greena13/react-hotkeys/issues/150)', function() {
      simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.A });
      simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.A });
      simulant.fire(this.reactDiv, 'keyup', { key: KeyCode.A });

      expect(this.handler).to.have.been.calledOnce;

      simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.B });
      simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.B });
      simulant.fire(this.reactDiv, 'keyup', { key: KeyCode.B });

      expect(this.handler2).to.have.been.calledOnce;

      /**
       * Unmount the second GlobalHotKeys component
       */
      this.wrapper.setProps({ secondKeyMapActive: false });

      simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.A });
      simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.A });
      simulant.fire(this.reactDiv, 'keyup', { key: KeyCode.A });

      expect(this.handler).to.have.been.calledTwice;

      simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.B });
      simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.B });
      simulant.fire(this.reactDiv, 'keyup', { key: KeyCode.B });

      expect(this.handler2).to.have.been.calledOnce;

      /**
       * Re-mount the second GlobalHotKeys component
       */
      this.wrapper.setProps({ secondKeyMapActive: true });

      simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.A });
      simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.A });
      simulant.fire(this.reactDiv, 'keyup', { key: KeyCode.A });

      expect(this.handler).to.have.been.calledThrice;

      simulant.fire(this.reactDiv, 'keydown', { key: KeyCode.B });
      simulant.fire(this.reactDiv, 'keypress', { key: KeyCode.B });
      simulant.fire(this.reactDiv, 'keyup', { key: KeyCode.B });

      expect(this.handler2).to.have.been.calledTwice;
    });
  });
});
