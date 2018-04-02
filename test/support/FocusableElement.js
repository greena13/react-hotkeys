import ReactDOM from 'react-dom';

export default class FocusableElement {
  constructor(wrapper, selector) {
    this.element = wrapper.find(selector);
  }

  focus() {
    this.element.simulate('focus');
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

  getInstance() {
    if (!this.instance) {
      this.instance = ReactDOM.findDOMNode(this.element.instance());
    }

    return this.instance;
  }
};
