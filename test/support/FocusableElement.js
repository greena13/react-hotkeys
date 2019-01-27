import simulant from 'simulant';

let focused = null;

export default class FocusableElement {
  constructor(wrapper, selector, options = {}) {
    this.wrapper = wrapper;
    this.element = wrapper.find(selector);
    this.nativeElement = options.nativeElement || false;
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

  keyDown(key, options = {}) {
    this.element.simulate('keyDown', {key});

    if (this.nativeElement) {
      simulant.fire(this.nativeElement, 'keydown', {key});
    }
  }

  keyPress(key, options = {}) {
    this.element.simulate('keyPress', {key});

    if (this.nativeElement) {
      simulant.fire(this.nativeElement, 'keypress', {key});
    }
  }

  keyUp(key, options = {}) {
    this.element.simulate('keyUp', {key});

    if (this.nativeElement) {
      simulant.fire(this.nativeElement, 'keyup', {key});
    }
  }

  isFocused() {
    return focused === this;
  }

  getInstance() {
    if (!this.instance) {
      this.instance = this.element.getDOMNode();
    }

    return this.instance;
  }
};
