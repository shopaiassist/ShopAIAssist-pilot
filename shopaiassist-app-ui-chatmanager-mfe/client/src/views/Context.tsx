import { createContext, useContext } from 'react';
import { MattersProps } from '../App';

/** Context for references used with the Chat Management (Matters) MFE */
export const CtxMatters = createContext<MattersProps | null>(null);

/** Hook to use the Matters MFE */
export const useMatters = (): MattersProps => {
  const context = useContext(CtxMatters);
  if (!context) {
    throw new Error('useMatters must be used within CtxMatters.Provider');
  }
  return context;
};
