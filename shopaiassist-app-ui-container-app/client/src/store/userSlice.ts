import { User, UserPermissions } from '@';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';

import { UserApi } from '../@util/api/user';
import { SessionStorageKey } from '../hooks/useModalCommunication';
import { RootState } from './store';

export interface SessionData {
  orchestrationToken: string;
  user: User;
  permissions: UserPermissions;
  bannerAndGuideMetadata: { visitor: { id: string }; account: { id: string } };
  jwt: string;
}

export interface Timeouts {
  idleTime: number;
  warningThreshold: number;
}

const initialState: { data: SessionData | null } = {
  data: null,
};

const getOneSourceUser = (): User => {
  let oneSourceUser: User;
  try {
    const receivedData = JSON.parse(sessionStorage.getItem(SessionStorageKey.OneSourceData) || '');
    oneSourceUser = {
      firstName: receivedData?.user?.firstName || '',
      lastName: receivedData?.user?.lastName || '',
      registrationKey: '',
      organization: { id: '', locationCountryCode: '' },
      email: receivedData?.user?.email || '',
      userGuid: receivedData?.user?.id || '',
    };
  } catch (err) {
    oneSourceUser = {
      firstName: '',
      lastName: '',
      registrationKey: '',
      organization: { id: '', locationCountryCode: '' },
      email: '',
      userGuid: '',
    };
    console.error('Failed to parse onesourceData', err);
  }
  return oneSourceUser;
};

