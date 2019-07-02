import { expect } from 'chai';
import sinon from 'sinon';

import KeyEventManager from '../../../src/lib/KeyEventManager';

describe('Ignoring enabling duplicate component ids:', function () {
  context('when the FocusOnlyKeyEventStrategy registers a component ID', () => {
    beforeEach(function () {
      this.keyEventManager = new KeyEventManager();
      this.eventStrategy = this.keyEventManager._focusOnlyEventStrategy;

      this.handler = sinon.spy();

      this.componentId = this.eventStrategy.registerKeyMap({});
    });

    context('and it has already registered that component ID', () => {
      beforeEach(function () {
        this.keyMap = {ACTION1: { sequence: 'a', action: 'keydown' } };

        this.eventStrategy.enableHotKeys(
          this.componentId,
          this.keyMap,
          {ACTION1: this.handler},
          {},
          {}
        );

        expect(this.eventStrategy.componentList.getAtPosition(0).componentId).to.eql(this.componentId);
        expect(this.eventStrategy.componentList.getLength()).to.eql(1);
      });

      it('then returns undefined and does not add the component again \
         (https://github.com/greena13/react-hotkeys/issues/173)', function () {
        const result = this.eventStrategy.enableHotKeys(
          this.componentId,
          this.keyMap,
          {ACTION1: this.handler},
          {},
          {}
        );

        expect(this.eventStrategy.componentList.getAtPosition(0).componentId).to.eql(this.componentId);
        expect(this.eventStrategy.componentList.getLength()).to.eql(1);

        expect(result).to.be.undefined;
      });
    });
  });
});
