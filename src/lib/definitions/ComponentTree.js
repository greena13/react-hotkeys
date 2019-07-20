import Registry from '../shared/Registry';
import without from '../../utils/collection/without';
import isUndefined from '../../utils/isUndefined';

/**
 * @typedef {Object} ComponentRegistryEntry
 * @property {ComponentId[]} childIds List of ids of the children of a component
 * @property {ComponentId|null} parentIds Id of the parent component
 */

/**
 * Registry of hot keys components, mapping children to their parents and vice versa
 * @class
 */
class ComponentTree extends Registry {
  constructor() {
    super();

    this.clearRootId();
  }

  getRootId() {
    return this._rootId;
  }

  hasRoot() {
    return !this.isRootId(null);
  }

  isRootId(componentId) {
    return componentId === this.getRootId()
  }

  clearRootId() {
    this._rootId = null;
  }

  /**
   * Register a component
   * @param {ComponentId} componentId Id of the component to register
   * @param {KeyMap} keyMap - Map of actions to key expressions
   * @returns {void}
   */
  add(componentId, keyMap) {
    super.set(componentId, {
      childIds: [],
      parentId: null,
      keyMap
    });
  }

  /**
   * Updates an existing component's key map
   * @param {ComponentId} componentId Id of the component to register
   * @param {KeyMap} keyMap - Map of actions to key expressions
   * @returns {void}
   */
  update(componentId, keyMap) {
    const component = super.get(componentId);
    super.set(componentId, {...component, keyMap});
  }

  /**
   * Set the parent ID of a component
   * @param {ComponentId} componentId Id of the component
   * @param {ComponentId} parentId Id of the parent
   * @returns {void}
   */
  setParent(componentId, parentId) {
    if (!isUndefined(parentId)) {
      this.get(componentId).parentId = parentId;
      this._addChildId(parentId, componentId);
    } else {
      this._rootId = componentId;
    }
  }

  /**
   * Deregister a component
   * @param {ComponentId} componentId Id of the component to remove
   * @returns {void}
   */
  remove(componentId) {
    const parentId = this._getParentId(componentId);

    this._removeChildId(parentId, componentId);

    super.remove(componentId);
  }

  /********************************************************************************
   * Private methods
   ********************************************************************************/

  _getParentId(componentId) {
    const component = this.get(componentId);
    return component && component.parentId;
  }

  _addChildId(parentId, componentId) {
    this.get(parentId).childIds.push(componentId);
  }

  _removeChildId(parentId, childId) {
    const parent = this.get(parentId);

    if (parent) {
      parent.childIds = without(parent.childIds, childId);
    }
  }
}

export default ComponentTree;
