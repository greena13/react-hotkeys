const path = require('path');
const HtmlWebPackPlugin = require("html-webpack-plugin");

module.exports = {
  mode: 'production',

  entry: './src/index.js',

  target: 'web',

  output: {
    path: path.resolve(__dirname, './public'),
    filename: 'bundle.js',
    libraryTarget: 'umd',
    publicPath: '/',
  },

  resolve: {
    modules: [
      "node_modules",
    ],

    alias: {
      'react-hotkeys': path.resolve(__dirname, '..')
    }
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.html$/,
        use: [
          {
            loader: "html-loader"
          }
        ]
      }
    ]
  },

  plugins: [
    new HtmlWebPackPlugin({
      template: "./src/index.html",
      filename: "./index.html"
    })
  ]
};
