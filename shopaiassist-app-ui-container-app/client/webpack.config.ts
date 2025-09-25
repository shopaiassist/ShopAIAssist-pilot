import { config } from 'dotenv';
import HtmlWebPackPlugin from 'html-webpack-plugin';
import path from 'path';
import TerserPlugin from 'terser-webpack-plugin';
import webpack, { ProvidePlugin } from 'webpack';

import { PUBLIC_ENV_VARS } from './tool/public-env-vars';

config({ path: '../.env' });
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const DefinePlugin = require('webpack/lib/DefinePlugin');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const deps = require('./package.json').dependencies;

const configFactoryFn = (env: object, argv: { mode: 'production' | undefined }): webpack.Configuration => {
  const isDevelopment = argv.mode !== 'production';
  
  return {
    entry: isDevelopment ? [
      'webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000',
      './src/index.ts'
    ] : './src/index.ts',
    output: {
      path: path.resolve(__dirname, 'dist'),
      publicPath: 'auto'  //process.env.PUBLIC_URL || '/',
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
      alias: {
        '@/core-styles': path.resolve(__dirname, 'node_modules/@/core-styles'),
      },
    },
    devtool: argv.mode === 'production' ? 'source-map' : 'inline-source-map',
    module: {
      rules: [
        {
          test: /\.m?js/,
          type: 'javascript/auto',
          resolve: {
            fullySpecified: false,
          },
        },
        {
          test: /\.s(a|c)ss$/,
          use: [
            'style-loader',
            {
              loader: 'css-loader',
              options: {
                sourceMap: true,
              },
            },
            'resolve-url-loader',
            {
              loader: 'sass-loader',
              options: {
                sourceMap: true,
                sassOptions: {
                  outputStyle: 'expanded',
                  includePaths: [path.resolve(__dirname, 'node_modules')],
                },
              },
            },
          ],
        },
        {
          test: /\.(ts|tsx|js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
          },
        },
        {
          include: /node_modules\/@\/core-components.*/,
          test: /\.m?js/,
          resolve: {
            fullySpecified: false, // fix:issue: https://github.com/webpack/webpack/issues/11467
          },
        },
        { test: /\.json$/, type: 'json' },
      ],
    },
    optimization: {
      minimize: argv.mode === 'production',
      minimizer: [
        new TerserPlugin({
          extractComments: /@extract/i,
        }),
      ],
    },
    plugins: [
      new ModuleFederationPlugin({
        name: 'olympus_main',
        filename: 'remoteEntry.js',
        remotes: {
          assistantMfe: 'assistantMfe@http://localhost:5002/remoteEntry.js',
        },
        exposes: {},
        shared: {
          ...deps,
          'deep-object-diff': {
            eager: true,
            singleton: true,
            version: deps['deep-object-diff'],
          },
          react: {
            eager: true,
            singleton: true,
            requiredVersion: deps.react,
          },
          'react-dom': {
            eager: true,
            singleton: true,
            requiredVersion: deps['react-dom'],
          },
          'react-redux': {
            eager: true,
            singleton: true,
            requiredVersion: deps['react-redux'],
          },
          'react-router-dom': {
            eager: true,
            singleton: true,
            requiredVersion: deps['react-router-dom'],
          },
          'regenerator-runtime': {
            eager: true,
            singleton: true,
          },
          'zone.js': {
            eager: true,
            singleton: true,
          },
        },
      }),
      new HtmlWebPackPlugin({
        template: './public/index.html',
        templateParameters: {
          PUBLIC_URL: '.',
          ONETRUST_DOMAIN_ID: process.env.ONETRUST_DOMAIN_ID || '',
        },
      }),
      new DefinePlugin(
        // Define the environment variables that will be available in the client code, as listed in `PUBLIC_ENV_VARS`.
        PUBLIC_ENV_VARS.reduce(
          (acc, curr) => {
            acc[`process.env.${curr}`] = JSON.stringify(process.env[curr] || '');
            return acc;
          },
          {} as Record<string, string>
        )
      ),
      new ProvidePlugin({
        // automatically import react where needed
        React: 'react',
      }),
      // Add HMR plugin for development
      ...(isDevelopment ? [new webpack.HotModuleReplacementPlugin()] : []),
    ],
  };
};

export default configFactoryFn;
