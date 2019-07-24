import { expect } from 'chai';
import sinon from 'sinon';

import Key from '../support/Key';
import KeyEventManager from '../../src/lib/KeyEventManager';
import Configuration from '../../src/lib/config/Configuration';
import KeyEventState from '../../src/const/KeyEventState';
import MockSyntheticEvent from '../support/MockSyntheticEvent';

describe('Ignoring events that have already been simulated:', function () {
  [
    {
      strategyKey: 'focusOnlyEventStrategy',
      strategyName: 'FocusOnlyEventStrategy'
    },
    {
      strategyKey: 'globalEventStrategy',
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
          this.eventStrategy.handleKeyDown(
            new MockSyntheticEvent('keydown', {key: 'Meta'}),
            0,
            this.componentId,
            this.eventOptions
          );

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              'keys': {
                'Meta': [
                  [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen]
                ]
              },
              'ids': ['Meta'],
              'keyAliases': {}
            }
          ]);

          this.eventStrategy.handleKeyDown(
            new MockSyntheticEvent('keydown', {key: Key.A}),
            0,
            this.componentId,
            this.eventOptions
          );

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              'keys': {
                'Meta': [
                  [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen]
                ],
                'a': [
                  [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen]
                ]
              },
              'ids': ['Meta+a'],
              'keyAliases': { }
            }
          ]);

          expect(this.handler).to.have.been.calledOnce;

          this.eventStrategy.handleKeyPress(
            new MockSyntheticEvent('keypress', {key: Key.A}),
            0,
            this.componentId,
            this.eventOptions
          );

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              'keys': {
                'Meta': [
                  [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen]
                ],
                'a': [
                  [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen]
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
          this.eventStrategy.handleKeyDown(
            new MockSyntheticEvent('keydown', {key: 'Meta'}),
            0,
            this.componentId,
            this.eventOptions
          );

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              'keys': {
                'Meta': [
                  [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen]
                ]
              },
              'ids': ['Meta'],
              'keyAliases': {}
            }
          ]);

          this.eventStrategy.handleKeyDown(
            new MockSyntheticEvent('keydown', {key: Key.A}),
            0,
            this.componentId,
            this.eventOptions
          );

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              'keys': {
                'Meta': [
                  [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen]
                ],
                'a': [
                  [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen]
                ]
              },
              'ids': ['Meta+a'],
              'keyAliases': { }
            }
          ]);

          this.eventStrategy.handleKeyUp(
            new MockSyntheticEvent('keyup', {key: Key.COMMAND}),
            0,
            this.componentId,
            this.eventOptions
          );

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              'keys': {
                'Meta': [
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.seen]
                ],
                'a': [
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.simulated]
                ]
              },
              'ids': ['Meta+a'],
              'keyAliases': {}
            }
          ]);

          expect(this.handler).to.have.been.calledOnce;

          this.eventStrategy.handleKeyUp(
            new MockSyntheticEvent('keyup', {key: Key.A}),
            0,
            this.componentId,
            this.eventOptions
          );

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              'keys': {
                'Meta': [
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.seen]
                ],
                'a': [
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.simulated]
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
