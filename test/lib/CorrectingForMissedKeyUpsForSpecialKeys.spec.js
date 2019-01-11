import {expect} from 'chai';

import Key from '../support/Key';
import KeyEventManager from '../../src/lib/KeyEventManager';
import Configuration from '../../src/lib/Configuration';
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
      ].forEach(({key, eventAttribute, expected}) => {
        context(`misses the keyup event for ${key}`, () => {
          it('then its absence is correctly detected on the next key event and a new combination is created', function() {
            this.eventStrategy.handleKeydown(new MockSyntheticEvent('keydown', {key}), 0, 0, this.eventOptions);

            this.eventStrategy.handleKeydown(new MockSyntheticEvent('keydown', { key: Key.A, [eventAttribute]: false }), 0, 0, this.eventOptions);

            expect(this.eventStrategy.keyCombinationHistory).to.eql([
              {
                "keys": {
                  [key]: [
                    [true, true, false],
                    [true, true, true]
                  ]
                },
                "ids": [ key ],
                "keyAliases": {}
              },
              {
                "keys": {
                  "a": [
                    [false, false, false],
                    [true, false, false]
                  ]
                },
                "ids": ['a'],
                "keyAliases": {}
              }
            ]);
          });
        })
      })

    });
  })
});
