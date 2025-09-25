import { MenuInstance } from '@on/core-components/dist/esm/dts/components/menu/define';
import { useEffect, useRef } from 'react';

/**
 * Custom hook to detect and call a callback function when clicking outside of the referenced element.
 * It listens for clicks on the entire document and triggers the callback if the click occurred outside
 * of the element referred to by the returned `ref`. This hook is useful for closing modals, dropdowns,
 * or any other floating UI elements when a user interacts with the rest of the application.
 *
 * @param callback - A function to be called when a click is detected outside of the referenced element.
 * @returns A ref object to be attached to the element to monitor for outside clicks.
 *
 * @example
 * // Usage within a component
 * const MyComponent = () => {
 *   const handleClose = () => console.log('User clicked outside');
 *   const ref = useOutsideClick(handleClose);
 *
 *   return (
 *     <div ref={ref}>
 *       <p>Click outside of this element to trigger a console log.</p>
 *     </div>
 *   );
 * };
 */
export const useOutsideClick = (callback: () => void) => {
  const ref = useRef<HTMLDivElement | MenuInstance>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [callback]);

  return ref;
};
