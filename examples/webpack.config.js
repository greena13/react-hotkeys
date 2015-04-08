var webpack = require('webpack');
var config = require('../webpack.config.js');

config.output = {
  publicPath: '/'
};
config.externals = undefined;
config.plugins.push(
  new webpack.NormalModuleReplacementPlugin(
    /^react-hotkeys$/,
    '../../lib/index'
  )
)

module.exports = config;
