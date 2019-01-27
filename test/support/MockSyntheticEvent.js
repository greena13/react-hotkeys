import simulant from 'simulant';

class MockSyntheticEvent {
  constructor(keyevent, options) {
    this.nativeEvent = simulant(keyevent, options);
    this.type = keyevent;
    Object.assign(this, this.nativeEvent);
  }

  persist() {}

  stopPropagation() {
    this.nativeEvent.stopPropagation();
  }
}

export default MockSyntheticEvent;
