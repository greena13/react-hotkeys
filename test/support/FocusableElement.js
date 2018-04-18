import ReactDOM from 'react-dom';

let focused = null;

export default class FocusableElement {
  constructor(wrapper, selector) {
    this.element = wrapper.find(selector);
  }

  focus() {
    if (focused) {
      focused.blur();
    }

    this.element.simulate('focus');

    focused = this;
  }

  blur() {
    this.element.simulate('blur');

    if (focused === this) {
      focused = null;
    }
  }

  keyDown(key) {
    this.element.simulate('keyDown', {key});
  }

  keyPress(key) {
    this.element.simulate('keyPress', {key});
  }

  keyUp(key) {
    this.element.simulate('keyUp', {key});
  }

  isFocused() {
    return focused === this;
  }

  getInstance() {
    if (!this.instance) {
      this.instance = ReactDOM.findDOMNode(this.element.instance());
    }

    return this.instance;
  }
};
