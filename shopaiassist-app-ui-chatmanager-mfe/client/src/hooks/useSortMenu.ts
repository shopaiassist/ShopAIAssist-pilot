import { Dispatch, SetStateAction, useState } from 'react';
import { SortOptions, useChatSidebarStore } from '../store/useChatSidebarStore';

/**
 * Custom hook for managing the visibility and interaction of a sort menu.
 * This hook provides state management for the menu's visibility, functions to toggle the menu, handle sort option selections,
 * and manage a popper menu reference for dynamic UI positioning.
 *
 * @param {boolean} initialValue - The initial visibility state of the sort menu.
 * @returns {[
 *   { title: string; value: SortOptions }[],
 *   string,
 *   boolean,
 *   () => void,
 *   (menuOption: string, onSortSelect: (menuOption: string) => void) => void,
 *   null,
 *   Dispatch<SetStateAction<null>>,
 *   (newSortType: string) => void,
 *   boolean
 * ]} A tuple containing:
 *   - {Array<{ title: string; value: SortOptions }>} sortMenuOptions: The available sort options for the menu.
 *   - {string} selectedSortOption: The currently selected sort option.
 *   - {boolean} menuState: The current visibility state of the menu.
 *   - {() => void} toggleMenu: A function to toggle the menu's visibility.
 *   - {(menuOption: string, onSortSelect: (menuOption: string) => void) => void} handleSortMenuItemClick:
 *     A function that handles selecting a sort option, invoking a callback with the selected option, and toggling the menu's visibility.
 *   - {null} popperMenuReference: The current reference used for the popper menu, initially null.
 *   - {Dispatch<SetStateAction<null>>} setPopperMenuReference: Function to update the reference for the popper menu.
 *   - {(newSortType: string) => void} setSortType: Function to set the current sort type.
 *   - {boolean} isLoading: Whether the chat list is currently being loaded.
 *
 * @example
 * const [sortMenuOptions, selectedSortOption, menuState, toggleMenu, handleSortSelection, popperRef, setPopperRef, setSortType, isLoading] = useSortMenu(false);
 *
 * // To toggle the visibility of the sort menu:
 * toggleMenu();
 *
 * // To handle a sort selection and perform an action:
 * const onSortSelect = (option) => {
 *   console.log(`Sort option selected: ${option}`);
 *   // Perform sorting or other actions here
 * };
 *
 * // Attach `handleSortSelection` with the sort option and `onSortSelect` callback to sort menu items:
 * <SortMenuItem onClick={() => handleSortSelection('date', onSortSelect)} />
 */
export const useSortMenu = (
  initialValue: boolean
): [
  {
    title: string;
    value: SortOptions;
  }[],
  string,
  boolean,
  () => void,
  (menuOption: string, onSortSelect: (menuOption: string) => void) => void,
  null,
  Dispatch<SetStateAction<null>>,
  (newSortType: string) => void,
  boolean
] => {
  const [menuState, setMenuState] = useState(initialValue);
  const [popperMenuReference, setPopperMenuReference] = useState(null);
  const [selectedSortOption, activeFolder, setSortType, isLoading] = useChatSidebarStore((state) => [
    state.sortType,
    state.activeFolder,
    state.setSortType,
    state.isLoading
  ]);
  const sortMenuOptions: { title: string; value: SortOptions }[] = activeFolder
    ? [
        {
          title: 'SORT_BY_DATE',
          value: SortOptions.BY_DATE
        },
        {
          title: 'SORT_BY_NAME',
          value: SortOptions.BY_NAME
        }
      ]
    : [
        {
          title: 'SORT_BY_DATE',
          value: SortOptions.BY_DATE
        },
        {
          title: 'SORT_BY_NAME',
          value: SortOptions.BY_NAME
        }
      ];

  /**
   * Toggles the visibility state of the sort menu.
   * Does not toggle the menu if data is currently loading.
   */
  const toggleMenu = () => {
    // Don't toggle the menu if data is loading
    if (isLoading) return;
    
    setMenuState(!menuState);
  };

  /**
   * Handles clicking on a sort menu item and invokes the `onSortSelect` callback.
   * @param menuOption - The value of the selected sort option.
   */
  const handelSortMenuItemClick = (menuOption: string, onSortSelect: (menuOption: string) => void) => {
    onSortSelect && onSortSelect(menuOption);
    toggleMenu();
  };

  return [
    sortMenuOptions,
    selectedSortOption,
    menuState,
    toggleMenu,
    handelSortMenuItemClick,
    popperMenuReference,
    setPopperMenuReference,
    setSortType,
    isLoading
  ];
};
