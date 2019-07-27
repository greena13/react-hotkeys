import { expect } from 'chai';

import Key from '../support/Key';
import KeyEventManager from '../../src/lib/KeyEventManager';
import Configuration from '../../src/lib/config/Configuration';
import KeyEventState from '../../src/const/KeyEventState';
import MockSyntheticEvent from '../support/MockSyntheticEvent';

describe('Ignoring repeated events:', function () {
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
          this.eventStrategy.handleKeyDown(
            new MockSyntheticEvent('keydown', {key: 'Shift'}),
            0,
            this.componentId,
            this.eventOptions
          );

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              'keys': {
                'Shift': [
                  [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen]
                ]
              },
              'ids': ['Shift'],
              'keyAliases': {}
            }
          ]);

          this.eventStrategy.handleKeyDown(
            new MockSyntheticEvent('keydown', {key: Key.A}),
            0,
            this.componentId,
            this.eventOptions
          );

          this.eventStrategy.handleKeyPress(
            new MockSyntheticEvent('keypress', {key: Key.A}),
            0,
            this.componentId,
            this.eventOptions
          );

          this.eventStrategy.handleKeyDown(
            new MockSyntheticEvent('keydown', {key: Key.A, repeat: true}),
            0,
            this.componentId,
            this.eventOptions
          );

          this.eventStrategy.handleKeyPress(
            new MockSyntheticEvent('keypress', {key: Key.A, repeat: true}),
            0,
            this.componentId,
            this.eventOptions
          );

          expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
            {
              'keys': {
                'Shift': [
                  [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen]
                ],
                'a': [
                  [KeyEventState.seen, KeyEventState.unseen, KeyEventState.unseen],
                  [KeyEventState.seen, KeyEventState.seen, KeyEventState.unseen]
                ]
              },
              'ids': ['Shift+A', 'Shift+a'],
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
