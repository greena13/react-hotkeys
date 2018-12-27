import KeyEventBitmapManager from '../KeyEventBitmapManager';
import KeyEventBitmapIndex from '../../const/KeyEventBitmapIndex';
import AbstractKeyEventStrategy from './AbstractKeyEventStrategy';
import capitalize from '../../utils/string/capitalize';
import normalizeKeyName from '../normalizeKeyName';
import hasKeyPressEvent from '../hasKeyPressEvent';
import KeyEventCounter from '../KeyEventCounter';

class GlobalKeyEventStrategy extends AbstractKeyEventStrategy {
  /**
   * Creates a new KeyEventManager instance. It is expected that only a single instance
   * will be used with a render tree.
   */
  constructor(configuration = {}, keyEventManager) {
    super(configuration);

    this.handlerCounts = {
      [KeyEventBitmapIndex.keydown]: 0,
      [KeyEventBitmapIndex.keypress]: 0,
      [KeyEventBitmapIndex.keyup]: 0
    };

    this.keyEventManager = keyEventManager;
  }

  addHotKeys(actionNameToKeyMap = {}, actionNameToHandlersMap = {}, options) {
    const keyMapEventBitmap = KeyEventBitmapManager.newBitmap();

    this._addComponentToList(
      actionNameToKeyMap,
      actionNameToHandlersMap,
      {
        ...options,
        keyMapEventBitmap
      }
    );

    this._updateGlobalHandlerCounts(
      KeyEventBitmapManager.newBitmap(),
      keyMapEventBitmap
    );

    this.logger.debug(
      `Global component ${this.componentIndex} registered. \nKey maps: `,
      actionNameToKeyMap,
      '\nHandlers: ',
      actionNameToHandlersMap
    );

    return this.componentIndex;
  }

  updateHotKeys(componentIndex, actionNameToKeyMap = {}, actionNameToHandlersMap = {}, options) {
    this.componentList = this.componentList.map((componentOptions) => {
      if (componentOptions.componentIndex === componentIndex) {
        const { keyMapEventBitmap } = componentOptions;

        const beforeKeyMapEventBitmap =
          KeyEventBitmapManager.clone(keyMapEventBitmap);

        const newComponentOptions = this._buildComponentOptions(
          componentIndex,
          actionNameToKeyMap,
          actionNameToHandlersMap,
          {
            ...options,
            keyMapEventBitmap
          }
        );

        this._updateGlobalHandlerCounts(beforeKeyMapEventBitmap, keyMapEventBitmap);

        this.logger.debug(
          `Global component ${componentIndex} updated. \nKey maps: `,
          actionNameToKeyMap,
          '\nHandlers: ',
          actionNameToHandlersMap
        );

        return newComponentOptions;
      } else {
        return componentOptions;
      }
    });
  }

  removeHotKeys(componentIndex) {
    let keyMapEventBitmap = null;

    this.componentList = this.componentList.reduce((memo, componentOptions) => {
      if (componentOptions.componentIndex === componentIndex) {
        keyMapEventBitmap = componentOptions.keyMapEventBitmap;

        return memo;
      } else {
        return memo.concat(componentOptions);
      }
    }, []);

    this._updateGlobalHandlerCounts(keyMapEventBitmap, KeyEventBitmapManager.newBitmap());
  }

