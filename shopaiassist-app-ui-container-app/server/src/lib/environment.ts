type DefinedValues<Type> = {
  [Property in keyof Type]: string;
};

/**
 * @param unset an array of keys that have `undefined` values.
 * @returns     The default error message for undefined values in an object.
 */
export const defaultUnsetMessage = (unset: string[]) => {
  return `${unset.join(', ')} must be set in the environment`;
};

/**
 * Checks if one or more of the values in the given object are undefined.
 * If one or more of the values are `undefined` this function will throw
 * an error message with the keys that have `undefined` values.
 *
 * @param possiblyUndefinedValues An object with values that are possible `undefined`.
 * @param errorMessageTemplate a function that returns the error message to throw if one or more of the values are undefined.
 * @returns `possiblyUndefinedValues` if non if the values are `undefined`.
 */
export const ensureDefined = <
  T extends {
    [key: string]: string | undefined;
  },
>(
  possiblyUndefinedValues: T,
  errorMessageTemplate = defaultUnsetMessage
): DefinedValues<T> => {
  const unset = [];
  for (const key in possiblyUndefinedValues) {
    if (typeof possiblyUndefinedValues[key] === 'undefined') {
      unset.push(key);
    }
  }

  if (unset.length) {
    throw new Error(errorMessageTemplate(unset));
  }

  return possiblyUndefinedValues as DefinedValues<T>;
};

export const getRequiredEnvironmentVariable = (variableName: string): string => {
  const value = process.env[variableName];
  ensureDefined({ [variableName]: value });
  return value as string;
};
