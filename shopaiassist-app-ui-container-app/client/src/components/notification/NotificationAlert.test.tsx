import { render } from '@testing-library/react';
import { act } from 'react-dom/test-utils';

import useNotificationStore from '../../store/notificationStore';
import { MAX_STACKED_NOTIFICATIONS, NotificationDispatcher } from './NotificationAlert';

describe('NotificationDispatcher', () => {
  describe('render', () => {
    it('no auto hides', () => {
      const wrapper = render(<NotificationDispatcher />);

      expect(wrapper.container.querySelector('saf-alert')).toBeNull();

      act(() => {
        useNotificationStore.getState().pushNotificationAlert({
          message: 'Notification message',
          appearance: 'success',
          autoHideDuration: null,
        });
      });

      expect(wrapper.container.querySelector('saf-alert')).not.toBeNull();
    });

    it('shows no more than MAX_STACKED_NOTIFICATIONS', () => {
      const wrapper = render(<NotificationDispatcher />);

      expect(wrapper.container.querySelector('saf-alert')).toBeNull();

      act(() => {
        for (let i = 0; i < MAX_STACKED_NOTIFICATIONS + 3; i++) {
          useNotificationStore.getState().pushNotificationAlert({
            message: 'Notification message',
            appearance: 'success',
            autoHideDuration: null,
          });
        }
      });

      expect(wrapper.container.querySelectorAll('saf-alert')).toHaveLength(MAX_STACKED_NOTIFICATIONS);
    });
  });
});
