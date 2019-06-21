import removeAtIndex from '../utils/array/removeAtIndex';

class ComponentList {
  constructor() {
    /**
     * Object containing a component's defined key maps and handlers
     * @typedef {Object} ComponentOptions
     * @property {ActionDictionary} actions - Dictionary of actions the component
     *          has defined in its keymap
     * @property {HandlersMap} handlers - Dictionary of handler functions the
     *          component has defined
     * @property {ComponentId} componentId - Index of the component the options
     *          correspond with
     */

    /**
     * List of actions and handlers registered by each component currently in focus.
     * The component closest to the element in focus is last in the list.
     * @type {ComponentOptions[]}
     */
    this._list = [];

    this._idToIndex = {};
  }

  get(id) {
    return this.getAtIndex(this.getIndexById(id));
  }

  add(id, componentOptions) {
    this._list.push(componentOptions);
    const newIndex = this.getLastIndex();
    return this._idToIndex[id] = newIndex;
  }

  update(id, componentOptions) {
    this.updateAtIndex(this.getIndexById(id), componentOptions);
  }

  remove(id) {
    this.removeAtIndex(this.getIndexById(id));
  }

  getLastIndex() {
    return this.getLength() - 1;
  }

  getLength() {
    return this._list.length;
  }

  forEach(iterator) {
    this._list.forEach(iterator);
  }

  getAtIndex(index) {
    return this._list[index];
  }

  containsId(id) {
    return !!this.get(id);
  }

  getIndexById(id) {
    return this._idToIndex[id];
  }

  updateAtIndex(index, componentOptions) {
    this._list[index] = componentOptions;
  }

  removeAtIndex(index) {
    this._list = removeAtIndex(this._list, index);

    let counter = index;

    while(counter < this.getLength()) {
      this._idToIndex[this.getAtIndex(counter).componentId] = counter;
      counter++;
    }
  }

  toJSON() {
    return this._list;
  }
}

export default ComponentList;
