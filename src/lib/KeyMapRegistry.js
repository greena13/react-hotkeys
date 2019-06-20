class KeyMapRegistry {
  constructor() {
    this._registry = {};
  }

  getKeyMap(id) {
    return this._registry[id];
  }

  addKeyMap(id, keyMap) {
    this._registry[id] = keyMap;
  }

  removeKeyMap(id) {
    delete this._registry[id];
  }

  toJSON() {
    return this._registry;
  }
}

export default KeyMapRegistry;
