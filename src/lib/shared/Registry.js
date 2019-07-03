/**
 * Generic registry for storing and retrieving items
 * @abstract
 */
class Registry {
  /**
   * Create a new Registry instance
   * @returns {Registry}
   */
  constructor() {
    this._registry = {};
  }

  /**
   * Returns the registry item stored with against an id
   * @param {*} id The key item was registered with
   * @returns {*} Item stored in registry
   */
  get(id) {
    return this._registry[id];
  }

  /**
   * Add an item to the registry
   * @param {*} id Key to store the item against
   * @param {*} item Item to store in the registry
   */
  set(id, item) {
    this._registry[id] = item;
  }

  /**
   * Remove an item from the registry
   * @param {*} id Key of the item to remove from the registry
   */
  remove(id) {
    delete this._registry[id];
  }

  /**
   * A plain JavaScript representation of the registry, useful for serialization or
   * debugging
   * @returns {Object<*,*>} Serialized representation of the registry
   */
  toJSON() {
    return this._registry;
  }
}

export default Registry;
