import React from 'react';
import { Provider } from 'react-redux';
import { I18nextProvider } from 'react-i18next';
import { DomComponent, MfeContext } from 'react';

import i18nInstance from './utils/i18n';
import Main from './views/Main';
import { store } from './store/store';
import axios from 'axios';
import { getHeaders } from './utils/api';

import './App.scss';
import { CtxMatters } from './views/Context';

interface CreateChatProps {
  chatFolderIdentifier?: string;
  chatIdentifier?: string;
  createPersistentChat: (chatFolderIdentifier?: string) => Promise<string>;
}

export type PendoEvent = {
  name: string;
  data: unknown;
};

export enum ModalType {
  Minimized = 'minimized',
  Compact = 'compact',
  Full = 'full'
}

/**
 * The props for the Matters microfrontend app component.
 * These are used for configuring the MFE component.
 *
 * @interface MattersProps
 * @property {MfeContext} context - The context for the MFE on the app shell page, including the user and auth context.
 * @property {(chatIdentifier: string, chatFolderIdentifier?: string) => DomComponent} createChatComponentForId - Function to create a chat component for a given chat identifier.
 * @property {(createPersistentChat: (chatFolderIdentifier?: string) => Promise<string>, chatFolderIdentifier?: string) => DomComponent} createNewChatComponent - Function to create a new chat component.
 * @property {(fileCollectionId: string) => DomComponent} createFileManagementComponent - Function to create a file management component.
 * @property {() => DomComponent} [createFooter] - Optional function to create a footer component.
 */
export interface MattersProps {
  isOpen: boolean;
  /** The context for the MFE on the app shell page, including the user and auth context. */
  context: MfeContext;
  /** A function the Matter component will call when a chat component needs to be rendered. */
  createChatComponent: (props: CreateChatProps & { fileCollectionId?: string }) => DomComponent /*React.ReactNode*/;
  /** A function the Matter component will call when a file management component needs to be rendered. */
  createFileManagementComponent: (options: {
    chatIdentifier: string;
    chatFolderIdentifier?: string;
    fileCollectionId: string;
    isMatterArchived: boolean;
  }) => DomComponent /*React.ReactNode*/;
  /** A function to render actions within the header of the main content area */
  createHeaderActions?: () => DomComponent;
  closeSidebar: () => void;
  trackPendo?: (pendoEvent: PendoEvent) => void;
  modalType?: ModalType;
}

const App = (props: MattersProps) => {
  const { context, ...rest } = props;

  axios.interceptors.request.use(
    async (config) => {
      config.headers = getHeaders(await context.getAuthToken());
      config.withCredentials = true;
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  return (
    <Provider store={store}>
      <I18nextProvider i18n={i18nInstance}>
        <CtxMatters.Provider value={props}>
          <Main context={context} {...rest} />
        </CtxMatters.Provider>
      </I18nextProvider>
    </Provider>
  );
};

// Important to have default export for microfrontend to work with module federation.
// The module being exposed in webpack.config.ts is the default export.
export default App;
