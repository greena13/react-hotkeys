import { expect } from 'chai';

import Key from '../support/Key';
import KeyEventManager from '../../src/lib/KeyEventManager';
import KeyEventRecordState from '../../src/const/KeyEventRecordState';
import Configuration from '../../src/lib/config/Configuration';
import MockSyntheticEvent from '../support/MockSyntheticEvent';

describe('Simulating keypress events hidden by cmd:', function () {
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
    context(`when the ${strategyName} receives the cmd keydown event followed by a non-modifier keydown event`, () => {
      context('and the cmd keypress event is NOT ignored', () => {
        beforeEach(function () {
          this.keyEventManager = new KeyEventManager();

          this.eventStrategy = this.keyEventManager[strategyKey];

          this.eventOptions = {
            ignoreEventsCondition: Configuration.option('ignoreEventsCondition')
          };

          this.componentId = this.eventStrategy.registerKeyMap({});
          this.eventStrategy.enableHotKeys(this.componentId, {}, {}, {}, {ignoreEventsCondition: Configuration.option('ignoreEventsCondition')});
        });

        it('then simulates the cmd keypress event and the non-modifier key\'s keypress event', function () {
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
            new MockSyntheticEvent('keydown', {key: Key.A, metaKey: true}),
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

          this.eventStrategy.handleKeyUp(
            new MockSyntheticEvent('keyup', {key: 'Meta'}),
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
        })
      });

      context('and the cmd keypress event is ignored', () => {
        beforeEach(function () {
          this.keyEventManager = new KeyEventManager();

          this.eventStrategy = this.keyEventManager[strategyKey];

          this.eventOptions = {
            ignoreEventsCondition: ({type}) => type !== 'keydown'
          };

          this.componentId = this.eventStrategy.registerKeyMap({});
          this.eventStrategy.enableHotKeys(this.componentId, {}, {}, {}, this.eventOptions);
        });

        it('then simulates the cmd keypress event and the non-modifier key\'s keypress event', function () {
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
            new MockSyntheticEvent('keydown', {key: Key.A, metaKey: true}),
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

          this.eventStrategy.handleKeyUp(
            new MockSyntheticEvent('keyup', {key: 'Meta'}),
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
        })
      });
    });
  });
});
