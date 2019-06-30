class Registry {
  constructor() {
    this._registry = {};
  }

  get(id) {
    return this._registry[id];
  }

  set(id, item) {
    this._registry[id] = item;
  }

  remove(id) {
    delete this._registry[id];
  }

  toJSON() {
    return this._registry;
  }
}

export default Registry;
