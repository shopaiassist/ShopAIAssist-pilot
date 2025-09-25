import 'dotenv/config';
import express from 'express';
import { LOG } from 'react';

import App from './app';

const port = process.env.PORT || 5004;
const app = new App();

const expressApp: express.Application = app.getApplication();

const server = expressApp.listen(port, () => {
  LOG.info(`Server listening on ${port}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  LOG.error('There was an uncaught error', err);
  process.exit(1); // Exit code 1 indicates a general error
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  LOG.error('Unhandled rejection', err);
  server.close(() => {
    process.exit(1); // Exit code 1 indicates a general error
  });
});
