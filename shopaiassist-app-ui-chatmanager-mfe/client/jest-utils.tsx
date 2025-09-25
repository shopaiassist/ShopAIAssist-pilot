import React, { JSXElementConstructor, ReactElement } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouterProps } from 'react-router';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { merge } from 'ts-deepmerge';
import { configureStore, EnhancedStore } from '@reduxjs/toolkit';
import { ByRoleMatcher, render, RenderResult } from '@testing-library/react';
import { reducer, RootState, store as baseStore } from './src/store/store';
import i18nInstance from './src/utils/i18n';

type InitialEntries = MemoryRouterProps['initialEntries'];
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
type PartialRootState = DeepPartial<RootState>;

interface RenderOptions {
  entries?: InitialEntries;
  state?: PartialRootState;
  store?: EnhancedStore;
}

interface SnapshotOptions {
  isModal?: boolean | ByRoleMatcher;
  state?: PartialRootState;
}

interface WrapperProps {
  children: ReactElement;
}

// export const mockApi = (apiInstance: AxiosInstance) => ({
//   delete: jest.spyOn(apiInstance, 'delete'),
//   get: jest.spyOn(apiInstance, 'get'),
//   post: jest.spyOn(apiInstance, 'post'),
//   put: jest.spyOn(apiInstance, 'put'),
//   patch: jest.spyOn(apiInstance, 'patch'),
// });

/** Redux store with optional default content */
export const mockStore = (state: PartialRootState = {}): EnhancedStore =>
  configureStore({ preloadedState: merge(baseStore.getState(), state), reducer: reducer as never });

/** Render function with access to override store/state */
export const renderAll = (ui: ReactElement, { entries, state = {}, store }: RenderOptions = {}): RenderResult => {
  const data = store || mockStore(state);
  const Wrapper = ({ children }: WrapperProps) => (
    <MemoryRouter initialEntries={entries}>
      <Provider store={data}>
        <I18nextProvider i18n={i18nInstance}>{children}</I18nextProvider>
      </Provider>
    </MemoryRouter>
  );
  return render(ui, { wrapper: Wrapper as JSXElementConstructor<{ children: React.ReactNode }> });
};

/** Render function with i18n provider */
export const renderWithI18n = (ui: ReactElement): RenderResult => {
  const I18nWrapper = ({ children }: WrapperProps) => <I18nextProvider i18n={i18nInstance}>{children}</I18nextProvider>;
  return render(ui, { wrapper: I18nWrapper as JSXElementConstructor<{ children: React.ReactNode }> });
};

/** Render function with access to override store/state */
export const renderWithRedux = (ui: ReactElement, { state = {}, store }: RenderOptions = {}): RenderResult => {
  const data = store || mockStore(state);
  const ReduxWrapper = ({ children }: WrapperProps) => (
    <Provider store={data}>
      <I18nextProvider i18n={i18nInstance}>{children}</I18nextProvider>
    </Provider>
  );
  return render(ui, { wrapper: ReduxWrapper as JSXElementConstructor<{ children: React.ReactNode }> });
};

/** Get content to test against a snapshot */
export const getSnapshot = (ui: ReactElement, state?: PartialRootState): ChildNode =>
  renderAll(ui, { state }).container.firstChild as ChildNode;

/** Get modal content to test against a snapshot */
export const getSnapshotModal = (ui: ReactElement, state?: PartialRootState, role?: ByRoleMatcher): ChildNode =>
  renderAll(ui, { state }).getByRole(role || 'presentation');

/** Helper function to generate snapshots */
export const snapshot = (ui: ReactElement, { isModal, state }: SnapshotOptions = {}) => {
  const role = typeof isModal === 'boolean' ? undefined : isModal;
  // eslint-disable-next-line no-extra-boolean-cast
  const snapshot = !!isModal ? getSnapshotModal(ui, state, role) : getSnapshot(ui, state);
  expect(snapshot).toMatchSnapshot();
};

// re-export everything
export * from '@testing-library/react';
