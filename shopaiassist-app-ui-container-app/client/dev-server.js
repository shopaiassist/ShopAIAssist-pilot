// Register ts-node to handle TypeScript files
require('ts-node/register');

const express = require('express');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

// Import the webpack configuration
const webpackConfig = require('./webpack.config.ts').default({}, { mode: 'development' });

const app = express();
const PORT = 8060;

// Create webpack compiler
const compiler = webpack(webpackConfig);

// Use webpack-dev-middleware
const devMiddleware = webpackDevMiddleware(compiler, {
  publicPath: webpackConfig.output.publicPath || '/',
  stats: {
    colors: true,
    hash: false,
    timings: true,
    chunks: false,
    chunkModules: false,
    modules: false,
  },
});

app.use(devMiddleware);

// Use webpack-hot-middleware for hot module replacement
app.use(webpackHotMiddleware(compiler, {
  path: '/__webpack_hmr',
  heartbeat: 10 * 1000,
}));

// Proxy API requests to the backend server (same as original devServer config)
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:5100',
  changeOrigin: true,
  logLevel: 'warn',
}));

app.use('/redirect', createProxyMiddleware({
  target: 'http://localhost:5100',
  changeOrigin: true,
  logLevel: 'warn',
}));

// History API fallback for single-page application routing
// This must come after API proxies but before static file serving
app.use((req, res, next) => {
  // Skip if it's an API request, webpack HMR, or has a file extension
  if (req.path.startsWith('/api') || 
      req.path.startsWith('/redirect') ||
      req.path.startsWith('/__webpack_hmr') ||
      req.path.includes('.')) {
    return next();
  }
  
  // For all other routes, serve the index.html (SPA fallback)
  req.url = '/';
  next();
});

// Serve static files from the webpack output
app.use(express.static(path.join(__dirname, 'public')));

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Development server running at http://localhost:${PORT}`);
  console.log('📁 Serving files from webpack dev middleware');
  console.log('🔄 Hot Module Replacement enabled');
  console.log('🔗 API proxy: /api -> http://localhost:5100');
  console.log('🔗 Redirect proxy: /redirect -> http://localhost:5100');
  
  // Open browser automatically (similar to webpack-dev-server --open)
  import('open').then(({ default: open }) => {
    return open(`http://localhost:${PORT}`);
  }).catch(() => {
    console.log('Could not automatically open browser. Please navigate to http://localhost:' + PORT);
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down development server...');
  devMiddleware.close(() => {
    process.exit(0);
  });
});

module.exports = app;
