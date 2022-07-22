// @ts-check

const path = require('node:path')

const webpack = require('webpack')

/** @type {import('webpack').Configuration} **/
const webpackConfig = {
  devtool: 'nosources-source-map',
  entry: {
    extension: './src/extension.ts',
    'test/suite/index': './src/test/suite/index.web.ts',
  },
  externals: {
    vscode: 'commonjs vscode',
  },
  infrastructureLogging: {
    level: 'log',
  },
  mode: 'none',
  module: {
    exprContextCritical: false,
    rules: [
      {
        test: /\.ts$/,
        use: [{ loader: 'ts-loader' }],
        exclude: /node_modules/,
      },
    ],
  },
  output: {
    clean: true,
    filename: '[name].js',
    libraryTarget: 'commonjs',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [new webpack.ProvidePlugin({ process: 'process/browser' })],
  resolve: {
    extensions: ['.ts', '.js'],
    fallback: {
      assert: require.resolve('assert'),
    },
  },
  target: 'webworker',
}

module.exports = [webpackConfig]
