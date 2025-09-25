import { useEffect, useState } from 'react';
import { NotificationAlert } from '@';
import { Meta, StoryObj } from '@storybook/react';

import useNotificationStore, { selectPushNotificationAlert } from '../../store/notificationStore';
import { NotificationDispatcher } from './NotificationAlert';

const notifications: NotificationAlert[] = [
  {
    message: 'Matters succesfully deleted',
    appearance: 'success',
  },
  {
    message: 'Something went wrong. Please try again',
    appearance: 'error',
  },
  {
    message: 'The operation was completed',
    appearance: 'informational',
  },
  {
    message: 'Max file size exceeded',
    appearance: 'warning',
  },
];

const meta = {
  title: 'Components/NotificationDispatcher',
  component: NotificationDispatcher,
  parameters: {},
  tags: ['autodocs'],
} satisfies Meta<typeof NotificationDispatcher>;

export default meta;

type NotificationDispatcherCustomProps = React.ComponentProps<typeof NotificationDispatcher> & {
  notifications: NotificationAlert[];
  pushNotificationInterval: number;
};
type Story = StoryObj<NotificationDispatcherCustomProps>;

export const Default: Story = {
  args: {
    notifications,
    pushNotificationInterval: 2000,
  },
  render: ({ notifications, pushNotificationInterval }) => {
    const pushNotification = useNotificationStore(selectPushNotificationAlert);
    const [idx, setIdx] = useState(0);

    useEffect(() => {
      const interval = setInterval(() => {
        pushNotification(notifications[idx]);
        setIdx((idx + 1) % notifications.length);
      }, pushNotificationInterval);
      return () => clearInterval(interval);
    });

    return <NotificationDispatcher />;
  },
};
