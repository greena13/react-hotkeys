class ComponentOptionsListIterator {
  constructor(list) {
    this._list = list;
    this._position = -1;
  }

  getPosition() {
    return this._position;
  }

  getComponent() {
    return this._list.getAtPosition(this.getPosition());
  }

  next() {
    if (this.getPosition() + 1 < this._list.getLength()) {
      this._position++;

      return this.getComponent();
    } else {
      return null;
    }
  }
}

export default ComponentOptionsListIterator;
