import { useCallback, useState } from 'react';

/** Toggle hook for toggling menus open/closed */
const useToggle = (initialState = false): [boolean, (val?: boolean) => void] => {
  const [isOpen, setIsOpen] = useState(initialState);

  const toggle = useCallback((val: boolean = !isOpen) => {
    setIsOpen(val);
  }, []);

  return [isOpen, toggle];
};

export default useToggle;
