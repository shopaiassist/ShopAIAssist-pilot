import { Placement, PositioningStrategy, VirtualElement } from '@popperjs/core';
import { Dispatch, SetStateAction, useState } from 'react';
import { usePopper } from 'react-popper';

/**
 * Custom hook that integrates with the react-popper library to manage and apply positioning logic to pop-up elements.
 * This hook is designed to create a popper instance that can be attached to a pop-up component (like a menu or tooltip)
 * and control its positioning relative to a reference element in the DOM.
 *
 * @param {Element | VirtualElement | null | undefined} referenceElement - The DOM element or virtual element that the pop-up is anchored to.
 * @param {Placement | undefined} placement - The preferred placement of the pop-up relative to the reference element.
 * @param {PositioningStrategy | undefined} strategy - The strategy for the positioning of the pop-up (e.g., 'absolute' or 'fixed').
 * @param {[number, number]} offset - The offset of the popper in relation to the referenceElement [X-Axis, Y-Axis] in pixels.
 * @returns {[
 *   { [key: string]: React.CSSProperties }, // Styles computed by Popper.js for the pop-up element.
 *   { [key: string]: { [key: string]: string } | undefined }, // Attributes provided by Popper.js to apply to the pop-up for proper positioning.
 *   Dispatch<SetStateAction<null>> // Setter function to assign a ref to the pop-up element.
 * ]} A tuple containing the styles and attributes for the pop-up element, and a setter function for the popper element's ref.
 *
 * @example
 * const [popperStyles, popperAttributes, setPopperElement] = usePopperMenu(refElement, 'bottom', 'absolute');
 * // Use `setPopperElement` to bind the popper to the component's ref
 * // Apply `popperStyles` and `popperAttributes` to the component for correct positioning
 */
export const usePopperMenu = (
  referenceElement: Element | VirtualElement | null | undefined,
  placement?: Placement,
  strategy?: PositioningStrategy,
  offset: [number, number] = [0, 0]
): [
  {
    [key: string]: React.CSSProperties;
  },
  {
    [key: string]:
      | {
          [key: string]: string;
        }
      | undefined;
  },
  Dispatch<SetStateAction<null>>
] => {
  const [popperElement, setPopperElement] = useState(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: placement,
    strategy: strategy,
    modifiers: [{ name: 'offset', options: { offset: offset } }]
  });

  return [styles, attributes, setPopperElement];
};
