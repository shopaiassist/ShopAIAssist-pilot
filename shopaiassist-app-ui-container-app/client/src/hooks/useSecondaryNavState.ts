import { useState } from 'react';

/** Hook for controlling secondary sidenav */
const useSecondaryNavState = (
  initialState: SecondaryNavState = {
    show: false,
    tree: 'manage',
  }
): [SecondaryNavState, (state: SecondaryNavState) => void] => {
  const [navState, setNavState] = useState<SecondaryNavState>(initialState);

  return [navState, setNavState];
};

export default useSecondaryNavState;
