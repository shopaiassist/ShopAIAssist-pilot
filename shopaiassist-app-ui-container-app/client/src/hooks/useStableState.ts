import { useCallback, useState } from 'react';
import isEqual from 'react-fast-compare';

/**
 * Hook to set state only if the new state is different from the previous state
 * to ensure that state objects are not updated unnecessarily.
 *
 * @param initialState
 */
const useStableState = <T>(initialState: T) => {
  const [state, setState] = useState<T>(initialState);
  // Ensure we don't keep recreate the "setter" function
  const stableSetState = useCallback(
    (newState: T) => {
      const nextFunction = typeof newState === 'function';
      setState((prevState) => {
        const update = nextFunction ? newState(prevState) : newState;
        // If the objects are considered to be the same, returning the existing
        // state object avoids a state update and an unnecessary call.
        return isEqual(prevState, update) ? prevState : update;
      });
    },
    [isEqual]
  );

  return [state, stableSetState] as const;
};

export default useStableState;
