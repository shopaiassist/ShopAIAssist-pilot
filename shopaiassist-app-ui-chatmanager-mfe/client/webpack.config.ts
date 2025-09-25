import { config } from 'dotenv';
import HtmlWebPackPlugin from 'html-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import path from 'path';
import { Configuration as WebpackConfiguration, ProvidePlugin } from 'webpack';
import { Configuration as WebpackDevServerConfiguration } from 'webpack-dev-server';
import cors from 'cors';
import { getCorsOrigin } from './tool/cors-util';
import { PUBLIC_ENV_VARS } from './tool/public-env-vars';

config({ path: '../.env' });
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const DefinePlugin = require('webpack/lib/DefinePlugin');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const deps = require('./package.json').dependencies;

// From https://github.com/DefinitelyTyped/DefinitelyTyped/issues/27570#issuecomment-474628163.
// Custom interface to handle webpack-dev-server 5.x proxy configuration format
interface ProxyConfigArray {
  context: string[];
  target: string;
  changeOrigin: boolean;
  secure: boolean;
}

interface WebpackDevServerConfiguration5 extends Omit<WebpackDevServerConfiguration, 'proxy'> {
  proxy?: ProxyConfigArray[];
}

interface Configuration extends WebpackConfiguration {
  devServer?: WebpackDevServerConfiguration5;
}

const configFactoryFn = (env: object, argv: { mode: 'production' | undefined }): Configuration => {
  const config: Configuration = {
    output: {
      path: path.resolve(__dirname, 'dist'),
      publicPath: 'auto'
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.jsx', '.js', '.json']
    },
    devtool: argv.mode === 'production' ? 'source-map' : 'inline-source-map',
    module: {
      rules: [
        {
          test: /\.m?js/,
          type: 'javascript/auto',
          resolve: {
            fullySpecified: false
          }
        },
        {
          test: /\.s(a|c)ss$/,
          use: [
            'style-loader',
            'css-loader',
            'resolve-url-loader',
            {
              loader: 'sass-loader',
              options: {
                sourceMap: true
              }
            }
          ]
        },
        {
          test: /\.(ts|tsx|js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader'
          }
        },
        {
          include: /node_modules\/@on\/core-components.*/,
          test: /\.m?js/,
          resolve: {
            fullySpecified: false // fix:issue: https://github.com/webpack/webpack/issues/11467
          }
        },
        { test: /\.json$/, type: 'json' }
      ]
    },
    optimization: {
      minimize: argv.mode === 'production',
      minimizer: [
        new TerserPlugin({
          extractComments: /@extract/i
        })
      ]
    },
    plugins: [
      new ModuleFederationPlugin({
        name: 'matters_mfe',
        filename: 'remoteEntry.js',
        remotes: {},
        exposes: {
          './App': './src/App.tsx'
        },
        shared: {
          ...deps,
          i18next: {
            eager: true,
            singleton: true,
            requiredVersion: deps.i18next
          },
          react: {
            eager: true,
            singleton: true,
            requiredVersion: deps.react
          },
          'react-dom': {
            eager: true,
            singleton: true,
            requiredVersion: deps['react-dom']
          },
          'react-i18next': {
            eager: true,
            singleton: true,
            requiredVersion: deps['react-i18next']
          },
          'react-redux': {
            eager: true,
            singleton: true,
            requiredVersion: deps['react-redux']
          },
          'react-router-dom': {
            eager: true,
            singleton: true,
            requiredVersion: deps['react-router-dom']
          },
          '@on/core-components': {
            eager: true,
            singleton: true,
            requiredVersion: deps['@on/core-components']
          },
          '@on/core-styles': {
            eager: true,
            singleton: true,
            requiredVersion: deps['@on/core-styles']
          }
        }
      }),
      new HtmlWebPackPlugin({
        template: './public/index.html',
        templateParameters: {
          PUBLIC_URL: process.env.PUBLIC_URL || ''
        }
      }),
      new DefinePlugin(
        // Define the environment variables that will be available in the client code, as listed in `PUBLIC_ENV_VARS`.
        PUBLIC_ENV_VARS.reduce((acc, curr) => {
          acc[`process.env.${curr}`] = JSON.stringify(process.env[curr] || '');
          return acc;
        }, {} as Record<string, string>)
      ),
      new ProvidePlugin({
        // automatically import react where needed
        React: 'react'
      })
    ]
  };
  if (argv.mode !== 'production') {
    config.devServer = {
      port: 8090,
      proxy: [
        {
          context: ['/api'],
          target: 'http://localhost:5004',
          changeOrigin: true,
          secure: false
        },
        {
          context: ['/dev2/oia/ui-chatmgmt/api'],
          target: 'http://localhost:5004',
          changeOrigin: true,
          secure: false
        }
      ],
      historyApiFallback: true,
      setupMiddlewares: (middlewares: any[]) => {
        // Apply CORS headers to static files we serve (like font files) using the same policy we apply to our API
        // endpoints. This prevents CORS errors when loading fonts from the app shell.
        middlewares.unshift(cors({ origin: getCorsOrigin(), credentials: true }));
        return middlewares;
      }
    };
  }
  return config;
};

export default configFactoryFn;
