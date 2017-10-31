/**
 * Setup.js: Initializes the test environment and its dependencies
 *
 * This file is run once before the test suite is started.
 *
 * It should only include setup code that is applicable to the entire suite.
 *
 * For configuration options of mocha itself, see the mocha.opts file.
 */

// React testing framework for traversing React components' output
import Enzyme from 'enzyme';
import Adaptor from 'enzyme-adapter-react-14';

// Assertion library for more expressive syntax
import chai from 'chai';

// chai plugin that allows React-specific assertions for enzyme
import chaiEnzyme from 'chai-enzyme';

// chai plugin that allows assertions on function calls
import sinonChai from 'sinon-chai';

// JS implementation of DOM and HTML spec
import {JSDOM} from 'jsdom';

chai.use(chaiEnzyme());
chai.use(sinonChai);

Enzyme.configure({adapter: new Adaptor()});

const {window} = new JSDOM('<html><body></body></html>');

global.document = window.document;
global.window = window;
global.Image = window.Image;
global.navigator = window.navigator;
global.CustomEvent = window.CustomEvent;
