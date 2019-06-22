import { expect } from 'chai';
import sinon from 'sinon';

import Key from '../support/Key';
import KeyEventManager from '../../src/lib/KeyEventManager';
import Configuration from '../../src/lib/Configuration';
import KeyEventRecordState from '../../src/const/KeyEventRecordState';
import MockSyntheticEvent from '../support/MockSyntheticEvent';

describe('Ignoring events that have already been simulated:', function () {
  [
    {
      strategyKey: '_focusOnlyEventStrategy',
      strategyName: 'FocusOnlyEventStrategy'
    },
    {
      strategyKey: '_globalEventStrategy',
      strategyName: 'GlobalEventStrategy'
    }
  ].forEach(({strategyKey, strategyName}) => {
    context(`when the ${strategyName} simulates a keypress events`, () => {
      context('and browser triggers the event anyway', () => {
        beforeEach(function () {
          this.keyEventManager = new KeyEventManager();

          this.eventStrategy = this.keyEventManager[strategyKey];

          this.eventOptions = {
            ignoreEventsCondition: Configuration.option('ignoreEventsCondition')
          };

          const keyMap = {
            ACTION: { sequence: 'cmd+a', action: 'keypress' }
          };

          this.handler = sinon.spy();

          const handlers = {
            ACTION: this.handler
          };

          this.componentId = this.eventStrategy.registerKeyMap({});
          this.eventStrategy.enableHotKeys(this.componentId, keyMap, handlers, {}, {ignoreEventsCondition: Configuration.option('ignoreEventsCondition')});
        });

        it('then ignores the event', function () {
          this.eventStrategy.handleKeydown(
            new MockSyntheticEvent('keydown', {key: 'Meta'}),
            0,
            this.componentId,
            this.eventOptions
          );

          expect(this.eventStrategy.getKeyHistory().toJSON()).to.eql([
            {
              'keys': {
                'Meta': [
                  [KeyEventRecordState.seen, KeyEventRecordState.unseen, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.unseen]
                ]
              },
              'ids': ['Meta'],
              'keyAliases': {}
            }
          ]);

          this.eventStrategy.handleKeydown(
            new MockSyntheticEvent('keydown', {key: Key.A}),
            0,
            this.componentId,
            this.eventOptions
          );

          expect(this.eventStrategy.getKeyHistory().toJSON()).to.eql([
            {
              'keys': {
                'Meta': [
                  [KeyEventRecordState.seen, KeyEventRecordState.unseen, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.unseen]
                ],
                'a': [
                  [KeyEventRecordState.seen, KeyEventRecordState.unseen, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.unseen]
                ]
              },
              'ids': ['Meta+a'],
              'keyAliases': { }
            }
          ]);

          expect(this.handler).to.have.been.calledOnce;

          this.eventStrategy.handleKeypress(
            new MockSyntheticEvent('keypress', {key: Key.A}),
            0,
            this.componentId,
            this.eventOptions
          );

          expect(this.eventStrategy.getKeyHistory().toJSON()).to.eql([
            {
              'keys': {
                'Meta': [
                  [KeyEventRecordState.seen, KeyEventRecordState.unseen, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.unseen]
                ],
                'a': [
                  [KeyEventRecordState.seen, KeyEventRecordState.unseen, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.unseen]
                ]
              },
              'ids': ['Meta+a'],
              'keyAliases': {}
            }
          ]);

          /**
           * Doesn't call the handler again
           */
          expect(this.handler).to.have.been.calledOnce;
        })
      });
    });

    context(`when the ${strategyName} simulates a keyup events`, () => {
      context('and browser triggers the event anyway', () => {
        beforeEach(function () {
          this.keyEventManager = new KeyEventManager();

          this.eventStrategy = this.keyEventManager[strategyKey];

          this.eventOptions = {
            ignoreEventsCondition: Configuration.option('ignoreEventsCondition')
          };

          const keyMap = {
            ACTION: { sequence: 'cmd+a', action: 'keyup' }
          };

          this.handler = sinon.spy();

          const handlers = {
            ACTION: this.handler
          };

          this.componentId = this.eventStrategy.registerKeyMap({});
          this.eventStrategy.enableHotKeys(this.componentId, keyMap, handlers, {}, {ignoreEventsCondition: Configuration.option('ignoreEventsCondition')});
        });

        it('then ignores the event', function () {
          this.eventStrategy.handleKeydown(
            new MockSyntheticEvent('keydown', {key: 'Meta'}),
            0,
            this.componentId,
            this.eventOptions
          );

          expect(this.eventStrategy.getKeyHistory().toJSON()).to.eql([
            {
              'keys': {
                'Meta': [
                  [KeyEventRecordState.seen, KeyEventRecordState.unseen, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.unseen]
                ]
              },
              'ids': ['Meta'],
              'keyAliases': {}
            }
          ]);

          this.eventStrategy.handleKeydown(
            new MockSyntheticEvent('keydown', {key: Key.A}),
            0,
            this.componentId,
            this.eventOptions
          );

          expect(this.eventStrategy.getKeyHistory().toJSON()).to.eql([
            {
              'keys': {
                'Meta': [
                  [KeyEventRecordState.seen, KeyEventRecordState.unseen, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.unseen]
                ],
                'a': [
                  [KeyEventRecordState.seen, KeyEventRecordState.unseen, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.unseen]
                ]
              },
              'ids': ['Meta+a'],
              'keyAliases': { }
            }
          ]);

          this.eventStrategy.handleKeyup(
            new MockSyntheticEvent('keyup', {key: Key.COMMAND}),
            0,
            this.componentId,
            this.eventOptions
          );

          expect(this.eventStrategy.getKeyHistory().toJSON()).to.eql([
            {
              'keys': {
                'Meta': [
                  [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.seen]
                ],
                'a': [
                  [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.simulated]
                ]
              },
              'ids': ['Meta+a'],
              'keyAliases': {}
            }
          ]);

          expect(this.handler).to.have.been.calledOnce;

          this.eventStrategy.handleKeyup(
            new MockSyntheticEvent('keyup', {key: Key.A}),
            0,
            this.componentId,
            this.eventOptions
          );

          expect(this.eventStrategy.getKeyHistory().toJSON()).to.eql([
            {
              'keys': {
                'Meta': [
                  [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.seen]
                ],
                'a': [
                  [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.simulated, KeyEventRecordState.simulated]
                ]
              },
              'ids': ['Meta+a'],
              'keyAliases': {}
            }
          ]);

          /**
           * Doesn't call the handler again
           */
          expect(this.handler).to.have.been.calledOnce;
        })
      });
    });
  });
});
