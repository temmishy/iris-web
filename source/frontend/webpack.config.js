const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');


module.exports = {
  entry: {
    main: './assets/js/bundles/main.js',
    dashboard: './assets/js/bundles/dashboard.main.js',
    overview: './assets/js/bundles/overview.main.js',
    datatables: './assets/js/bundles/datatables.main.js',
    // "dark-theme": './assets/css/dark-theme.css',
    "atlantis": './assets/css/atlantis.css',
    "theme": './assets/css/main.css.js',
    "case.summary": './assets/js/bundles/case.summary.main.js'
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin(),
      new CssMinimizerPlugin(),
    ],
    // splitChunks: {
    //   chunks: 'all',        
    //   cacheGroups: {
    //     vendors: {
    //         test: /[\\/]node_modules[\\/]/,
    //         priority: -10
    //     },
    //     default: {
    //         minChunks: 2,
    //         priority: -20,
    //         reuseExistingChunk: true
    //     },
    //     styles: {
    //         name: 'style',
    //         test: /\.css$/,
    //         enforce: true
    //     }
    //   }
    // }
  },
  output: {
    path: path.resolve(__dirname, '../app/static/assets/dist'),
    filename: "[name].iris.js",
    clean: true
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery'
    }),
    new MiniCssExtractPlugin({
      filename: "[name].iris.css"
    }), 
    new WebpackManifestPlugin({
      fileName: path.resolve(__dirname, '../app/static/assets/dist/manifest.json'),
      publicPath: '/static/assets/dist/',
      writeToFileEmit: true
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
