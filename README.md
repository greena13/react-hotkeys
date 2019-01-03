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
- Supports [browser key names](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values) and [Mousetrap syntax](https://github.com/ccampbell/mousetrap)
- Allows you to define global as well as and focus-only hot keys
- Works with React's Synthetic KeyboardEvents and event delegation
- Provides predictable behaviour to anyone who is familiar with React and its render tree
- It's customizable through a simple configuration API
- Optimized for larger applications, with many hot keys active at once
- More than 1800 automated tests
- Only external dependency is `prop-types`
- Uses rollup, Uglify and strips out comments and logging for a small production build

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
/**
 * If no named 'up' action has been defined in a key map and it is a valid
 * key sequence, react-hotkeys assumes it's a hard sequence handler and
 * implicitly defines an action for it
 */

const handlers = {
  'up': (event) => console.log('up key called')
};
```

## In-focus HotKeys components

In-focus `<HotKeys />` components listen only to key events that happen when one of their DOM-mounted descendents are in focus (`<div/>`, `<span/>`, `<input/>`, etc). This emulates (and re-uses) the behaviour of the browser and React's SyntheticEvent propagation.

This is the default type of `<HotKeys />` component, and should normally be your first choice for efficiency and clarity (the user generally expects keyboard input to affect the focused element in the browser).

Each time a new element is focused, the history of the keys that have already been pressed are reset.

### How action handlers are resolved

> If one of the DOM-mounted descendents of an focus-only `<HotKeys />` component are in focus (and it is listening to key events) AND those key events match a hot key in the component's key map, then the corresponding action is triggered.

`react-hotkeys` starts at the `<HotKeys />` component closest to the event's target (the element that was in focus when the key was pressed) and works its way up through the component tree of focused `<HotKeys />` components, looking for a matching handler for the action. The handler closest to the event target AND a descendant of the `<HotKeys />` component that defines the action (or the component itself), is the one that is called.

That is:

- Unless one of the DOM-mounted descendents of a focus-only `<HotKeys />` component is in focus, the component's actions are not matched
- Unless a focus-only `<HotKeys />` component is nested within the `<HotKeys />` component that defines the action (or is the same `<HotKeys />` component), its handler is not called
- If a `<HotKeys />` component closer to the event target has defined a handler for the same action, a `<HotKeys />` component's handler won't be called (the closer component's handler will)

A more exhaustive enumeration of `react-hotkeys` behaviour can be found by reviewing the [test suite](/test).

### Managing focus in the browser

#### Focusable elements

HTML5 allows any element with a `tabindex` attribute to receive focus.

If you wish to support HTML4 you are limited to the following focusable elements:

* `<a>`
* `<area>`
* `<button>`
* `<input>`
* `<object>`
* `<select>`
* `<textarea>`


#### Tab Index

If no elements have a `tabindex` in a HTML document, the browser will tab between [focusable elements](#Focusable-elements) in the order that they appear in the DOM.

If there are elements with `tabindex` values greater than zero, they are iterated over first, according their `tabindex` value (from smallest to largest). Then the browser tabs over the focusable elements with a `0` or unspecified `tabindex` in the order that they appear in the DOM.

If any element is given a negative `tabindex`, it will be skipped when a user tabs through the document. However, a user may still click or touch on that element and it can be focused programmatically (see below).

> By default, `<HotKeys>` render its children inside an element with a `tabindex` of `-1`. You can change this by passing a `tabIndex` prop to `<HotKeys>` or you can change the default `tabindex` value for all <HotKeys>` components using the `defaultTabIndex` option for the [Configuration API](#Configuration).

#### Autofocus

HTML5 supports a boolean `autofocus` attribute on the following input elements:

* `<button>`
* `<input>`
* `<select>`
* `<textarea>`

It can be used to automatically focus parts of your React application, without the need to [programmatically manage focus](#Programmatically-manage-focus).

Only one element in the document should have this attribute at any one time (the last element to mount with the attribute will take effect).

#### Programmatically manage focus

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

#### Get the element currently in focus

You can retrieve the element that is currently focused using the following:

```javascript
document.activeElement
```

## Global HotKeys component

Global `<HotKeys>` components match key events that occur anywhere in the document (even when no part of your React application is in focus).

They are enabled with the `global` prop:

```javascript
const keyMap = { SHOW_ALL_HOTKEYS: 'shift+?' };
const handlers = { SHOW_ALL_HOTKEYS: this.showHotKeysDialog };

<HotKeys keyMap={ keyMap } handlers={ handlers } global />
```

Global `<HotKeys>` generally have no need for children, so should use a self-closing tag (as shown above).

### How actions and handlers are resolved

Regardless of where global `<HotKeys>` components appear in the render tree, they are matched with key events after the event has finished propagating through the React app (if the event originated in the React at all). This means if your React app is in focus and it handles a key event, it will be ignored by the global `<HotKeys>` components.

The order used for resolving actions and handlers amongst global `<HotKeys>` components, is the order in which they mounted. When a global `<HotKeys>` component is unmounted, it is removed from consideration. This can get somewhat less deterministic over the course of a long session using a React app, so it is best to define actions and handlers that are globally unique.

It is recommended to use focus-only `<HotKeys>` components whenever possible for better performance and reliability.

> You can use the [autofocus attributes](#Autofocus) or [programmatically manage focus](#Programmatically-manage-focus) to automatically focus your React app so the user doesn't have to select it in order for hot keys to take effect. It is common practice to place a `<HotKeys>` component towards the top of your application to match hot keys across your entire React application.

## Configuration

Default behaviour across all `<HotKeys>` components is configured using the `HotKeys.configure` method.

> HotKeys.configure() should be called as your app is initialising and before the first time you mount a `<HotKeys>` component anywhere your app.

The following options are available (**default values are shown**):

```javascript
import {HotKeys} from 'react-hotkeys';

HotKeys.configure({
  /**
   * The level of logging of its own behaviour React HotKeys should perform.
   */
  logLevel: 'warn',

  /**
   * Default key event key maps are bound to (keydown|keypress|keyup)
   */
  defaultKeyEvent: 'keypress',

  /**
   * The default component type to wrap HotKey components' children in, to provide
   * the required focus and keyboard event listening for HotKeys to function
   */
  defaultComponent: 'div',

  /**
   * The default tabIndex value passed to the wrapping component used to contain
   * HotKey components' children. -1 skips focusing the element when tabbing through
   * the DOM, but allows focusing programmatically.
   */
  defaultTabIndex: '-1',

  /**
   * The HTML tags that React HotKeys should ignore key events from. This only works
   * if you are using the default ignoreEventsCondition function.
   * @type {String[]}
   */
  ignoreTags: ['input', 'select', 'textarea'],

  /**
   * The function used to determine whether a key event should be ignored by React
   * Hotkeys. By default, keyboard events originating elements with a tag name in
   * ignoreTags, or a isContentEditable property of true, are ignored.
   *
   * @type {Function<KeyboardEvent>}
   */
  ignoreEventsCondition: function,

  /**
   * Whether React HotKeys should simulate keypress events for the keys that do not
   * natively emit them.
   * @type {Boolean}
   */
  simulateMissingKeyPressEvents: true
});
```


## Troubleshooting & Gotchas

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
