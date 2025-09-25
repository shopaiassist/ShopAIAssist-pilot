import { useEffect, useState } from 'react';
import { unwrapResult } from '@reduxjs/toolkit';
import { useIdleTimer } from 'react-idle-timer';

import { navigateToLogout } from '../@util/login';
import LOG from '../services/LoggingService';
import { fetchTimeouts, Timeouts } from '../store/userSlice';
import { useAppDispatch } from './redux';

const DEFAULT_IDLE_TIME = 90 * 60 * 1000;
const DEFAULT_WARNING_THRESHOLD = DEFAULT_IDLE_TIME * 0.1;
const SHOW_EXPIRED_MESSAGE_TIME = 10 * 1000;

/** Hook for managing session idle timeout
 *
 * @returns [state, remaining, activate]
 * state: 'active' | 'warning' | 'expired'
 * remaining: Time remaining in seconds
 * activate: Function to reset the idle timer
 */
const useIdleTimeout = (): [TimeoutState, number, () => void] => {
  const [timeoutValues, setTimeoutValues] = useState<Timeouts>({
    idleTime: DEFAULT_IDLE_TIME,
    warningThreshold: DEFAULT_WARNING_THRESHOLD,
  });
  const [state, setState] = useState<TimeoutState>('active');
  const [remaining, setRemaining] = useState<number>(0);
  const dispatch = useAppDispatch();

  const onIdle = () => {
    setState('expired');
    // Show expired message for a few seconds before logging out
    setTimeout(() => {
      navigateToLogout();
    }, SHOW_EXPIRED_MESSAGE_TIME);
  };

  const onActive = () => {
    setState('active');
  };

  const onPrompt = () => {
    setState('warning');
  };

  // Configure the idle timer
  const { getRemainingTime, activate } = useIdleTimer({
    onIdle,
    onActive,
    onPrompt,
    timeout: timeoutValues.idleTime,
    promptBeforeIdle: timeoutValues.warningThreshold,
    crossTab: true,
    leaderElection: true,
    syncTimers: 500,
    throttle: 500,
    stopOnIdle: true,
  });

  // Fetch the timeout values from the server on page load
  useEffect(() => {
    dispatch(fetchTimeouts())
      .then(unwrapResult)
      .then((timeouts) => {
        if (timeouts) setTimeoutValues(timeouts);
      })
      .catch((err) => {
        LOG.error('Failed to fetch timeouts:', err);
      });
  }, []);

  // Update the remaining time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(Math.ceil(getRemainingTime() / 1000));
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  });

  return [state, remaining, activate];
};

export default useIdleTimeout;
