import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/** Hook for managing which nav menu item in a SideNav component is currently selected */
const useSelectedMenuItem = (tree: NavMenuTree, initialState = ''): [string, (val: string) => void] => {
  const location = useLocation();
  const allMenuItems = Object.values(tree).reduce((group, val) => group.concat(val), []);

  useEffect(() => {
    const path = location.pathname;
    const pathParts = path.split('/').filter(Boolean);
    // Find the matching menu item based on the path
    let menuItem = allMenuItems.find((item) => item.navPath === path);
    // If no match, try to find an item with a secondaryNavTree name that matches the first part of the path
    if (!menuItem && pathParts.length > 1) {
      menuItem = allMenuItems.find((item) => item.secondaryNavTree === pathParts[0]);
    }
    if (menuItem) {
      setSelectedMenuItem(menuItem.id);
    }
  }, [location]);

  const [selectedMenuItem, setSelectedMenuItem] = useState(initialState);
  return [selectedMenuItem, setSelectedMenuItem];
};

export default useSelectedMenuItem;
