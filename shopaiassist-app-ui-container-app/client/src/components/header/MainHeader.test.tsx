import React from 'react';

import { renderAll, snapshot, waitFor } from '../../../jest-utils';
import MainHeader from './MainHeader';

describe('Main Header Tests', () => {
  describe('render', () => {
    it('should render', async () => {
      snapshot(<MainHeader isMinimized={false} isMobile={false} toggleNav={() => {}} />);
    });
  });
  describe('user menu', () => {
    it('should open user menu', async () => {
      const wrapper = renderAll(<MainHeader isMinimized={false} isMobile={false} toggleNav={() => {}} />);
      const userBtn = wrapper.getByTestId('user-btn');
      userBtn.click();
      await waitFor(() => {
        expect(wrapper.getByTestId('user-menu')).toBeInTheDocument();
        expect(wrapper.getByText('Sign out')).toBeInTheDocument();
      });
    });
  });
});
