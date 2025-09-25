import { SafAlert, SafAlertProps, SafList, SafListItem } from '@/core-components/react';

import useNotificationStore, { selectClearNotification, selectNotificationQueue } from '../../store/notificationStore';

interface NotificationAlertProps extends Pick<SafAlertProps, 'appearance' | 'onClose' | 'style'> {
  /** The message(s) to display */
  message: string | string[];
  /** The duration in ms to auto-hide the notification */
  autoHideDuration?: number | null;
}

// Default duration in ms for auto-hide when not specified
const DEFAULT_DURATION = 3000;

// Vertical spacing between stacked notifications (percentage based on notification's height)
const HEIGHT_AND_SPACING_PERCENTAGE = 100 + 5;

// Maximum number of notifications to show at the same time
export const MAX_STACKED_NOTIFICATIONS = 3;

/** Componet to handle notification queue */
export const NotificationDispatcher = () => {
  const notificationQueue = useNotificationStore(selectNotificationQueue);
  const clearNotification = useNotificationStore(selectClearNotification);

  const onClose = (id: number) => {
    clearNotification(id);
  };

  return (
    <>
      {notificationQueue.slice(0, MAX_STACKED_NOTIFICATIONS).map((notification, idx) => {
        const translateY = HEIGHT_AND_SPACING_PERCENTAGE * idx;
        return (
          <NotificationAlert
            key={notification.id}
            onClose={() => onClose(notification.id)}
            style={{ transform: `translate(-50%, ${translateY}%)` }}
            {...notification}
          />
        );
      })}
    </>
  );
};

/** Component to display a notification to the user */
const NotificationAlert = ({ message, appearance, autoHideDuration, ...props }: NotificationAlertProps) => {
  const duration = autoHideDuration !== undefined ? autoHideDuration : DEFAULT_DURATION;
  return (
    <SafAlert
      duration={duration !== null ? duration / 1000 : undefined}
      alertType="toast"
      appearance={appearance}
      {...props}
    >
      {message instanceof Array ? (
        <SafList listStyle="none" size="small">
          {message.map((msg, idx) => (
            <SafListItem key={`noti-msg-${idx}`}>{msg}</SafListItem>
          ))}
        </SafList>
      ) : (
        message
      )}
    </SafAlert>
  );
};

export default NotificationAlert;
