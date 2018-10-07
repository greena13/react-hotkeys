var webpack = require('webpack');
var pkg = require('./package.json');

var libDir = __dirname + '/lib';
var projectVar = pkg.globalExport;
var ENV = process.env.NODE_ENV;
var COMPRESS = process.env.COMPRESS;
var SOURCEMAPS = process.env.SOURCEMAPS;

var plugins = [
  new webpack.DefinePlugin({
    'process.env.NODE_ENV': JSON.stringify(ENV),
    '__VER__': JSON.stringify(pkg.version)
  })
];

if (COMPRESS) {
  plugins.push(
    new webpack.optimize.UglifyJsPlugin({
      compressor: {warnings: false}
    })
  );
}

exports = module.exports = {
  entry: './lib/index',
  output: {
    library: projectVar,
    libraryTarget: 'umd'
  },
  module: {
    loaders: [
        {test: /\.(js|jsx)$/, exclude: /node_modules/, loaders: ['babel-loader']},
        {
          test: /\.css$/,
          exclude: /node_modules/,
          loaders: ['style-loader', 'css-loader'],
        },
    ]
  },
  resolveLoader: {
    modulesDirectories: ['node_modules']
  },
  resolve: {
    extensions: ['', '.js', '.jsx'],
    modulesDirectories: ['node_modules']
  },
  plugins: plugins,
  externals: [
    {
      'react-dom': {
        root: 'ReactDOM',
        commonjs2: 'ReactDOM',
        commonjs: 'ReactDOM',
        amd: 'ReactDOM'
      }
    },
    {
      'react': {
        root: 'React',
        commonjs2: 'react',
        commonjs: 'react',
        amd: 'react'
      }
    }
  ]
};

if (SOURCEMAPS) {
  exports.devtool = 'source-map';
}
