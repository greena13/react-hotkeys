<p align="center">
  <img src="http://svgshare.com/i/3tk.svg"><br/>
  <h2 align="center">React HotKeys</h2>
</p>

[![npm](https://img.shields.io/npm/dm/react-hotkeys.svg)]()
[![Build Status](https://travis-ci.org/greena13/react-hotkeys.svg)](https://travis-ci.org/greena13/react-hotkeys)
[![GitHub license](https://img.shields.io/github/license/greena13/react-hotkeys.svg)](https://github.com/greena13/react-hotkeys/blob/master/LICENSE)
[![Gitter](https://img.shields.io/gitter/room/chrisui/react-hotkeys.svg)](https://gitter.im/chrisui/react-hotkeys)

A declarative library for handling hotkeys and focus areas in React applications.

## Feature Overview

- Minimal and declarative API
- Named hotkeys for easy customization
- Intuitive key commands thanks to [Mousetrap](https://github.com/ccampbell/mousetrap)
- Tree based priority - the deepest focused handler wins
- Easy-to-use [HOC](https://github.com/greena13/react-hotkeys/blob/master/lib/withHotKeys.js) available.

## Usage

#### Key map

```javascript
import {HotKeys} from 'react-hotkeys';

// Simple "name:key sequence/s" to create a hotkey map

const map = {
  'snapLeft': 'command+left',
  'deleteNode': ['del', 'backspace']
};

// Component with a key map

const App = React.createClass({
  render() {
    return (
      <HotKeys keyMap={map}>
        <div>
          <MyNode></MyNode>
          <MyNode></MyNode>
        </div>
      </HotKeys>
    );
  }
});
```

#### Handlers

```javascript
import {HotKeys} from 'react-hotkeys';

/**
 * Component with hotkey handlers, which are only called when the component
 * is within the application's 'focus tree' and prevents cascading hotkeys from
 * being called
 */

const MyNode = React.createClass({
  render() {
    const handlers = {
      'deleteNode': this.deleteNode
    };

    return (
      <HotKeys handlers={handlers}>
        Node contents
      </HotKeys>
    );
  }
});
```

## Install

### CommonJS & ES6 Modules

`react-hotkeys` is available as a CommonJS or a ES6 Modules through npm or yarn. It uses `NODE_ENV` to determine whether to export the development or production build in your library or application.

It is expected you will use a bundling tool like Webpack or Uglify to remove the version of the bundle you are not using with each version of your application's code, to keep the library size to a minimum.

#### npm

```
npm install react-hotkeys --save
```

#### yarn

```
yarn add react-hotkeys
```

### UMD

`react-hotkeys` as a UMD module is available on your CDN of choice.

Change `1.0.1` for the version that you would like to use.

#### Development build

```
<script crossorigin src="https://cdn.jsdelivr.net/npm/react-hotkeys@1.0.1/umd/react-hotkeys.js"></script>
```

```
<script crossorigin src="https://unpkg.com/react-hotkeys@1.0.1/umd/react-hotkeys.js"></script>
```

#### Minified production build

```
<script crossorigin src="https://cdn.jsdelivr.net/npm/react-hotkeys@1.0.1/umd/react-hotkeys.min.js"></script>
```

```
<script crossorigin src="https://unpkg.com/react-hotkeys@1.0.1/umd/react-hotkeys.min.js"></script>
```

### Bower

Bower support was removed in `v1.0.0`, but those who already rely on earlier versions of `react-hotkeys` through Bower can continue to do so using the following command:

```
bower install react-hotkeys@0.10.0
```

The Bower version of the package will **not** be supported going forward (including fixing any outstanding issues).
## Defining Hot Keys

`react-hotkeys` uses key maps to separate defining keyboard shortcuts from the actions that they trigger. This allows adding or changing hot keys in the future, without having to also update the actions in many places across your application.

Hotkey maps are simple JavaScript objects, where the keys are the names of the actions triggered and the values are a [Mousetrap-supported key sequence](https://craig.is/killing/mice) that must be activated in order to trigger the action.

```javascript
const keyMap = {
  'deleteNode': 'del',
  'moveUp': 'up'
};
```

#### Alternative Hotkeys

You can specify multiple keys that will trigger the same action using arrays:

```javascript
const keyMap = {
  'deleteNode': ['del', 'backspace'],
  'moveUp': ['up', 'w']
};
```

#### Key Combinations & Sequences

```
// Single key sequence
'4'

// Special single key sequence (ie. shift is handled automagically)
'?'

// Combination sequence
'command+shift+k'

// GMail style sequences
'up down left right'
```

#### Binding to Special Keys

Modifier keys: `shift`, `ctrl`, `alt`/`option`, `command`/`meta`

Special keys: `backspace`, `tab`, `enter`, `return`, `capslock`, `esc`, `escape`, `space`, `pageup`, `pagedown`, `end`, `home`, `left`, `up`, `right`, `down`, `ins`, `del`, and `plus`

#### Full Reference

Refer to [Mousetrap's documentation](https://craig.is/killing/mice) for an exhaustive list of supported shortcuts and sequences.

#### Specifying Key Event

`react-hotkeys` tries to automatically determine the best key event (usually `keypress`) to monitor based on the key sequence provided.

The object syntax and `action` attribute lets you explicitly set which key event you wish to bind to:

```javascript
const keyMap = {
  'contract': 'alt+down',
  'commandDown': {sequence: 'command', action: 'keydown'},
};
```

The full list of valid key events is: `keypress`, `keydown`, and `keyup`.

## Defining Handlers

Key maps trigger named actions when matching keys are pressed - but do not define any behaviour. Handlers are the functions called to handle when a matching action is triggered and define how your application should respond.

Handlers may be defined in the same `<HotKeys />` component as the key map:

```javascript
import {HotKeys} from 'react-hotkeys';

const keyMap = {
    moveUp: 'up',
}

const handlers = {
  'moveUp': (event) => console.log('Move up hotkey called!')
};

<HotKeys keyMap={keyMap} handlers={handlers}>
  <input />
</HotKeys>
```

Or in any descendant of the `<HotKeys />` component that defines the key map:


 ```javascript
 import {HotKeys} from 'react-hotkeys';

 const keyMap = {
     moveUp: 'up',
 }

 const handlers = {
   'moveUp': (event) => console.log('Move up hotkey called!')
 };

 <HotKeys keyMap={keyMap}>
   <div>
    <HotKeys handlers={handlers}>
      <input />
    </HotKeys>
   </div>

   <div>
    <input />
   </div>
 </HotKeys>
 ```

#### Hard Sequence Handlers

You can also explicitly define sequences as handlers in case you want a *hard*-override.

```javascript
// If no named hotkey 'up' exists we assume it is a key sequence
const handlers = {
  'up': (event) => console.log('up key called')
};
```


## Triggering Hot Keys

Key handlers are only called under the following conditions (all must be true):

* One of the descendents of a `<HotKeys />` component that defines `handlers` is currently in focus (or the [focused prop](#simulating-an-elements-focus) is true)
* Either that `<HotKeys />` component, or one of its ancestors that is a `<HotKeys />` component, defines a `keyMap` that has a sequence that matches the keys being pressed
* The `<HotKeys />` component that defines `handlers` has a handler that matches the action being triggered
* A more deeply nested `<HotKeys />` component's handler has **not** already been called

A more exhaustive enumration of `react-hotkeys` behaviour can be found by reviewing the [test suite](/test).

### Elements must be in focus

In order for a hot key to be triggered, an element that is a descendent of the `<HotKey />` component that defines `handlers` must be in focus. It is not enough to have a descendent element of a `<HotKey />` that defines a `keyMap` in focus - it must be one that defines `handlers`. See [Managing focus in the browser](#Managing-focus-in-the-browser) for more details.

### Simulating an element's focus

You can cause a `<HotKey />` with a `handlers` prop to behave as if one of its descendents is currently focused (and call any matching handlers) using the `focused` prop:

```javasript
<HotKeys keyMap={this.keyMap} handlers={this.handlers} focused>
  <input />
</HotKeys>
```

### Hot Key Action Propagation

Actions start at the `<HotKeys />` component that is the the closest ancestor to the element in focus and only propagate until they are handled the first time: handlers in parent `<HotKeys />` components will **not** be called if a child has already handled it.

## Managing focus in the browser

### Focusable elements

If you wish to support HTML4 you are limited to the following focusable elements:

* `<a>`
* `<area>`
* `<button>`
* `<input>`
* `<object>`
* `<select>`
* `<textarea>`


HTML5 allows any element with a `tabindex` attribute to receive focus.

### Tab order

If no elements have a `tabindex` in a HTML document, the browser will tab between [focusable elements](#Focusable-elements) in the order that they appear in the DOM.

If there are elements with `tabindex` values greater than zero, they are iterated over first, according their `tabindex` value (from smallest to largest). Then the browser tabs over the focusable elements with a `0` or unspecified `tabindex` in the order that they appear in the DOM.

If any element is given a negative `tabindex`, it will be skipped when a user tabs through the document. However, a user may still click or touch on that element and it can be focused programmatically (see below). By default, `<Shortcuts>` elements are given a `tabindex` of `-1`.

### Programmatically manage focus

To programmatically focus a DOM element, it must meet two requirements:

* It must be a [focusable elements](#Focusable-element)
* You must have a reference to it

You can get a reference to an element using React's `ref` property:


```javascript
class MyComponent extends Component {

    componentDidUpdate(prevProps) {

        if(!prevProps.isFocused && this.props.isFocused) {
            this._container.focus();
        }

    }

    render() {
        return (
            <div ref={ (c) => this._container = c } >
                My focusable content
            </div>
        )
    }

}
```

### Get the element currently in focus

You can retrieve the element that is currently focused using the following:

```javascript
document.activeElement
```

## Troubleshooting & Gotchas

### Not compatible with lodash-webpack-plugin

There is [some suggestion](https://github.com/greena13/react-hotkeys/issues/46) that `react-hotkeys` is not compatible with `lodash-webpack-plugin`. If you are experiencing issues where none of your handlers are being called and are using this webpack plugin, please try disabling it.

### Blue border appears around children of HotKeys

`react-hotkeys` adds a `<div />` around its children with a `tabindex="-1"` to allow them to be programmatically focused. This can result in browsers rendering a blue outline around them to visually indicate that they are the elements in the document that is currently in focus.

This can be disabled using CSS similar to the following:

```css
div[tabindex="-1"]:focus {
    outline: 0;
}
```

## Support

Please use [Gitter](https://gitter.im/Chrisui/react-hotkeys) to ask any questions you may have regarding how to use `react-hotkeys`.

If you believe you have found a bug or have a feature request, please [open an issue](https://github.com/greena13/react-hotkeys/issues).

## Stability & Maintenance

`react-hotkeys` is considered stable and already being widely used (most notably Lystable and Whatsapp).

It has a non-comprehensive test suite. [![Build Status](https://travis-ci.org/greena13/react-hotkeys.svg)](https://travis-ci.org/greena13/react-hotkeys)

In November 2017, responsibility for maintaining `react-hotkeys` has changed hands. The new group of contributors will be working towards improving performance and providing *additional* functionality rather than having any breaking changes.


## Contribute, please!

If you're interested in helping out with the maintenance of `react-hotkeys`, make yourself known on [Gitter](https://gitter.im/Chrisui/react-hotkeys), [open an issue](https://github.com/greena13/react-hotkeys/issues) or create a pull request.

All contributions are welcome and greatly appreciated - from contributors of all levels of experience.

Collaboration is loosely being coordinated across [Gitter](https://gitter.im/Chrisui/react-hotkeys) and [Projects](https://github.com/greena13/react-hotkeys/projects).

### Roadmap

The product roadmap is being currently being tracked in [Projects](https://github.com/greena13/react-hotkeys/projects), but is largely focused on improving performance, code quality and adding extra features to meet common requirements.

### Using GitHub Issues

* Use the search feature to check for an existing issue
* Include as much information as possible and provide any relevant resources (Eg. screenshots)
* For bug reports ensure you have a reproducible test case
    * A pull request with a breaking test would be super preferable here but isn't required

### Submitting a Pull Request

- Squash commits
- Lint your code with eslint (config provided)
- Include relevant test updates/additions

## Authorship

All credit, and many thanks, goes to [Chris Pearce](https://github.com/Chrisui) for the inception of `react-hotkeys` and all versions before `1.0.0`.

As of version `1.0.0`, [Aleck Greenham](https://github.com/greena13) is actively maintaining `react-hotkeys`. Please be patient while he gets up to speed.

## Thanks

Thanks to @ccampbell for [Mousetrap](https://github.com/ccampbell/mousetrap)
