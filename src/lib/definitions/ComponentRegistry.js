import Registry from '../shared/Registry';
import without from '../../utils/collection/without';

class ComponentRegistry extends Registry {
  add(componentId) {
    super.set(componentId, newComponentRegistryItem());
  }

  getParent(componentId) {
    const parentId = this.getParentId(componentId);

    return parentId && this.get(parentId);
  }

  setParent(componentId, parentId) {
    this.get(componentId).parentId = parentId;
    this._addChildId(parentId, componentId);
  }

  getParentId(componentId) {
    const component = this.get(componentId);
    return component && component.parentId;
  }

  remove(componentId) {
    const parentId = this.getParentId(componentId);

    this._removeChildId(parentId, componentId);

    super.remove(componentId);
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

function newComponentRegistryItem() {
  return {
    childIds: [],
    parentId: null
  };
}

export default ComponentRegistry;
