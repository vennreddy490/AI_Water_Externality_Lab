import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import path from 'path';

export default {
  mode: 'production',
  entry: {
    contentScript: './src/content/index.js',
    background: './src/background/index.js',
    react: './src/react/index.jsx'
  },
  output: {
    path: path.resolve('dist'),
    filename: '[name].js',
    clean: true
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html'
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve('manifest.json'),
          to: path.resolve('dist'),
        }, 
        {
          from: path.resolve('./assets'), // Assuming 'assets' is under 'src'
          to: path.resolve('dist/assets'), // Copy assets to the dist folder
          noErrorOnMissing: true 
        }
        // from: path.resolve('./assets'), // Assuming 'assets' is under 'src'
        // to: path.resolve('dist/assets'), // Copy assets to the dist folder
        // noErrorOnMissing: true 
      ]
    })
  ],
  module: {
    rules: [
      {
        test: /.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              ['@babel/preset-react', {'runtime': 'automatic'}]
            ]
          }
        }
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  }
};