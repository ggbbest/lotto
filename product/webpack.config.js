const webpack = require("webpack");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require("path");

module.exports = {
  entry: path.join(__dirname, "/src/lottery/index.js"),
  output: {
    path: path.join(__dirname, "/dist"),
    filename: "lottery.js"
  },
  module: {
    rules: [
      {
        test: /(\.jsx|\.js)$/,
        use: {
          loader: "babel-loader"
        },
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: "style-loader"
          },
          {
            loader: "css-loader"
          },
          {
            loader: "postcss-loader"
          }
        ]
      }
    ]
  },
  plugins: [
    new webpack.BannerPlugin("판권 소유, 복사는 조사해야 함"),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "/src/index.html"),
      filename: "./index.html",
      minify: {
        // 빈 속성 제거
        removeEmptyAttributes: true,
        // 압축css
        minifyCSS: true,
        // 압축JS
        minifyJS: true,
        // 공백 제거
        collapseWhitespace: true
      },
      hash: true,
      inject: true
    }),
    new CopyWebpackPlugin([
      {
        from: "./src/css",
        to: "./css"
      },
      {
        from: "./src/data",
        to: "./data"
      },
      {
        from: "./src/img",
        to: "./img"
      },
      {
        from: "./src/lib",
        to: "./lib"
      }
    ])
  ]
};
