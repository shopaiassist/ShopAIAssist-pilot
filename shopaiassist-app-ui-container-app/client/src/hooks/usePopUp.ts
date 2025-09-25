import { Dispatch, SetStateAction, useId, useState } from 'react';

/**
 * Custom hook to manage the state of the pop-up.
 * Provides an id that will identify an anchor element. Then the pop-up's content will be positioned using an anchored region relative to the anchor element.
 * Provides the isOpen state and its setState actions.
 */
const usePopUp = (initialState: boolean): [string, boolean, Dispatch<SetStateAction<boolean>>, () => void] => {
  const id = useId();
  const [isOpen, setIsOpen] = useState(initialState);
  const toggleIsOpen = () => setIsOpen(!isOpen);
  return [id, isOpen, setIsOpen, toggleIsOpen];
};

export default usePopUp;
