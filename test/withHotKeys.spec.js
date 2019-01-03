import React, {PureComponent} from 'react';
import {mount} from 'enzyme';
import {expect} from 'chai';
import sinon from 'sinon';

import withHotKeys from '../src/withHotKeys';
import FocusableElement from './support/FocusableElement';
import KeyCode from './support/Key';

class ChildComponent extends PureComponent {
  hotKeyHandlers = {
    'fakeAction1': () => {},
    'fakeAction2': () => {},
  };

  render() {
    const {hotKeys} = this.props;

    return (
      <div { ...hotKeys }>
        { this.props.children }
      </div>
    )
  }
}

describe('withHotKeys:', () => {
  context('when the second argument is not used', () => {
    beforeEach(function () {
      this.wrappedComponent = withHotKeys(ChildComponent);

      this.handler = sinon.spy();

      this.wrapper = mount(
        <this.wrappedComponent
          keyMap={ {'ACTION': 'a' } }
          handlers={ {'ACTION': this.handler } }
        >
          <div className="childElement" />
        </this.wrappedComponent>
      );

      this.child = this.wrapper.find(ChildComponent);
    });

    it('then correctly renders children', function() {
      expect(this.wrapper.html()).to.equal(
        '<div tabindex="-1"><div class="childElement"></div></div>'
      );
    });

    it('then does not pass down the keyMap prop', function() {
      expect(this.child.prop('keyMap')).to.be.undefined;
    });

    it('then does not pass down the handlers prop', function() {
      expect(this.child.prop('handlers')).to.be.undefined;
    });

    it('then does not pass down the global prop', function() {
      expect(this.child.prop('global')).to.be.undefined;
    });

    it('then passes down the tabIndex prop', function() {
      expect(this.child.prop('hotKeys').tabIndex).to.eql('-1');
    });

    it('then passes down the onFocus prop', function() {
      expect(this.child.prop('onFocus')).to.eql(
        this.wrapper.find(this.wrappedComponent)._handleFocus
      );
    });

    it('then passes down the onBlur prop', function() {
      expect(this.child.prop('onBlur')).to.eql(
        this.wrapper.find(this.wrappedComponent)._handleBlur
      );
    });

    it('then passes down the onKeyDown prop', function() {
      expect(this.child.prop('onKeyDown')).to.eql(
        this.wrapper.find(this.wrappedComponent)._handleKeyDown
      );
    });

    it('then passes down the onKeyPress prop', function() {
      expect(this.child.prop('onKeyPress')).to.eql(
        this.wrapper.find(this.wrappedComponent)._handleKeyPress
      );
    });

    it('then passes down the onKeyUp prop', function() {
      expect(this.child.prop('onKeyUp')).to.eql(
        this.wrapper.find(this.wrappedComponent)._handleKeyUp
      );
    });

    it('then uses the handlers defined when using the wrapped component work correctly', function() {
      this.targetElement = new FocusableElement(this.wrapper, '.childElement');
      this.targetElement.focus();

      this.targetElement.keyPress(KeyCode.A);

      expect(this.handler).to.have.been.called;
    });
  });

  context('when the second argement is specified', () => {
    context('and no props are passed to the wrapped component', () => {
      beforeEach(function () {
        this.handler = sinon.spy();

        this.wrappedComponent = withHotKeys(ChildComponent, {
          keyMap: {'ACTION': 'a' },
          handlers: {'ACTION': this.handler }
        });

        this.wrapper = mount(
          <this.wrappedComponent>
            <div className="childElement" />
          </this.wrappedComponent>
        );
      });

      it('then uses the handlers defined in the second argument', function() {
        this.targetElement = new FocusableElement(this.wrapper, '.childElement');
        this.targetElement.focus();

        this.targetElement.keyPress(KeyCode.A);

        expect(this.handler).to.have.been.called;
      });
    });

    context('and props are passed to the wrapped component', () => {
      beforeEach(function () {
        this.secondArdumentHandlerA = sinon.spy();
        this.secondArdumentHandlerB = sinon.spy();
        this.propsHandlerA = sinon.spy();
        this.propsHandlerC = sinon.spy();

        this.wrappedComponent = withHotKeys(ChildComponent, {
          keyMap: { 'ACTION_A': 'a', 'ACTION_B': 'b' },
          handlers: {
            'ACTION_A': this.secondArdumentHandlerA,
            'ACTION_B': this.secondArdumentHandlerB
          }
        });

        this.wrapper = mount(
          <this.wrappedComponent
            keyMap={ {'ACTION_A': 'a', 'ACTION_C': 'c' } }
            handlers={ {'ACTION_A': this.propsHandlerA, 'ACTION_C': this.propsHandlerC } }
          >
            <div className="childElement" />
          </this.wrappedComponent>
        );
      });

      it('then correctly merges the values defined in props and the second argument', function() {
        this.targetElement = new FocusableElement(this.wrapper, '.childElement');
        this.targetElement.focus();

        this.targetElement.keyPress(KeyCode.A);

        expect(this.propsHandlerA).to.have.been.called;
        expect(this.secondArdumentHandlerA).to.not.have.been.called;

        this.targetElement.keyPress(KeyCode.B);

        expect(this.secondArdumentHandlerB).to.have.been.called;

        this.targetElement.keyPress(KeyCode.C);

        expect(this.propsHandlerC).to.have.been.called;
      });
    });
  });
});
