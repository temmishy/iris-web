const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");


module.exports = {
  entry: {
    main: './app/static/assets/js/main.js',
    dashboard: './app/static/assets/js/dashboard.main.js',
    overview: './app/static/assets/js/overview.main.js',
    datatables: './app/static/assets/js/datatables.main.js',
    "dark-theme": './app/static/assets/css/dark-theme.css'
  },
  optimization: {
    minimizer: [
      new CssMinimizerPlugin(),
    ],
  },
  output: {
    path: path.resolve(__dirname, 'app/static/assets/dist'),
    filename: '[name].iris.js', 
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
