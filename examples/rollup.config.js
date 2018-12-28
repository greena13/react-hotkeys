import babel from 'rollup-plugin-babel';
import license from 'rollup-plugin-license';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import alias from 'rollup-plugin-alias';

import path from 'path';

export default {
  input: 'src/index.js',

  output: {
    file: 'public/bundle.js',
    format: 'iife',

    globals: {
      'react-dom': 'ReactDOM',
      'prop-types': 'PropTypes',
      'react': 'React'
    }
  },

  plugins: [
    alias({
      'react-hotkeys': path.join(__dirname, '../es/index.js')
    }),

    babel({
      include: 'src/**',
    }),

    resolve({
      browser: true,
    }),

    commonjs({
      namedExports: {
        '../node_modules/react/index.js': ['Component', 'PureComponent', 'Fragment', 'Children', 'createElement'],
        'node_modules/react/index.js': ['Component', 'PureComponent', 'Fragment', 'Children', 'createElement'],
        'node_modules/react-dom/index.js': ['render']
      }
    }),

    license({
      banner: {
        file: path.join(__dirname, '../LICENSE')
      }
    })
  ]
};
