import axios from 'axios';

import { SessionData, Timeouts } from '../../store/userSlice';

const ENDPOINTS = {
  ME: 'me',
  LOGOUT: 'logout',
  TIMEOUTS: 'timeouts',
};

export const apiUser = axios.create({ baseURL: `${process.env.BASENAME_URL_SEGMENT}/api/user` });

export const UserApi = {
  me: async (): Promise<SessionData | null> => {
    const res = await apiUser.get<SessionData>(ENDPOINTS.ME);
    return res.data;
  },

  logout: async (): Promise<void> => {
    await apiUser.post(ENDPOINTS.LOGOUT);
  },

  getTimeouts: async (): Promise<Timeouts | null> => {
    const res = await apiUser.get<Timeouts>(ENDPOINTS.TIMEOUTS);
    return res.data;
  },
};
