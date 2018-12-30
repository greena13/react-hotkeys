import simulant from 'simulant';

let focused = null;

export default class FocusableElement {
  constructor(wrapper, selector, options = {}) {
    this.element = wrapper.find(selector);
    this.isNativeElement = options.nativeElement || false;
  }

  focus() {
    if (focused) {
      focused.blur();
    }

    if (this.isNativeElement) {
      simulant.fire(this.getInstance(), 'focus');
    } else {
      this.element.simulate('focus');
    }

    focused = this;
  }

  blur() {
    if (this.isNativeElement) {
      simulant.fire(this.getInstance(), 'blur');
    } else {
      this.element.simulate('blur');
    }

    if (focused === this) {
      focused = null;
    }
  }

  keyDown(key, options = {}) {
    if (!this.isNativeElement || options.forceEnzymeEvent) {
      this.element.simulate('keyDown', {key});
    }

    if (this.isNativeElement) {
      simulant.fire(this.getInstance(), 'keydown', {key});
    }
  }

  keyPress(key, options = {}) {
    if (!this.isNativeElement || options.forceEnzymeEvent) {
      this.element.simulate('keyPress', {key});
    }

    if (this.isNativeElement) {
      simulant.fire(this.getInstance(), 'keypress', {key});
    }
  }

  keyUp(key, options = {}) {
    if (!this.isNativeElement || options.forceEnzymeEvent) {
      this.element.simulate('keyUp', {key});
    }

    if (this.isNativeElement) {
      simulant.fire(this.getInstance(), 'keyup', {key});
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
