/** Casts or converts an `unknown` object to an Error. */

// Overload the type, such that if an `errorType` is given, `null` must be expected. But if none is given, it will never
// return `null`.
type AsError = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  <T extends Error>(err: unknown, errorType: new (...args: any[]) => T): T | null;
  (err: unknown): Error;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const asError: AsError = <T extends Error = Error>(
  err: unknown,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errorType?: new (...args: any[]) => T
): T | Error | null => {
  if (errorType) {
    if (err instanceof errorType) {
      return err as T;
    }
    return null;
  }

  if (err instanceof Error) {
    return err;
  }

  // Create a new error object if `err` is not an instance of Error
  const newError = new Error(String(err));
  return newError;
};
