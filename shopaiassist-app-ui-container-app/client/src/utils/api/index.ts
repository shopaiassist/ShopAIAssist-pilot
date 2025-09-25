export * from './analytics';

/**
 * Handler function for API errors
 *
 * @param base - Name of the containing API (`OrgApi`, `UserApi`, etc.)
 * @param error - The error to handle
 * @param rejectWithValue - an optional handler for the error.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const apiError = (base: string, error: any, rejectWithValue?: (err: any) => object): Promise<never> => {
  const { stack } = new Error();
  const caller = stack
    ?.split('\n')[3]
    ?.trim()
    .replace(/\s*at (.+) \(.*/, '$1');
  const message = `${caller?.replace('Object', base)} error: ${error && error.message}`;
  const err = error.response || error;
  err.data = error.data;
  err.message = message;
  // A rejectWithValue function requires a string to avoid not-serializable errors.
  return rejectWithValue ? Promise.reject(rejectWithValue(`${err.message}`)) : Promise.reject(err);
};

export enum ApiStatus {
  NONE = '',
  SUCCESS = 'success',
  FAILURE = 'failure',
  LOADING = 'loading',
}
