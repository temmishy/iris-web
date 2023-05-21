const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");


module.exports = {
  entry: {
    main: './app/static/assets/js/bundles/main.js',
    dashboard: './app/static/assets/js/bundles/dashboard.main.js',
    overview: './app/static/assets/js/bundles/overview.main.js',
    datatables: './app/static/assets/js/bundles/datatables.main.js',
    "dark-theme": './app/static/assets/css/dark-theme.css', 
    "case.summary": './app/static/assets/js/bundles/case.summary.main.js'
  },
  optimization: {
    minimizer: [
      new CssMinimizerPlugin(),
    ],
  },
  output: {
    path: path.resolve(__dirname, 'app/static/assets/dist'),
    filename: '[name].iris.js'
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery'
    }),
    new MiniCssExtractPlugin({
      filename: "[name].iris.css",
    })
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
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader, 
          'css-loader'
        ]
      }
    ],
  },
};
