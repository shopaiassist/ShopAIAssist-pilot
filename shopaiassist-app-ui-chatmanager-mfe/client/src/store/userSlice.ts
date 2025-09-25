import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { RootState } from './store';

interface UserData {
  firstName: string;
  lastName: string;
  uid: string;
}

const initialState: { data: UserData | null } = {
  data: null
};

// User async actions
/** Fetch the current authenticated user */
export const fetchAuthenticatedUser = createAsyncThunk(
  'user/auth/fetch',
  async (_, { rejectWithValue }): Promise<UserData> => {
    try {
      const userData: UserData = await new Promise((res) => {
        setTimeout(() => {
          res({
            firstName: 'John',
            lastName: 'Doe',
            uid: '123456789'
          });
        }, 1000);
      });
      return userData;
    } catch (err: unknown) {
      throw rejectWithValue(`User Fetch Failed. ${err && (err as Error).message}`);
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  // The `reducers` field lets us define reducers and generate associated actions
  reducers: {
    setUser: (state, { payload }) => {
      state.data = payload || null;
    }
  },
  extraReducers: (builder) => {
    // fetchAuthenticatedUser
    builder.addreact(fetchAuthenticatedUser.fulfilled, (state, { payload }) => {
      state.data = payload;
    });
    builder.addreact(fetchAuthenticatedUser.rejected, (state) => {
      state.data = null;
    });
  }
});

export const { setUser } = userSlice.actions;

export const selectUser = (state: RootState): UserData | null => state.user.data;

export default userSlice.reducer;