// User async actions
/** Fetch the current authenticated user */
export const fetchAuthenticatedUser = createAsyncThunk(
  'user/auth/fetch',
  // async (_, { rejectWithValue }): Promise<SessionData | null> => {
  //   try {
  //     return await UserApi.me();
  //   } catch (err: unknown) {
  //     if (err instanceof AxiosError && err?.response?.status === 401) {
  //       return null;
  //     }
  //     throw rejectWithValue(`User Fetch Failed. ${err && (err as Error).message}`);
  //   }
  // }
  async (_, { rejectWithValue }): Promise<SessionData | null> => {
    try {
      const userData: SessionData = await new Promise((res) => {
        setTimeout(() => {
          res({
            user: getOneSourceUser(),
            orchestrationToken:
              'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJkIjp7InVpZCI6IjUzMjZmMTU3LThiYmYtNDY3Mi1iZTg3LTAxZTk3NTcyNjU2MCIsIm9yZ1NsdWdzIjpbInRob21zb24tcmV1dGVycy1jb3JlLXByZWNpc2lvbiJdLCJyZWdpb24iOiJ1cyIsInJvbGVzIjpbXSwiYWN0aXZlT2lkIjoidGhvbXNvbi1yZXV0ZXJzLWNvcmUtcHJlY2lzaW9uIiwiaXNBZG1pbiI6ZmFsc2UsImxhc3RVcGRhdGVkQXQiOjE3MTgwMzYwNTQ2ODQsImlkbGVFeHBpcmUiOjE3MTk0MDI0NjkxMjIsImlkbGVUaW1lb3V0SW5NcyI6NTQwMDAwMH0sImlhdCI6MTcxOTM5NzA2OSwiZXhwIjoxNzIwNjA2NjY5fQ.k_VvVQP_QKXS5SB0SOL7D6po633mgetHTP4CC6u6Xh6bxsh_BBgdfBW7FZiRjYwr7AMwy6kUBSBWbemBBsCos0PMGeW_pbFipR-QtaV8_2UI51twC_MtkcFFscM7b4m0UHXAiLTMufva61TQx1Mr2vNiNc1W2fngpAHdePause0VjWNz4ERTwvajMUug2awDDHxw3kZXD6GWV7bq4oTTLXx23zpPWRPTnt1Rfxs8VD8LpFCIrkJ67l6kLkvIiIRUfjjlO9zooY3TnOLEhtGheTZfCyr45fLhu2qiTBtWFN7EMHV0DT5u8KqG1SKipL9rUmaXNCftye0gBJGunYdHw8dXw6v3WyBoXYTzRCPp3Qn0aSJy32BBo7SEr2dHfEQJcVc8UohEfq2pINHWollx1AgiBvMn1GdE2N4tv2VbBZJlS-NKMPT6LCe4w0DufbNtiNdELOjiSgIc8Na-Scp3bfaD3U0UEbkuYGOMBQRUm5XLJkjGFdrkQaSRrfBDOhtT1FGFtF11yS1i135jco5MvlOLAuyzQQ8BNeXj1SvUUVqCQEd5lA3607hxTRnbXkt54UWyKtquqxV21sYDrczeuLfo9YA06gkDANL_vb5vfkOGy1NPrx2KS4fR4X0TgzBm0nl3bIhjPTiz4hB4__Ffq63CKrZQ5IvOP7wUlRkuluYeyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJkIjp7InVpZCI6IjUzMjZmMTU3LThiYmYtNDY3Mi1iZTg3LTAxZTk3NTcyNjU2MCIsIm9yZ1NsdWdzIjpbInRob21zb24tcmV1dGVycy1jb3JlLXByZWNpc2lvbiJdLCJyZWdpb24iOiJ1cyIsInJvbGVzIjpbXSwiYWN0aXZlT2lkIjoidGhvbXNvbi1yZXV0ZXJzLWNvcmUtcHJlY2lzaW9uIiwiaXNBZG1pbiI6ZmFsc2UsImxhc3RVcGRhdGVkQXQiOjE3MTgwMzYwNTQ2ODQsImlkbGVFeHBpcmUiOjE3MTk0MDI0NjkxMjIsImlkbGVUaW1lb3V0SW5NcyI6NTQwMDAwMH0sImlhdCI6MTcxOTM5NzA2OSwiZXhwIjoxNzIwNjA2NjY5fQ.k_VvVQP_QKXS5SB0SOL7D6po633mgetHTP4CC6u6Xh6bxsh_BBgdfBW7FZiRjYwr7AMwy6kUBSBWbemBBsCos0PMGeW_pbFipR-QtaV8_2UI51twC_MtkcFFscM7b4m0UHXAiLTMufva61TQx1Mr2vNiNc1W2fngpAHdePause0VjWNz4ERTwvajMUug2awDDHxw3kZXD6GWV7bq4oTTLXx23zpPWRPTnt1Rfxs8VD8LpFCIrkJ67l6kLkvIiIRUfjjlO9zooY3TnOLEhtGheTZfCyr45fLhu2qiTBtWFN7EMHV0DT5u8KqG1SKipL9rUmaXNCftye0gBJGunYdHw8dXw6v3WyBoXYTzRCPp3Qn0aSJy32BBo7SEr2dHfEQJcVc8UohEfq2pINHWollx1AgiBvMn1GdE2N4tv2VbBZJlS-NKMPT6LCe4w0DufbNtiNdELOjiSgIc8Na-Scp3bfaD3U0UEbkuYGOMBQRUm5XLJkjGFdrkQaSRrfBDOhtT1FGFtF11yS1i135jco5MvlOLAuyzQQ8BNeXj1SvUUVqCQEd5lA3607hxTRnbXkt54UWyKtquqxV21sYDrczeuLfo9YA06gkDANL_vb5vfkOGy1NPrx2KS4fR4X0TgzBm0nl3bIhjPTiz4hB4__Ffq63CKrZQ5IvOP7wUlRkuluYeyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJkIjp7InVpZCI6IjUzMjZmMTU3LThiYmYtNDY3Mi1iZTg3LTAxZTk3NTcyNjU2MCIsIm9yZ1NsdWdzIjpbInRob21zb24tcmV1dGVycy1jb3JlLXByZWNpc2lvbiJdLCJyZWdpb24iOiJ1cyIsInJvbGVzIjpbXSwiYWN0aXZlT2lkIjoidGhvbXNvbi1yZXV0ZXJzLWNvcmUtcHJlY2lzaW9uIiwiaXNBZG1pbiI6ZmFsc2UsImxhc3RVcGRhdGVkQXQiOjE3MTgwMzYwNTQ2ODQsImlkbGVFeHBpcmUiOjE3MjA0NTUzNjI3NDEsImlkbGVUaW1lb3V0SW5NcyI6NTQwMDAwMH0sImlhdCI6MTcyMDQ0OTk2MiwiZXhwIjoxNzIxNjU5NTYyfQ.HGLOGQXjbffuwjVaGo5sJ8p15KQTYkNjpy24b-ZbQ82qhU9cndfnep5YEmS-4npXL4D1iWN-ZVnuDgV_7lXBYNHN7YWK7SP60pI2KY4GAzeZa-z98rw-chMihUwbeAYTAem2R-xJlrYnHXI6chDgzK5o-zaBaReTST43TuNlgXEw-gXM3R4e5PHZSIW2ZsG5zdT62unyTxZGPV39ilGrjs6w4UGg4Vtwe7wKD2zdaU5NAm-BcJ9UHHVEudoWhc_ufsjmGL4pE4N_M_tXoWSCW6jh8SY3O5Rte0gyHSiOaUb6dxrAOlxjrO1oVX5iq_8tf4fY71NyhlwMjrx1cMgQB3crrvXPUAP3426UpQ9c0u275daW3ynXoX-fSoOJ7vMhxSQHDWCKhq9kLLOL6v0rMFpg9mkwBcQmWoFKVtupRN9ywNSeXtI1FAf0PsFUIu6LImeLQ5W4I0qGiuM9cH9uyR0TD6tMefd91fOkOD_-Ja4tOgIhK1O9L-AniF8W5XzLtRnToy89GZY2Be3XGMCceo-MgSVHHwzOAV45IyXIJhAAvJRlMxfHuOtdS0W57nlOL7P3lxlku-dnQ2339RfDFHGkCaDbOCus0v3qjQzjLAcI8MmDwTp6Fdiwv8N6Oz7TD31S4ER-IoV5a0nPqMOjJf9UJwek7wZ26Vpf__b6gs0eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJkIjp7InVpZCI6IjUzMjZmMTU3LThiYmYtNDY3Mi1iZTg3LTAxZTk3NTcyNjU2MCIsIm9yZ1NsdWdzIjpbInRob21zb24tcmV1dGVycy1jb3JlLXByZWNpc2lvbiJdLCJyZWdpb24iOiJ1cyIsInJvbGVzIjpbXSwiYWN0aXZlT2lkIjoidGhvbXNvbi1yZXV0ZXJzLWNvcmUtcHJlY2lzaW9uIiwiaXNBZG1pbiI6ZmFsc2UsImxhc3RVcGRhdGVkQXQiOjE3MTgwMzYwNTQ2ODQsImlkbGVFeHBpcmUiOjE3MTk0MDI0NjkxMjIsImlkbGVUaW1lb3V0SW5NcyI6NTQwMDAwMH0sImlhdCI6MTcxOTM5NzA2OSwiZXhwIjoxNzIwNjA2NjY5fQ.k_VvVQP_QKXS5SB0SOL7D6po633mgetHTP4CC6u6Xh6bxsh_BBgdfBW7FZiRjYwr7AMwy6kUBSBWbemBBsCos0PMGeW_pbFipR-QtaV8_2UI51twC_MtkcFFscM7b4m0UHXAiLTMufva61TQx1Mr2vNiNc1W2fngpAHdePause0VjWNz4ERTwvajMUug2awDDHxw3kZXD6GWV7bq4oTTLXx23zpPWRPTnt1Rfxs8VD8LpFCIrkJ67l6kLkvIiIRUfjjlO9zooY3TnOLEhtGheTZfCyr45fLhu2qiTBtWFN7EMHV0DT5u8KqG1SKipL9rUmaXNCftye0gBJGunYdHw8dXw6v3WyBoXYTzRCPp3Qn0aSJy32BBo7SEr2dHfEQJcVc8UohEfq2pINHWollx1AgiBvMn1GdE2N4tv2VbBZJlS-NKMPT6LCe4w0DufbNtiNdELOjiSgIc8Na-Scp3bfaD3U0UEbkuYGOMBQRUm5XLJkjGFdrkQaSRrfBDOhtT1FGFtF11yS1i135jco5MvlOLAuyzQQ8BNeXj1SvUUVqCQEd5lA3607hxTRnbXkt54UWyKtquqxV21sYDrczeuLfo9YA06gkDANL_vb5vfkOGy1NPrx2KS4fR4X0TgzBm0nl3bIhjPTiz4hB4__Ffq63CKrZQ5IvOP7wUlRkuluY',
            jwt: 'jwt',
            bannerAndGuideMetadata: { visitor: { id: 'visitorId' }, account: { id: 'accountId' } },
            permissions: {
              skills: {
                allowedSkills: [],
              },
              fileManagement: {
                canViewDatabases: false,
                canCreateDatabases: false,
                canShareDatabases: false,
              },
              isAdmin: false,
            },
          });
        }, 1000);
      });
      return userData;
    } catch (err: unknown) {
      throw rejectWithValue(`User Fetch Failed. ${err && (err as Error).message}`);
    }
  }
);

export const fetchTimeouts = createAsyncThunk(
  'user/timeouts/fetch',
  async (_, { rejectWithValue }): Promise<Timeouts | null> => {
    try {
      return await UserApi.getTimeouts();
    } catch (err: unknown) {
      if (err instanceof AxiosError && err?.response?.status === 401) {
        return null;
      }
      throw rejectWithValue(`Timeouts Fetch failed. ${err && (err as Error).message}`);
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
    },
  },
  extraReducers: (builder) => {
    // fetchAuthenticatedUser
    builder.addCase(fetchAuthenticatedUser.fulfilled, (state, { payload }) => {
      state.data = payload;
    });
    builder.addCase(fetchAuthenticatedUser.rejected, (state) => {
      state.data = null;
    });
  },
});

export const { setUser } = userSlice.actions;

export const selectUser = (state: RootState): SessionData | null => state.user.data;

export default userSlice.reducer;