  _updateGlobalHandlerCounts(eventBitmapBefore, eventBitmapAfter){
    Object.keys(this.handlerCounts).forEach((bitmapIndex) => {
      const handlerCountBefore = this.handlerCounts[bitmapIndex];

      if (eventBitmapBefore[bitmapIndex]) {
        if (!eventBitmapAfter[bitmapIndex]) {
          /**
           * A handler for the specified key event has been removed, so we
           * decrement the counter
           */
          this.handlerCounts[bitmapIndex] -= 1;
        }
      } else {
        if (eventBitmapAfter[bitmapIndex]) {
          /**
           * A handler for the specified key event has been added, so we
           * increment the counter
           */
          this.handlerCounts[bitmapIndex] += 1;
        }
      }

      const handlerCountAfter = this.handlerCounts[bitmapIndex];

      if (handlerCountBefore === 0 && handlerCountAfter === 1) {
        /**
         * We've just added our first global handler for the specified key event
         * so we need to add the event listener to document
         */

        const eventName = this.constructor._describeKeyEvent(bitmapIndex);

        document[`on${eventName}`] = (keyEvent) => {
          this.keyEventManager[`handleGlobal${capitalize(eventName)}`](keyEvent);
        };

        this.logger.debug(`Bound handler handleGlobal${capitalize(eventName)}() to document.on${eventName}()`);

      } else if (handlerCountBefore === 1 && handlerCountAfter === 0) {
        /**
         * We've just removed our last global handler for the specified key event
         * so we need to remove the event listener from document
         */

        const eventName = this.constructor._describeKeyEvent(bitmapIndex);

        delete document[`on${eventName}`];
      }
    });
  }

  handleKeydown(event, options) {
    const _key = normalizeKeyName(event.key);

    const reactAppHistoryWithEvent =
      this.keyEventManager.reactAppHistoryWithEvent(_key, KeyEventBitmapIndex.keydown);

    if (reactAppHistoryWithEvent === 'handled') {
      this.logger.debug(`${this._logPrefix()} Ignored '${_key}' keydown event because React app has already handled it.`);

      return false;
    } else {
      if (reactAppHistoryWithEvent === 'seen') {
        this.logger.debug(`${this._logPrefix()} '${_key}' keydown event (that has already passed through React app).`);

      } else {
        KeyEventCounter.incrementId();

        this.logger.debug(`${this._logPrefix()} New '${_key}' keydown event (that has NOT passed through React app).`);
      }

      if (options.ignoreEventsCondition(event)) {
        this.logger.debug(`${this._logPrefix()} Ignored '${_key}' keydown event because ignoreEventsFilter rejected it.`);

        return false;
      }

      const keyInCurrentCombination = !!this._getCurrentKeyCombination().keys[_key];

      if (keyInCurrentCombination || this.keyCombinationIncludesKeyUp) {
        this.logger.debug(`${this._logPrefix()} Started a new combination with '${_key}'.`);

        this._startNewKeyCombination(_key, KeyEventBitmapIndex.keydown);
      } else {
        this._addToCurrentKeyCombination(_key, KeyEventBitmapIndex.keydown);

        this.logger.debug(`${this._logPrefix()} Added '${_key}' to current combination: ${this._getCurrentKeyCombination().ids[0]}.`);
      }

      this._callHandlerIfActionNotHandled(event, _key, KeyEventBitmapIndex.keydown);

      if (!hasKeyPressEvent(_key)) {
        this.logger.debug(`${this._logPrefix()} Simulating '${_key}' keypress event because '${_key}' doesn't natively have one.`);

        /**
         * If a key does not have a keypress event, we simulate one immediately after
         * the keydown event, to keep the behaviour consistent across all keys
         */
        this.handleKeypress(event, options);
      }

      return false;
    }
  }

  handleKeypress(event, options) {
    const _key = normalizeKeyName(event.key);

    const reactAppHistoryWithEvent =
      this.keyEventManager.reactAppHistoryWithEvent(_key, KeyEventBitmapIndex.keypress);

    if (reactAppHistoryWithEvent === 'handled') {
      this.logger.debug(`${this._logPrefix()} Ignored '${_key}' keypress event because React app has already handled it.`);

      return false;
    } else {
      if (reactAppHistoryWithEvent === 'seen') {
        this.logger.debug(`${this._logPrefix()} '${_key}' keypress event (that has already passed through React app).`);

      } else {
        KeyEventCounter.incrementId();

        this.logger.debug(`${this._logPrefix()} New '${_key}' keypress event (that has NOT passed through React app).`);
      }

      if (options.ignoreEventsCondition(event)) {
        this.logger.debug(`${this._logPrefix()} Ignored '${_key}' keypress event because ignoreEventsFilter rejected it.`);

        return false;
      }

      /**
       * Add new key event to key combination history
       */

      const keyCombination = this._getCurrentKeyCombination().keys[_key];

      const alreadySeenKeyInCurrentCombo =
        keyCombination && (keyCombination[KeyEventBitmapIndex.current][KeyEventBitmapIndex.keypress] || keyCombination[KeyEventBitmapIndex.current][KeyEventBitmapIndex.keyup]);

      if (alreadySeenKeyInCurrentCombo) {
        this._startNewKeyCombination(_key, KeyEventBitmapIndex.keypress)
      } else {
        this._addToCurrentKeyCombination(_key, KeyEventBitmapIndex.keypress);
      }

      this._callHandlerIfActionNotHandled(event, _key, KeyEventBitmapIndex.keypress);
    }
  }

