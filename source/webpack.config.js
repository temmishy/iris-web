const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: {
    main: './app/static/assets/js/main.js',
    dashboard: './app/static/assets/js/dashboard.main.js'
  },
  output: {
    path: path.resolve(__dirname, 'app/static/assets/dist'),
    filename: '[name].bundle.js', 
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery'
    }),
  ],
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
    ],
  },
};
