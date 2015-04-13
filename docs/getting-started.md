Getting Started
---------------
This non-exhaustive guide will aim to get you working with the project as quickly as possible and understanding the core concepts.

## Install
```
npm install react-hotkeys
```

or use the old-skool [UMD](http://bob.yexley.net/umd-javascript-that-runs-anywhere/) packaged library found in [/build/global](build/global).

## Defining HotKey Maps
The most future-proof and flexible way of defining hotkeys is to create a 'generic hotkey name' to 'key sequence' mapping.

> Using genric names allows for the flexibility of easy customization of hotkeys later. You only need to change the map rather than all the use-cases.

This hotkey map is a simple js object.

```javascript
const keyMap = {
  'deleteNode': 'del',
  'moveUp': 'up'
};
```

You can map to multiple sequences using an array as the value.

```javascript
const keyMap: {
  'deleteNode': ['del', 'backspace'],
  'moveUp': ['up', 'w']
};
```

#### Key Sequences
Under the hood we use the brilliant Mousetrap library for binding to key sequences. To find out all the sequence patterns and supported keys (there's a lot) checkout [their documentation](https://craig.is/killing/mice)!

## Using HotKeys
Using the `HotKeys` component you can provide your newly created hotkey map and some handlers and when the component is 'in focus' the magic will happen for you!

```javascript
import {HotKeys} from 'react-hotkeys';

const handlers = {
  'deleteNode': (event) => console.log('Delete node hotkey called!'),
  'moveUp': (event) => console.log('Move up hotkey called!')
};

<HotKeys keyMap={keyMap} handlers={handlers}>
  <input />
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

## HotKey Map Context
Key mappings will be passed down the React tree in context to all child components meaning you do not have to explicitly define your key maps everytime you use the `HotKeys` component. You could simply define one root `HotKeys` component with a `keyMap` and all your application would have access to those mappings.

To achieve this currently (pre-[parent-based context](https://github.com/facebook/react/issues/2112) which is now in React `master` but awaiting `0.14` release) we must use the `HotKeyMapMixin` so that all our child components will have access to the keyMap.

```javascript
import {HotKeys, HotKeyMapMixin} from 'react-hotkeys';

React.createClass({
  mixins: [HotKeyMapMixin(keyMap)],
  render() {
    return (
      <HotKeys>
        <HotKeys handlers={handlers} />
      </HotKeys>
    )
  }
});
```

When parent-based context comes into play soon you will no longer need the mixin and all children of `HotKeys` with `keyMap` set will simply have access to those mappings in their context.

```javascript
import {HotKeys} from 'react-hotkeys';

React.createClass({
  render() {
    return (
      <HotKeys keyMap={keyMap}>
        <HotKeys handlers={handlers} />
      </HotKeys>
    )
  }
});
```

## 'In Focus'
In react-hotkeys the hotkeys handlers will only be fired when the component is considered 'in focus'. To do this we look out for the 'focus' and 'blur' events on your component.

These events **will** bubble up from child elements. So, in the above example, if the `input` element was focused by the user, the `HotKeys` component would be also be considered 'in focus'.

## HotKey Propagation
A single key sequence could be handled by "in focus" multiple components however in most use cases it does not make much sense for a parent to handle the same hotkey if a child has already dealt with it.

For this reason hotkey events will *not* propagate beyond the component which handles them by default.
