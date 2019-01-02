import isUndefined from '../utils/isUndefined';

class KeyEventCounter {
  static getId() {
    if (isUndefined(this.id)){
      this.id = 0;
    }

    return this.id;
  }

  static incrementId(){
    this.id = this.getId() + 1;
  }
}

export default KeyEventCounter;
