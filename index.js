'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/redux-and-the-rest.production.min.js');
} else {
  module.exports = require('./cjs/index.js');
}
