class FocusTree {
  constructor() {
    this._id = 0;
  }

  getId() {
    return this._id;
  }

  isOld(id) {
    return this._id !== id;
  }

  new() {
    this._id += 1;
  }
}

export default FocusTree;
