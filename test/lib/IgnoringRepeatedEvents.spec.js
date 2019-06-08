import { expect } from 'chai';

import Key from '../support/Key';
import KeyEventManager from '../../src/lib/KeyEventManager';
import Configuration from '../../src/lib/Configuration';
import KeyEventRecordState from '../../src/const/KeyEventRecordState';
import MockSyntheticEvent from '../support/MockSyntheticEvent';

describe('Ignoring repeated events:', function () {
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
    context(`when the ${strategyName} receives the shift keydown event followed by a non-modifier keydown event`, () => {
      context('and the non-modifier key repeatedly triggers keydown and keypress events', () => {
        beforeEach(function () {
          this.keyEventManager = new KeyEventManager();

          this.eventStrategy = this.keyEventManager[strategyKey];

          this.eventOptions = {
            ignoreEventsCondition: Configuration.option('ignoreEventsCondition')
          };

          this.componentId = this.eventStrategy.registerKeyMap({});
          this.eventStrategy.enableHotKeys(this.componentId, {}, {}, {}, {ignoreEventsCondition: Configuration.option('ignoreEventsCondition')});
        });

        it('then the repeated events are ignored', function () {
          this.eventStrategy.handleKeydown(
            new MockSyntheticEvent('keydown', {key: 'Shift'}),
            0,
            this.componentId,
            this.eventOptions
          );

          expect(this.eventStrategy.keyCombinationHistory).to.eql([
            {
              'keys': {
                'Shift': [
                  [KeyEventRecordState.seen, KeyEventRecordState.unseen, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.seen, KeyEventRecordState.unseen]
                ]
              },
              'ids': ['Shift'],
              'keyAliases': {}
            }
          ]);

          this.eventStrategy.handleKeydown(
            new MockSyntheticEvent('keydown', {key: Key.A}),
            0,
            this.componentId,
            this.eventOptions
          );

          this.eventStrategy.handleKeypress(
            new MockSyntheticEvent('keypress', {key: Key.A}),
            0,
            this.componentId,
            this.eventOptions
          );

          this.eventStrategy.handleKeydown(
            new MockSyntheticEvent('keydown', {key: Key.A, repeat: true}),
            0,
            this.componentId,
            this.eventOptions
          );

          this.eventStrategy.handleKeypress(
            new MockSyntheticEvent('keypress', {key: Key.A, repeat: true}),
            0,
            this.componentId,
            this.eventOptions
          );

          expect(this.eventStrategy.keyCombinationHistory).to.eql([
            {
              'keys': {
                'Shift': [
                  [KeyEventRecordState.seen, KeyEventRecordState.unseen, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.seen, KeyEventRecordState.unseen]
                ],
                'a': [
                  [KeyEventRecordState.seen, KeyEventRecordState.unseen, KeyEventRecordState.unseen],
                  [KeyEventRecordState.seen, KeyEventRecordState.seen, KeyEventRecordState.unseen]
                ]
              },
              'ids': ['Shift+a', 'A+Shift'],
              'keyAliases': {
                'A': 'a'
              }
            }
          ]);
        })
      });
    });
  });
});
