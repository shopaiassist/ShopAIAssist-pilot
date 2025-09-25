const express = require('express');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const path = require('path');
const chokidar = require('chokidar');
const cors = require('cors');

// Load environment variables
require('dotenv').config({ path: '../.env' });

// Register ts-node to handle TypeScript files
require('ts-node/register');

// Cors utility function
const getCorsOrigin = () => {
  return !process.env.CORS_ORIGINS ? false : process.env.CORS_ORIGINS.split(',');
};

// Get webpack configuration
const webpackConfig = require('./webpack.config.ts').default({}, { mode: 'development' });

// Add HMR entry points
const addHotEntry = (entry, name) => {
  if (typeof entry === 'string') {
    return [
      'webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000&reload=true',
      entry
    ];
  } else if (Array.isArray(entry)) {
    return [
      'webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000&reload=true',
      ...entry
    ];
  } else if (typeof entry === 'object') {
    const newEntry = {};
    Object.keys(entry).forEach(key => {
      newEntry[key] = addHotEntry(entry[key], key);
    });
    return newEntry;
  }
  return entry;
};

// Modify webpack config for HMR
if (!webpackConfig.entry) {
  webpackConfig.entry = './src/index.ts';
}

webpackConfig.entry = addHotEntry(webpackConfig.entry);

// Add HMR plugins
webpackConfig.plugins = [
  ...(webpackConfig.plugins || []),
  new webpack.HotModuleReplacementPlugin(),
  new webpack.NoEmitOnErrorsPlugin()
];

// Ensure proper mode
webpackConfig.mode = 'development';

// Create compiler
const compiler = webpack(webpackConfig);

// Create Express app
const app = express();
const PORT = 8090;
const API_PROXY_TARGET = 'http://localhost:5004';

// Apply CORS headers using the same policy as the original setup
app.use(cors({ origin: getCorsOrigin(), credentials: true }));

// Setup webpack dev middleware
const devMiddleware = webpackDevMiddleware(compiler, {
  publicPath: webpackConfig.output.publicPath || '/',
  stats: {
    colors: true,
    chunks: false,
    modules: false,
    assets: false,
    children: false,
    cached: false,
    cachedAssets: false
  }
});

app.use(devMiddleware);

// Setup webpack hot middleware
const hotMiddleware = webpackHotMiddleware(compiler, {
  log: console.log,
  path: '/__webpack_hmr',
  heartbeat: 10 * 1000
});

app.use(hotMiddleware);

// API Proxy middleware using http-proxy-middleware - must come before static file serving
const { createProxyMiddleware } = require('http-proxy-middleware');

const apiProxy = createProxyMiddleware({
  target: API_PROXY_TARGET,
  changeOrigin: true,
  logLevel: 'debug',
  onError: (err, req, res) => {
    console.error('❌ API Proxy Error:', err.message);
    console.error('   Request URL:', req.url);
    console.error('   Target:', API_PROXY_TARGET);
    res.status(500).json({ 
      error: 'API proxy error', 
      message: err.message,
      target: API_PROXY_TARGET 
    });
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log('🔀 Proxying request:', req.method, req.url, '→', API_PROXY_TARGET + req.url);
  },
  onProxyRes: (proxyRes, req, res) => {
    const corsOrigin = getCorsOrigin();
    if (corsOrigin) {
      proxyRes.headers['Access-Control-Allow-Origin'] = req.headers.origin || corsOrigin[0] || '*';
      proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
      proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
      proxyRes.headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-account-type, x-op-product-id, x-host-product';
    }
    console.log('✅ Proxy response:', proxyRes.statusCode, req.url);
  }
});

app.use('/api', apiProxy);

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Handle SPA routing - must be last
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Live reload functionality for non-JS/CSS files
const enableLiveReload = process.argv.includes('--live');
if (enableLiveReload) {
  console.log('🔄 Live reload enabled for static files');
  
  // Watch for changes in public directory and other static assets
  const watcher = chokidar.watch([
    path.join(__dirname, 'public/**/*'),
    path.join(__dirname, 'src/**/*.{html,json}')
  ], {
    ignored: /node_modules/,
    persistent: true
  });

  watcher.on('change', (filePath) => {
    console.log(`📁 File changed: ${filePath}`);
    // Trigger page reload for non-JS/CSS changes
    hotMiddleware.publish({ action: 'reload' });
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Development server running at http://localhost:${PORT}`);
  console.log(`🔗 API proxy: /api/* → ${API_PROXY_TARGET}`);
  console.log(`🔥 Hot Module Replacement: enabled`);
  if (enableLiveReload) {
    console.log(`📱 Live reload: enabled`);
  }
  console.log('\n📝 Available commands:');
  console.log('   npm start      - Start with HMR only');
  console.log('   npm run start:live - Start with HMR + Live reload');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down development server...');
  devMiddleware.close(() => {
    process.exit(0);
  });
});

// Handle compilation errors
compiler.hooks.done.tap('done', (stats) => {
  if (stats.hasErrors()) {
    console.log('❌ Compilation failed:');
    stats.compilation.errors.forEach(error => {
      console.error(error.message);
    });
  } else {
    console.log('✅ Compiled successfully');
  }
});
