import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import { TEST_PROPS } from './bootstrap-test-config';

/**
 * This is the entry point for the React App. It is the only file that should be imported by the index.ts file.
 * This was the only way around the issue of
 * Uncaught Error: Shared module is not available for eager consumption: webpack/sharing/consume/default/react/react
 */
const container = document.getElementById('app');
const root = createRoot(container!);
root.render(
  <StrictMode>
    <BrowserRouter>
      <App {...TEST_PROPS} />
    </BrowserRouter>
  </StrictMode>
);
