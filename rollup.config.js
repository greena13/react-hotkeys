import babel from 'rollup-plugin-babel';
import replace from 'rollup-plugin-replace';
import uglify from 'rollup-plugin-uglify';
import license from 'rollup-plugin-license';
import path from 'path';

export default {
  input: 'lib/index.js',

  output: {
    exports: 'named'
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

    replace({
      exclude: 'node_modules/**',
      ENV: JSON.stringify(process.env.NODE_ENV || 'development')
    }),

    (process.env.NODE_ENV === 'production' && uglify()),

    license({
      banner: {
        file: path.join(__dirname, 'LICENSE')
      }
    })
  ]
};
