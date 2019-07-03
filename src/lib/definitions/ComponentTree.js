import Registry from '../shared/Registry';
import without from '../../utils/collection/without';

/**
 * @typedef {Object} ComponentRegistryEntry
 * @property {ComponentId[]} childIds List of ids of the children of a component
 * @property {ComponentId|null} parentIds Id of the parent component
 */

/**
 * Registry of hot keys components, mapping children to their parents and vice versa
 */
class ComponentTree extends Registry {
  /**
   * Register a component
   * @param {ComponentId} componentId Id of the component to register
   */
  add(componentId) {
    super.set(componentId, {
      childIds: [],
      parentId: null
    });
  }

  /**
   * Set the parent ID of a component
   * @param {ComponentId} componentId Id of the component
   * @param {ComponentId} parentId Id of the parent
   */
  setParent(componentId, parentId) {
    this.get(componentId).parentId = parentId;
    this._addChildId(parentId, componentId);
  }

  /**
   * Deregister a component
   * @param {ComponentId} componentId Id of the component to remove
   */
  remove(componentId) {
    const parentId = this._getParentId(componentId);

    this._removeChildId(parentId, componentId);

    super.remove(componentId);
  }

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
