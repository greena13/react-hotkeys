import babel from 'rollup-plugin-babel';
import { uglify } from 'rollup-plugin-uglify';
import license from 'rollup-plugin-license';
import strip from 'rollup-plugin-strip';
import path from 'path';

/**
 * This configuration (and Rollup) is only used for the production builds
 */

export default {
  input: 'src/index.js',

  output: {
    exports: 'named',

    globals: {
      'prop-types': 'PropTypes',
      react: 'React'
    },
  },

  external: [
    'prop-types',
    'react',
    'react-dom',
  ],

  plugins: [
    babel({
      exclude: 'node_modules/**'
    }),

    strip({
      debugger: true,

      functions: [
        'console.log', 'assert.*', 'debug', 'alert',
        '*.logger.verbose', '*.logger.debug', '*.logger.info'
      ]
    }),

    process.env.BABEL_ENV === "production" && uglify(),

    license({
      banner: {
        file: path.join(__dirname, 'LICENSE')
      }
    })
  ]
};
