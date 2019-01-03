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

- Offers a minimal declarative JSX and HoC APIs
- Supports React key names or [Mousetrap](https://github.com/ccampbell/mousetrap) syntax
- Allows you to define global as well as and in-focus hot keys
- Works with React's Synthetic KeyboardEvents and event delegation
- Provides predictable behaviour to anyone who is familiar with React and its render tree
- It's customizable through a simple configuration API
- Optimized for larger applications, with many hot keys active at once
- More than 1800 automated tests
- No external dependencies (other than `prop-types`)
- Uses rollup, uglifying and stripping out comments for a small production build

## Basic Usage

#### Define a key map

```javascript
import {HotKeys} from 'react-hotkeys';
import MyNode from './MyNode';

const keyMap = {
  SNAP_LEFT: 'command+left',
  DELETE_NODE: ['del', 'backspace']
};

const App = React.createClass({
  render() {
    return (
      <HotKeys keyMap={keyMap}>
        <div>
          <MyNode />
          <MyNode />
        </div>
      </HotKeys>
    );
  }
});

export default App;
```

#### Define handlers

```javascript
import {HotKeys} from 'react-hotkeys';

const MyNode = React.createClass({
  render() {
    const handlers = {
      DELETE_NODE: this.deleteNode
    };

    return (
      <HotKeys handlers={handlers}>
        Node contents
      </HotKeys>
    );
  }
});

export default MyNode;
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

## Defining key maps

`react-hotkeys` uses key maps to decouple defining keyboard shortcuts from the functions they call. This allows hot keys and handler functions to be defined and maintained independent of one another.

> When a user presses the corresponding combination or sequence of keys, it is said they *match* the hot keys, which causes an action to be *triggered*. `react-hotkeys` may then resolve an appropriate handler function to *handle* the action.

Key maps are Plain Old JavaScript Objects, where the keys are the action names and the values are usually a [Mousetrap-supported](https://craig.is/killing/mice) or [Browser Key Values](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values) sequence string (but can also be an [array](#Alternative-Hotkeys) or an [object](#Key-Combination-vs-Sequences)) that must be matched in order to trigger the action.

```javascript
const keyMap = {
  'deleteNode': 'del',
  'moveUp': 'up'
};
```

#### Key Combinations vs Sequences

Every hotkey or sequence string is parsed and treated as a sequence of key combinations. The simplest case is a sequence of 1 key combination, consisting of 1 key: e.g. `'a'` or `'shift'`.

```
// Key sequence with a combination of a single key
'4'

// Special single key sequence (ie. shift is handled automagically)
'?'

// Sequence of a single combination with multiple keys (keys must be pressed at the same time)
'command+shift+k'

// Sequence of multiple combinations (keys must be pressed and released one after another)
'up down left right'
```

#### Full Reference

Please refer to [Mousetrap's documentation](https://craig.is/killing/mice) or [Browser Key Values](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values) for an exhaustive list of supported shortcuts and sequences.

#### Alternative Hotkeys

You can specify multiple *alternative* key sequences (they will trigger the same action) using arrays:

```javascript
const keyMap = {
  DELETE_NODE: ['del', 'backspace'],
  MOVE_UP: ['up', 'w']
};
```
#### Specifying key events (keydown, keypress, keyup)

By default, `react-hotkeys` will match hotkey sequences on the `keypress` event (or, more precisely: on the `keypress` event of the last key to complete the last combination in a sequence).

If you want to trigger a single action on a different key event, you can use the object syntax and the `action` attribute to explicitly set which key event you wish to bind to:

```javascript
const keyMap = {
  CONTRACT: 'alt+down',
  COMMAND_DOWN: {sequence: 'command', action: 'keydown'},
};
```

If you want to change the default key event for all hotkeys, you can use the `defaultKeyEvent` option of the [configuration API](#Configuration).

The full list of valid key events is: `keypress`, `keydown`, and `keyup`.

#### Deciding which key map syntax to use

As a general rule, you should use the syntax that is the most brief, but still allows you to express the configuration you want.

| Question | Yes | No |
| :--- | :--- | :--- |
| **Need to define alternative key sequences to trigger the same action?** | Use an array of strings or objects. | Use a string or object. |
| **Need to explicitly define the key event to bind to (or some other additional option)?** | Use an object. | Use a string. |

## Defining Handlers

Key maps trigger actions when they match a key sequence. Handlers are the functions that `react-hotkeys` calls to handle those actions.

Handlers may be defined in the same `<HotKeys />` component as the key map:

```javascript
import {HotKeys} from 'react-hotkeys';

const keyMap = {
    MOVE_UP: 'up',
}

const handlers = {
  MOVE_UP: (event) => console.log('Move up hotkey called!')
};

<HotKeys keyMap={keyMap} handlers={handlers}>
  <input />
</HotKeys>
```

Or they may be defined in any *descendant* of the `<HotKeys />` component that defines the key map:

 ```javascript
 import {HotKeys} from 'react-hotkeys';

 const keyMap = {
     MOVE_UP: 'up',
 }

 const handlers = {
   MOVE_UP: (event) => console.log('Move up hotkey called!')
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

#### DEPRECATED: Hard Sequence Handlers

Handlers associated to actions with names that are valid key sequence strings implicitly define actions that are matched by the corresponding key sequence. This means you do not have to define the key maps in order for these handlers to "just work".

This functionality is not advised and exists mainly for backwards compatibility. It is generally advisable to explicitly define an action in a key map rather than rely on this behaviour.

```javascript
// If no named hotkey 'up' exists we assume it is a key sequence
const handlers = {
  'up': (event) => console.log('up key called')
};
```

## Resolving action handlers

Key handlers are only called under the following conditions (all must be true):

* One of the descendents of a `<HotKeys />` component that defines `handlers` is currently in focus
* Either that `<HotKeys />` component, or one of its ancestors that is a `<HotKeys />` component, defines a `keyMap` that has a sequence that matches the keys being pressed
* The `<HotKeys />` component that defines `handlers` has a handler that matches the action being triggered
* A more deeply nested `<HotKeys />` component's handler has **not** already been called

A more exhaustive enumeration of `react-hotkeys` behaviour can be found by reviewing the [test suite](/test).

### Elements must be in focus

In order for a hot key to be triggered, an element that is a descendent of the `<HotKey />` component that defines `handlers` must be in focus. It is not enough to have a descendent element of a `<HotKey />` that defines a `keyMap` in focus - it must be one that defines `handlers`. See [Managing focus in the browser](#managing-focus-in-the-browser) for more details.

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

## Configuration

## Support

Please use [Gitter](https://gitter.im/Chrisui/react-hotkeys) to ask any questions you may have regarding how to use `react-hotkeys`.

If you believe you have found a bug or have a feature request, please [open an issue](https://github.com/greena13/react-hotkeys/issues).

## Stability & Maintenance

`react-hotkeys` is considered stable and already being widely used (most notably Lystable and Whatsapp).


## Contribute, please!

If you're interested in helping out with the maintenance of `react-hotkeys`, make yourself known on [Gitter](https://gitter.im/Chrisui/react-hotkeys), [open an issue](https://github.com/greena13/react-hotkeys/issues) or create a pull request.

All contributions are welcome and greatly appreciated - from contributors of all levels of experience.

Collaboration is loosely being coordinated across [Gitter](https://gitter.im/Chrisui/react-hotkeys) and [Projects](https://github.com/greena13/react-hotkeys/projects).

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
