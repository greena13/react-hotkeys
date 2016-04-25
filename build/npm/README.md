React HotKeys
-------------
[![Join the chat at https://gitter.im/Chrisui/react-hotkeys](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/Chrisui/react-hotkeys?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge) [![Build Status](https://travis-ci.org/Chrisui/react-hotkeys.svg)](https://travis-ci.org/Chrisui/react-hotkeys)

A declarative library for handling hotkeys and focus areas in React applications.

See [Exploring HotKeys and focus in React](http://chrispearce.co/exploring-hotkeys-and-focus-in-react/) for an introductory look into the problems we're trying to solve or if you're eager to get going check out the [Getting Started ](docs/getting-started.md) guide!

##### NOTE: The "road to v1" is set to be worked on *soon*. You can see the roadmap [here](https://github.com/Chrisui/react-hotkeys/issues/24). The current api is very solid and being used in production across a whole variety of different applications (most notably Lystable and Whatsapp). v1 will be mostly around modernising api's, improving performance and providing *additional* functionality rather than having any breaking changes.

Quick Example
-------------
```javascript
import {HotKeys} from 'react-hotkeys';

// Simple "name:key sequence/s" to create a hotkey map
const map = {
  'snapLeft': 'command+left',
  'deleteNode': ['del', 'backspace']
};

// Create a root component with the hotkey map
const App = React.createClass({
  render() {
    return (
      <HotKeys keyMap={map}>
        <div>
          <Node></Node>
          <Node></Node>
        </div>
      </HotKeys>
    );
  }
});

// Create a component with hotkey handlers - handlers only called when component is within
// the applications 'focus tree' and prevents cascading hotkeys from being called
const Node = React.createClass({
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

Feature Overview
----------------
- Minimal and declarative API
- Named hotkeys for easy customization
- Intuitive key commands thanks to [Mousetrap](https://github.com/ccampbell/mousetrap)
- Tree based priority - the deepest focused handler wins

Install
-------
```
npm install react-hotkeys
```

or use the old-skool [UMD](http://bob.yexley.net/umd-javascript-that-runs-anywhere/) packaged library found in [/build/global](build/global).

Documentation
-------------
The [Getting Started](docs/getting-started.md) guide is probably a good first point of call!

You can find full docs in the [/docs](docs) folder and generated api docs in [/docs/api](docs/api).

You may also find various examples by loading the static [/examples/index.html](examples/index.html) file.

Support
-------
See "Using GitHub Issues" under "Contribute" below for most things but feel free to jump on [Gitter](https://gitter.im/Chrisui/react-hotkeys) or give me a shout (@chrisui) in the [reactiflux Slack group](http://reactiflux.herokuapp.com/)!

Contribute
----------
Awesome! Contributions of all kinds are greatly appreciated. To help smoothen the process we have a few non-exhaustive guidelines to follow which should get you going in no time.

### Using GitHub Issues
- Feel free to use github issues for questions, bug reports, and feature requests
- Use the search feature to check for an existing issue
- Include as much information as possible and provide any relevant resources (Eg. screenshots)
- For bug reports ensure you have a reproducible test case
  - A pull request with a breaking test would be super preferable here but isn't required

### Submitting a Pull Request
- Squash commits
- Lint your code with eslint (config provided)
- Include relevant test updates/additions

##### TODO List
- Delegate hotkeys to root handler (Rather than mousetrap instance for each)
- Provide HoC API
- Write tests
- Generate API docs

Thanks
------
Thanks to @ccampbell for [Mousetrap](https://github.com/ccampbell/mousetrap)

License
-------
MIT
