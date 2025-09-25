import { Action, AsyncThunkPayloadCreator, configureStore, ThunkAction } from '@reduxjs/toolkit';

import userReducer from './userSlice';

export const reducer = {
  user: userReducer
};

export const store = configureStore({
  reducer
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;

export interface AppThunkApiConfig {
  dispatch: AppDispatch;
  rejectValue: string;
  state: RootState;
}
export type AppAsyncThunk<P, R> = AsyncThunkPayloadCreator<R, P, AppThunkApiConfig>;
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, Action<string>>;
