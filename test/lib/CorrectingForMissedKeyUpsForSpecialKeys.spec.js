import { expect } from 'chai';

import Key from '../support/Key';
import KeyEventManager from '../../src/lib/KeyEventManager';
import Configuration from '../../src/lib/Configuration';
import KeyEventRecordState from '../../src/const/KeyEventRecordState';
import MockSyntheticEvent from '../support/MockSyntheticEvent';

describe('Correcting for missed keyup events for modifier keys:', function () {
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
            this.eventStrategy.handleKeydown(
              new MockSyntheticEvent('keydown', {key}),
              0,
              this.componentId,
              this.eventOptions
            );

            this.eventStrategy.handleKeydown(
              new MockSyntheticEvent('keydown', {key: Key.A, [eventAttribute]: false}),
              0,
              this.componentId,
              this.eventOptions
            );

            expect(this.eventStrategy.keyCombinationHistory).to.eql([
              {
                'keys': {
                  [key]: [
                    [KeyEventRecordState.seen, KeyEventRecordState.seen, KeyEventRecordState.unseen],
                    [KeyEventRecordState.seen, KeyEventRecordState.seen, KeyEventRecordState.seen]
                  ]
                },
                'ids': [key],
                'keyAliases': {}
              },
              {
                'keys': {
                  'a': [
                    [KeyEventRecordState.unseen, KeyEventRecordState.unseen, KeyEventRecordState.unseen],
                    [KeyEventRecordState.seen, KeyEventRecordState.unseen, KeyEventRecordState.unseen]
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
