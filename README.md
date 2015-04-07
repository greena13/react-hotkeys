React HotKeys
-------------

[![Join the chat at https://gitter.im/Chrisui/react-hotkeys](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/Chrisui/react-hotkeys?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
A declarative library for handling "hotkeysand "focus traps" within a React application.

See [Exploring HotKeys and FocusTraps in React](http://chrispearce.co/exploring-hotkeys-and-focus-in-react/) for an introductory look into the problems we're trying to solve or if you're eager to get going check out the [Getting Started ](docs/getting-started.md) guide!

#### NOTE: This project is very much still in it's very early initial experimental a development period. Don't use just yet!

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
      <HotKeys map={map}>
        <div>
          <Node></Node>
          <Node></Node>
        </WorkSpace>
      </div>
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
- `FocusTrap` component when you just want to know when something is in focus
- Tree based priority - the deepest focused handler wins

Install
-------
```
npm install react-hotkeys
```

Documentation
-------------
The [Getting Started](docs/getting-started.md) guide is probably a good first point of call!

You can find full docs in the [/docs](docs) folder and generated api docs in [/docs/api](docs/api).

Support
-------
See "Using GitHub Issues" under "Contribute" below for most things but feel free to give me a shout in the [reactiflux Slack group](http://reactiflux.herokuapp.com/)!

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

Thanks
------
Thanks to @ccampbell for [Mousetrap](https://github.com/ccampbell/mousetrap)

License
-------
MIT