  handleKeyup(event, options) {
    const _key = normalizeKeyName(event.key);

    const reactAppHistoryWithEvent =
      this.keyEventManager.reactAppHistoryWithEvent(_key, KeyEventBitmapIndex.keyup);

    if (reactAppHistoryWithEvent === 'handled') {
      this.logger.debug(`${this._logPrefix()} Ignored '${_key}' keyup event because React app has already handled it.`);

      return false;
    } else {
      if (reactAppHistoryWithEvent === 'seen') {
        this.logger.debug(`${this._logPrefix()} '${_key}' keyup event (that has already passed through React app).`);

      } else {
        KeyEventCounter.incrementId();

        this.logger.debug(`${this._logPrefix()} New '${_key}' keyup event (that has NOT passed through React app).`);
      }

      if (options.ignoreEventsCondition(event)) {
        this.logger.debug(`${this._logPrefix()} Ignored '${_key}' keyup event because ignoreEventsFilter rejected it.`);

        return false;
      }

      const keyCombination = this._getCurrentKeyCombination().keys[_key];

      const alreadySeenKeyInCurrentCombo = keyCombination && keyCombination[KeyEventBitmapIndex.current][KeyEventBitmapIndex.keyup];

      if (alreadySeenKeyInCurrentCombo) {
        this.logger.debug(`${this._logPrefix()} Started a new combination with '${_key}'.`);

        this._startNewKeyCombination(_key, KeyEventBitmapIndex.keyup);
      } else {
        this._addToCurrentKeyCombination(_key, KeyEventBitmapIndex.keyup);

        this.logger.debug(`${this._logPrefix()} Added '${_key}' to current combination: '${this._describeCurrentKeyCombination()}'.`);

        this.keyCombinationIncludesKeyUp = true;
      }

      this._callHandlerIfActionNotHandled(event, _key, KeyEventBitmapIndex.keyup);
    }
  }

  _callHandlerIfActionNotHandled(event, keyName, eventBitmapIndex) {
    const eventName = this.constructor._describeKeyEvent(eventBitmapIndex);
    const combinationName = this._describeCurrentKeyCombination();

    if (this.handlerCounts[eventBitmapIndex]) {
      /**
       * If there is at least one handler for the specified key event type (keydown,
       * keypress, keyup), then attempt to find a handler that matches the current
       * key combination
       */
      this.logger.verbose(`${this._logPrefix()} Attempting to find action matching '${combinationName}' ${eventName} . . .`);

      const lastComponentIndex = this.componentList.length - 1;

      this._callMatchingHandlerClosestToEventTarget(
        event,
        keyName,
        eventBitmapIndex,
        lastComponentIndex
      );
    } else {
      /**
       * If there are no handlers registered for the particular key event type
       * (keydown, keypress, keyup) then skip trying to find a matching handler
       * for the current key combination
       */
      this.logger.verbose(`${this._logPrefix()} Ignored '${combinationName}' ${eventName} because it doesn't have any ${eventName} handlers.`);
    }
  }

  _logPrefix() {
    const eventIcons = this.constructor.eventIcons;
    const componentIcons = this.constructor.componentIcons;

    return `HotKeys (GLOBAL-E${KeyEventCounter.getId()}${eventIcons[KeyEventCounter.getId() % eventIcons.length]}):`;
  }
}

export default GlobalKeyEventStrategy;
