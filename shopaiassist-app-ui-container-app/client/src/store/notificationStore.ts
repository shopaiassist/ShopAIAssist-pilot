import { NotificationAlert } from '@';
import { create } from 'zustand';

interface NotificationAlertStore extends NotificationAlert {
  id: number;
}

interface NotificationState {
  queue: NotificationAlertStore[];
  clearNotification: (index: number | undefined) => void;
  pushNotificationAlert: (payload: NotificationAlert) => void;
}

const useNotificationStore = create<NotificationState>()((set) => ({
  queue: [],
  clearNotification: (id) =>
    set((state) => {
      const queue = state.queue.filter((notification) => notification.id !== id);
      return { queue };
    }),
  pushNotificationAlert: (payload: NotificationAlert) =>
    set((state) => {
      return {
        queue: [...state.queue, { id: Date.now() + Math.random(), ...payload }],
      };
    }),
}));

export const selectNotificationQueue = (state: NotificationState) => state.queue;
export const selectClearNotification = (state: NotificationState) => state.clearNotification;
export const selectPushNotificationAlert = (state: NotificationState) => state.pushNotificationAlert;

export default useNotificationStore;
