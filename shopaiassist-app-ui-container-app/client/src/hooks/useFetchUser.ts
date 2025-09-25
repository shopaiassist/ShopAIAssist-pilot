import { useEffect, useState } from 'react';
import { unwrapResult } from '@reduxjs/toolkit';

import { navigateToLogin } from '../@util/login';
import LOG from '../services/LoggingService';
import { fetchAuthenticatedUser, selectUser, SessionData } from '../store/userSlice';
import { useAppDispatch, useAppSelector } from './redux';

/**
 * Fetches the authenticated user from the server.
 */
const useFetchUser = (): { isFetching: boolean; hasFetched: boolean; user: SessionData | null } => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);

  const [isFetching, setIsFetching] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    setIsFetching(true);
    dispatch(fetchAuthenticatedUser())
      .then(unwrapResult)
      .then((user) => {
        if (user) {
          LOG.log('Fetched user:', user);
        } else {
          LOG.log('No fetched user. Redirecting to login');
          navigateToLogin();
        }
      })
      .catch((err) => {
        LOG.error('Failed to fetch user:', err);
      })
      .finally(() => {
        setIsFetching(false);
        setHasFetched(true);
      });
  }, []);

  return { isFetching, hasFetched, user };
};

export default useFetchUser;
