import type { Preview } from '@storybook/react';

import i18n from './i18next';
import '../src/App.scss';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    i18n,
  },
  globals: {
    locale: 'en',
    locales: {
      en: 'English',
    },
  },
};

export default preview;
