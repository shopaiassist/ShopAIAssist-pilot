import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { AlertAppearance } from '@on/core-components/dist/esm/dts/components/alert/alert.options';
import { MfeContext } from 'react';

/**
 * Represents the state structure managed in the store for MFE context utilities.
 * This interface includes state management for utilities such as showing alerts.
 *
 * @interface AlertState
 * @property {Function} setMfeUtils - Sets the MFE utilities context.
 * @property {Function} triggerAlert - Triggers an alert with specified text and style.
 * @property {MfeContext['utilities']} [mfeUtils] - The MFE utilities context.
 */
export interface AlertState {
  setMfeUtils: (mfeUtils: MfeContext['utilities']) => void;
  triggerAlert: (text: string, style: AlertAppearance) => void;
  mfeUtils?: MfeContext['utilities'];
}

/**
 * Creates a Zustand store to manage MFE context utilities using Zustand along with devtools for debugging.
 * The store contains state and actions related to MFE context utilities, such as showing alerts.
 *
 * @returns {UseStore<AlertState>} A Zustand store with the following:
 *         - `setMfeUtils`: Function to set the MFE utilities context.
 *         - `triggerAlert`: Function to trigger an alert with specified text and style.
 */
export const useMfeContextUtilsStore = create<AlertState>()(
  devtools(
    (set, get) => ({
      setMfeUtils: (mfeUtils) => {
        set({ mfeUtils });
      },
      triggerAlert: (text, style) => {
        get().mfeUtils?.showNotification({ message: text, appearance: style, autoHideDuration: 10 });
      }
    }),
    { name: 'useMfeContextUtilsStore' }
  )
);
