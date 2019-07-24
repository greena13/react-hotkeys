import { expect } from 'chai';

import Key from '../support/Key';
import KeyEventManager from '../../src/lib/KeyEventManager';
import Configuration from '../../src/lib/config/Configuration';
import KeyEventState from '../../src/const/KeyEventState';
import MockSyntheticEvent from '../support/MockSyntheticEvent';

describe('Correcting for missed keyup events for modifier keys:', function () {
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
    context(`when the ${strategyName}`, () => {
      beforeEach(function () {
        this.keyEventManager = new KeyEventManager();

        this.eventStrategy = this.keyEventManager[strategyKey];

        this.eventOptions = {
          ignoreEventsCondition: Configuration.option('ignoreEventsCondition')
        };

        this.componentId = this.eventStrategy.registerKeyMap({});
        this.eventStrategy.enableHotKeys(this.componentId, {}, {}, {}, {ignoreEventsCondition: Configuration.option('ignoreEventsCondition')});
      });

      [
        {
          key: Key.SHIFT,
          eventAttribute: 'shiftKey'
        },
        {
          key: Key.COMMAND,
          eventAttribute: 'metaKey'
        },
        {
          key: Key.CONTROL,
          eventAttribute: 'ctrlKey'
        },
        {
          key: Key.ALT,
          eventAttribute: 'altKey'
        }
      ].forEach(({key, eventAttribute}) => {
        context(`misses the keyup event for ${key}`, () => {
          it('then its absence is correctly detected on the next key event and a new combination is created', function () {
            this.eventStrategy.handleKeyDown(
              new MockSyntheticEvent('keydown', {key}),
              0,
              this.componentId,
              this.eventOptions
            );

            this.eventStrategy.handleKeyDown(
              new MockSyntheticEvent('keydown', {key: Key.A, [eventAttribute]: false}),
              0,
              this.componentId,
              this.eventOptions
            );

            expect(this.eventStrategy.keyHistory.toJSON()).to.eql([
              {
                'keys': {
                  [key]: [
                    [KeyEventState.seen, KeyEventState.simulated, KeyEventState.unseen],
                    [KeyEventState.seen, KeyEventState.simulated, KeyEventState.seen]
                  ]
                },
                'ids': [key],
                'keyAliases': {}
              },
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
        });
      });
    });
  });
});
