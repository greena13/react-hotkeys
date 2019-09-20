import simulant from 'simulant';
import lazyLoadAttribute from '../../src/utils/object/lazyLoadAttribute';

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
    this.element.simulate('keyDown', {key, ...options});

    if (this.nativeElement) {
      simulant.fire(this.nativeElement, 'keydown', {key, ...options});
    }
  }

  keyPress(key, options = {}) {
    this.element.simulate('keyPress', {key, ...options});

    if (this.nativeElement) {
      simulant.fire(this.nativeElement, 'keypress', {key, ...options});
    }
  }

  keyUp(key, options = {}) {
    this.element.simulate('keyUp', {key, ...options});

    if (this.nativeElement) {
      simulant.fire(this.nativeElement, 'keyup', {key, ...options});
    }
  }

  isFocused() {
    return focused === this;
  }

  getInstance() {
    lazyLoadAttribute(this, 'instance', () => this.element.getDOMNode());
  }
};
