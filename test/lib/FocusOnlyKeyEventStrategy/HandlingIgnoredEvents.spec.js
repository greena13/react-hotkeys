import { expect } from 'chai';
import sinon from 'sinon';

import KeyEventManager from '../../../src/lib/KeyEventManager';
import KeyEventState from '../../../src/const/KeyEventState';
import MockSyntheticEvent from '../../support/MockSyntheticEvent';
import EmptyKeyCombination from '../../support/EmptyKeyCombination';

describe('Handling ignored events:', function () {
  context('when the FocusOnlyKeyEventStrategy receives', () => {
    beforeEach(function () {
      this.keyEventManager = new KeyEventManager();
      this.eventStrategy = this.keyEventManager.getFocusOnlyEventStrategy();

      this.handler = sinon.spy();

      this.componentId = this.eventStrategy.registerKeyMap({});
    });

    context('a keydown event', () => {
      beforeEach(function () {
        this.keyMap = {ACTION1: { sequence: 'a', action: 'keydown' } };
      });

      context('that is NOT ignored', () => {
        beforeEach(function () {
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

          this.eventStrategy.handleKeyDown(
            new MockSyntheticEvent('keydown', {key: 'a'}),
            0,
            this.componentId,
            this.eventOptions
          );
        });

        it('then the key is added to the current key combination', function () {
          expect(this.eventStrategy.getKeyHistory().toJSON()).to.eql([
            {
              'keys': {
                'a': [
                  [KeyEventState.unseen, KeyEventState.unseen, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen]
                ]
              },
              'ids': ['a'],
              'keyAliases': {}
            }
          ]);
        });

        it('then calls any matching handlers', function() {
          expect(this.handler).to.have.been.calledOnce;
        });
      });

      context('that is ignored', () => {
        beforeEach(function () {
          this.eventOptions = {
            ignoreEventsCondition: () => KeyEventState.seen
          };

          this.eventStrategy.enableHotKeys(
            this.componentId,
            this.keyMap,
            {ACTION1: this.handler},
            {},
            this.eventOptions
          );

          this.eventStrategy.handleKeyDown(
            new MockSyntheticEvent('keydown', {key: 'a'}),
            0,
            this.componentId,
            this.eventOptions
          );
        });

        it('then the key is NOT added to the current key combination', function () {
          expect(this.eventStrategy.getKeyHistory().toJSON()).to.eql([EmptyKeyCombination]);
        });

        it('then does NOT call any matching handlers', function() {
          expect(this.handler).to.not.have.been.called;
        });
      });
    });

    context('a keypress event', () => {
      beforeEach(function () {
        this.keyMap = {ACTION1: { sequence: 'a', action: 'keypress' } };
      });

      context('that is NOT ignored', () => {
        beforeEach(function () {
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
        });

        context('and the key already exists in the current combination', () => {
          beforeEach(function () {
            this.eventStrategy.handleKeyDown(
              new MockSyntheticEvent('keydown', {key: 'a'}),
              0,
              this.componentId,
              this.eventOptions
            );

            this.eventStrategy.handleKeyPress(
              new MockSyntheticEvent('keypress', {key: 'a'}),
              0,
              this.componentId,
              this.eventOptions
            );
          });

          it('then the key is added to the current key combination', function () {
            expect(this.eventStrategy.getKeyHistory().toJSON()).to.eql([
              {
                'keys': {
                  'a': [
                    [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                    [KeyEventState.seen, KeyEventState.seen, KeyEventState.unseen]
                  ]
                },
                'ids': ['a'],
                'keyAliases': {}
              }
            ]);
          });

          it('then calls any matching handlers', function() {
            expect(this.handler).to.have.been.calledOnce;
          });
        });

        context('and the key does NOT already exist in the current combination', () => {
          beforeEach(function () {
            this.eventStrategy.handleKeyPress(
              new MockSyntheticEvent('keypress', {key: 'a'}),
              0,
              this.componentId,
              this.eventOptions
            );
          });

          it('then the key is NOT added to the current key combination', function () {
            expect(this.eventStrategy.getKeyHistory().toJSON()).to.eql([EmptyKeyCombination]);
          });

          it('then does NOT call any matching handlers', function() {
            expect(this.handler).to.not.have.been.called;
          });
        });
      });

      context('that is ignored', () => {
        beforeEach(function () {
          this.eventOptions = {
            ignoreEventsCondition: () => true
          };

          this.eventStrategy.enableHotKeys(
            this.componentId,
            this.keyMap,
            {ACTION1: this.handler},
            {},
            this.eventOptions
          );
        });

        context('and the key already exists in the current combination', () => {
          beforeEach(function () {
            this.eventStrategy.handleKeyDown(
              new MockSyntheticEvent('keydown', {key: 'a'}),
              0,
              this.componentId,
              { ignoreEventsCondition: () => false }
            );

            this.eventStrategy.handleKeyPress(
              new MockSyntheticEvent('keypress', {key: 'a'}),
              0,
              this.componentId,
              this.eventOptions
            );
          });

          it('then the key is added to the current key combination', function () {
            expect(this.eventStrategy.getKeyHistory().toJSON()).to.eql([
              {
                'keys': {
                  'a': [
                    [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                    [KeyEventState.seen, KeyEventState.seen, KeyEventState.unseen]
                  ]
                },
                'ids': ['a'],
                'keyAliases': {}
              }
            ]);
          });

          it('then does NOT call any matching handlers', function() {
            expect(this.handler).to.not.have.been.called;
          });
        });

        context('and the key does NOT already exist in the current combination', () => {
          beforeEach(function () {
            this.eventStrategy.handleKeyPress(
              new MockSyntheticEvent('keypress', {key: 'a'}),
              0,
              this.componentId,
              this.eventOptions
            );
          });

          it('then the key is NOT added to the current key combination', function () {
            expect(this.eventStrategy.getKeyHistory().toJSON()).to.eql([EmptyKeyCombination]);
          });

          it('then does NOT call any matching handlers', function() {
            expect(this.handler).to.not.have.been.called;
          });
        });
      });
    });

    context('a keyup event', () => {
      beforeEach(function () {
        this.keyMap = {ACTION1: { sequence: 'a', action: 'keyup' } };
      });

      context('that is NOT ignored', () => {
        beforeEach(function () {
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
        });

        context('and the key already exists in the current combination', () => {
          beforeEach(function () {
            this.eventStrategy.handleKeyDown(
              new MockSyntheticEvent('keydown', {key: 'a'}),
              0,
              this.componentId,
              this.eventOptions
            );

            this.eventStrategy.handleKeyPress(
              new MockSyntheticEvent('keypress', {key: 'a'}),
              0,
              this.componentId,
              this.eventOptions
            );

            this.eventStrategy.handleKeyUp(
              new MockSyntheticEvent('keyup', {key: 'a'}),
              0,
              this.componentId,
              this.eventOptions
            );
          });

          it('then the key is added to the current key combination', function () {
            expect(this.eventStrategy.getKeyHistory().toJSON()).to.eql([
              {
                'keys': {
                  'a': [
                    [KeyEventState.seen, KeyEventState.seen, KeyEventState.unseen],
                    [KeyEventState.seen, KeyEventState.seen, KeyEventState.seen]
                  ]
                },
                'ids': ['a'],
                'keyAliases': {}
              }
            ]);
          });

          it('then calls any matching handlers', function() {
            expect(this.handler).to.have.been.calledOnce;
          });
        });

        context('and the key does NOT already exist in the current combination', () => {
          beforeEach(function () {
            this.eventStrategy.handleKeyUp(
              new MockSyntheticEvent('keyup', {key: 'a'}),
              0,
              this.componentId,
              this.eventOptions
            );
          });

          it('then the key is NOT added to the current key combination', function () {
            expect(this.eventStrategy.getKeyHistory().toJSON()).to.eql([EmptyKeyCombination]);
          });

          it('then does NOT call any matching handlers', function() {
            expect(this.handler).to.not.have.been.called;
          });
        });
      });

      context('that is ignored', () => {
        beforeEach(function () {
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
        });

        context('and the key already exists in the current combination', () => {
          beforeEach(function () {
            this.eventStrategy.handleKeyDown(
              new MockSyntheticEvent('keydown', {key: 'a'}),
              0,
              this.componentId,
              { ignoreEventsCondition: () => false }
            );

            this.eventStrategy.handleKeyPress(
              new MockSyntheticEvent('keypress', {key: 'a'}),
              0,
              this.componentId,
              { ignoreEventsCondition: () => false }
            );

            this.eventStrategy.handleKeyUp(
              new MockSyntheticEvent('keyup', {key: 'a'}),
              0,
              this.componentId,
              { ignoreEventsCondition: () => true }
            );
          });

          it('then the key is added to the current key combination', function () {
            expect(this.eventStrategy.getKeyHistory().toJSON()).to.eql([
              {
                'keys': {
                  'a': [
                    [KeyEventState.seen, KeyEventState.seen, KeyEventState.unseen],
                    [KeyEventState.seen, KeyEventState.seen, KeyEventState.seen]
                  ]
                },
                'ids': ['a'],
                'keyAliases': {}
              }
            ]);
          });

          it('then does NOT call any matching handlers', function() {
            expect(this.handler).to.not.have.been.called;
          });
        });

        context('and the key does NOT already exist in the current combination', () => {
          beforeEach(function () {
            this.eventStrategy.handleKeyPress(
              new MockSyntheticEvent('keypress', {key: 'a'}),
              0,
              this.componentId,
              this.eventOptions
            );
          });

          it('then the key is NOT added to the current key combination', function () {
            expect(this.eventStrategy.getKeyHistory().toJSON()).to.eql([EmptyKeyCombination]);
          });

          it('then does NOT call any matching handlers', function() {
            expect(this.handler).to.not.have.been.called;
          });
        });
      });
    });
  });
});
