import React from 'react';

import { renderAll, waitFor } from '../../../jest-utils';
import SupportChatBot from './SupportChatBot';

describe('SupportChatBot Tests', () => {
  describe('Target div rendering', () => {
    it('should render target div with correct id', async () => {
      const wrapper = renderAll(<SupportChatBot />);

      await waitFor(() => {
        const targetDiv = wrapper.getByTestId('triva-root');
        expect(targetDiv).toBeInTheDocument();
      });
    });
  });
});
