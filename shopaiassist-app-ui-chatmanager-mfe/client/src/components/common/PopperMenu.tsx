import { Placement, PositioningStrategy, VirtualElement } from '@popperjs/core';
import { Menu } from '@on/core-components/react';
import { usePopperMenu } from '../../hooks/usePopperMenu';

interface PopperMenuProps {
  children: string | JSX.Element | JSX.Element[];
  referenceElement: Element | VirtualElement | null | undefined;
  placement?: Placement;
  strategy?: PositioningStrategy;
  offset?: [number, number];
  className?: string;
  dataTestId?: string;
}

/**
 * A component that renders a pop-up menu using the Popper.js library to handle dynamic positioning.
 * It uses the usePopperMenu custom hook to manage the positioning logic, and passes down style and attributes to the Menu component.
 *
 * @param {string | JSX.Element | JSX.Element[]} children - The content to be rendered within the pop-up menu.
 * @param {Element | VirtualElement | null | undefined} referenceElement - The element or virtual element that the pop-up menu is anchored to.
 * @param {Placement} [placement='bottom'] - The preferred placement of the pop-up menu relative to the reference element.
 * @param {PositioningStrategy} [strategy='absolute'] - The positioning strategy for the pop-up menu (fixed or absolute).
 * @param {[number, number]} offset - The offset of the popper in relation to the referenceElement [X-Axis, Y-Axis] in pixels.
 * @param {string} [className] - Additional CSS class names to apply to the menu.
 * @param {string} [dataTestId] - Optional data-testid attribute for the menu, useful for testing.
 * @returns {JSX.Element} The Menu component with applied dynamic styles and attributes for positioning.
 */
const PopperMenu = ({
  referenceElement,
  placement,
  strategy,
  offset,
  className,
  dataTestId,
  children
}: PopperMenuProps) => {
  const [styles, attributes, setPopperElement] = usePopperMenu(referenceElement, placement, strategy, offset);
  return (
    <Menu
      // @ts-expect-error: The usePopper hook is designed to directly take DOM nodes instead of refs to update dynamically as nodes change. We use a callback ref and useState to support this dynamic behavior effectively.
      ref={setPopperElement}
      density="compact"
      data-testid={dataTestId}
      className={className}
      style={styles.popper}
      id={dataTestId}
      {...attributes.popper}
    >
      {children}
    </Menu>
  );
};

export default PopperMenu;
