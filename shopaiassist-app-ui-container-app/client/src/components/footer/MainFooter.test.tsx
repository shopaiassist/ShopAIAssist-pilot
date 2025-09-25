import React from 'react';

import { snapshot } from '../../../jest-utils';
import MainFooter from './MainFooter';

describe('Main Footer Tests', () => {
  describe('render', () => {
    it('should render', async () => {
      snapshot(<MainFooter isMobile={false} />);
    });
  });
});
