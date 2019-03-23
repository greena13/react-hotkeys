import { expect } from 'chai';
import sinon from 'sinon';

import KeyEventManager from '../../../src/lib/KeyEventManager';
import MockSyntheticEvent from '../../support/MockSyntheticEvent';

describe('Enabling hot keys:', function () {
  context('when the handler resolution state is already defined', () => {
    beforeEach(function () {
      this.keyEventManager = new KeyEventManager();
      this.eventStrategy = this.keyEventManager._globalEventStrategy;

      this.handler = sinon.spy();

      this.componentId = this.eventStrategy.registerKeyMap({});
      this.keyMap = {ACTION1: { sequence: 'a', action: 'keydown' } };
      this.eventOptions = {
        ignoreEventsCondition: () => false
      };

      this.eventStrategy.enableHotKeys(
        this.componentId,
        this.keyMap,
        {ACTION1: this.handler},
        {},
        this.eventOptions
      );

      this.eventStrategy.handleKeydown(
        new MockSyntheticEvent('keydown', {key: 'a'})
      );
    });

    it('then it is not reset', function () {
      expect(this.eventStrategy.handlerResolutionSearchIndex).to.not.eql(0);
      expect(this.eventStrategy.handlersDictionary).to.not.eql({});
      expect(this.eventStrategy.keyMaps).to.not.be.null;
      expect(this.eventStrategy.keySequencesDictionary).to.not.eql({});
      expect(this.eventStrategy.unmatchedHandlerStatus).to.not.be.null;
    });

    it('then it is reset on enabling hot keys again', function () {
      this.eventStrategy.enableHotKeys(
        this.componentId,
        this.keyMap,
        {ACTION1: this.handler},
        {},
        this.eventOptions
      );

      expect(this.eventStrategy.handlerResolutionSearchIndex).to.eql(0);
      expect(this.eventStrategy.handlersDictionary).to.eql({});
      expect(this.eventStrategy.keyMaps).to.be.null;
      expect(this.eventStrategy.keySequencesDictionary).to.eql({});
      expect(this.eventStrategy.unmatchedHandlerStatus).to.be.null;
    });
  });
});
