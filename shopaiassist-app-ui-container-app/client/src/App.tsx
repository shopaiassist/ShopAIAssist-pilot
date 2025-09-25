import React from 'react';
import { i18n } from '@/';
import { Provider } from 'react-redux';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';

import LocalPagesLayout from './components/layout/LocalPagesLayout';
import RootLayout from './components/layout/RootLayout';
import { NotificationDispatcher } from './components/notification/NotificationAlert';
import SupportChatBot from './components/support/SupportChatBot';
import { store } from './store/store';
import Integrations from './views/admin/Integrations';
import Permissions from './views/admin/Permissions';
import Usage from './views/admin/Usage';
import Databases from './views/Databases';
import ErrorPage from './views/ErrorPage';
import Main from './views/Main';
import Favorites from './views/manage/Favorites';

import translation from '../public/locales/en/common.json';
import './App.scss';

export enum OLYMPUS_ROUTES {
  WORK = '/work',
  DATABASES = '/databases',
  MANAGE_FAVORITES = '/manage/favorites',
  ADMIN_PERMISSIONS = '/admin/permissions',
  ADMIN_USAGE = '/admin/usage',
  ADMIN_INTEGRATIONS = '/admin/integrations',
}

i18n.init({ en: { translation } });

const App = () => {
  const router = createBrowserRouter([
    {
      path: '/',
      element: <RootLayout />,
      errorElement: <ErrorPage />,
      children: [
        {
          path: '/',
          element: <Navigate to={OLYMPUS_ROUTES.WORK} replace />,
        },
        {
          path: OLYMPUS_ROUTES.WORK,
          element: <Main />,
        },
        {
          path: '/',
          element: <LocalPagesLayout />,
          children: [
            {
              path: OLYMPUS_ROUTES.DATABASES,
              element: <Databases />,
            },
            {
              path: OLYMPUS_ROUTES.MANAGE_FAVORITES,
              element: <Favorites />,
            },
            {
              path: OLYMPUS_ROUTES.ADMIN_PERMISSIONS,
              element: <Permissions />,
            },
            {
              path: OLYMPUS_ROUTES.ADMIN_USAGE,
              element: <Usage />,
            },
            {
              path: OLYMPUS_ROUTES.ADMIN_INTEGRATIONS,
              element: <Integrations />,
            },
          ],
        },
      ],
    },
  ], { basename: process.env.BASENAME_URL_SEGMENT });
  
  return (
    <Provider store={store}>
      <i18n.Provider i18n={i18n.instance}>
        <RouterProvider router={router} />
        {/* <SupportChatBot />
        <NotificationDispatcher /> */}
      </i18n.Provider>
    </Provider>
  );
};

export default App;
