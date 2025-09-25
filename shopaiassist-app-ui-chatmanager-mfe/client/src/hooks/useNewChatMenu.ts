import { Dispatch, SetStateAction, useState } from 'react';

/**
 * Custom hook for managing the open/close state of a chat menu along with a popper menu reference.
 * This hook provides an interface for toggling the menu's visibility based on an initial state
 * and managing a reference which can be useful for positioning floating UI elements dynamically.
 *
 * @param {boolean} initialValue - The initial visibility state of the chat menu (true for visible, false for hidden).
 * @returns {[
 *   boolean, // The current visibility state of the menu.
 *   () => void, // Function to toggle the menu's state.
 *   null, // The current reference used for the popper menu, initially null.
 *   Dispatch<SetStateAction<null>> // Function to update the reference for the popper menu.
 * ]} A tuple containing the menu's visibility state, a toggle function, the current popper menu reference,
 *    and a function to set this reference.
 *
 * @example
 * // Usage within a component
 * const [isMenuOpen, toggleMenu, popperRef, setPopperRef] = useNewChatMenu(false);
 *
 * // Toggle menu on button click and use the setPopperRef to update the popper's reference
 * <button onClick={toggleMenu}>
 *   {isMenuOpen ? 'Close Chat Menu' : 'Open Chat Menu'}
 * </button>
 */
export const useNewChatMenu = (initialValue: boolean): [boolean, () => void, null, Dispatch<SetStateAction<null>>] => {
  const [menuState, setMenuState] = useState(initialValue);
  const [popperMenuReference, setPopperMenuReference] = useState(null);

  /**
   * Toggles the visibility state of the new chat menu
   */
  const toggleMenu = () => {
    setMenuState(!menuState);
  };

  return [menuState, toggleMenu, popperMenuReference, setPopperMenuReference];
};
