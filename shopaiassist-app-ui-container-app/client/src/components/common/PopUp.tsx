import { PropsWithChildren } from 'react';
import { ClickOutside } from '@/';
import { SafAnchoredRegionProps, SafAnchorRegion } from '@/core-components/react';

import usePopUp from '../../hooks/usePopUp';

export interface TriggerElementProps {
  /** Id provided to the trigger element to anchor the pop-up */
  id: string;
  /** Toggles the pop-up */
  togglePopUp: () => void;
}

interface PopUpProps extends Exclude<SafAnchoredRegionProps, 'anchor'> {
  /** Function to render the element that will open/close the pop-up */
  renderTriggerElement: (props: TriggerElementProps) => JSX.Element;
}

/**
 * A component that renders a pop-up along with its trigger element.
 * The trigger element is rendered using the `renderTriggerElement` function that is provided with its id (that is used to link the pop-up's anchor region) and an utility to toggle the pop-up.
 * The pop up content is provided as the child element of this component.
 * The placement of the pop-up is managed using SafAnchoredRegionProps.
 */
const PopUp = ({ children: popUpContent, renderTriggerElement, ...props }: PropsWithChildren<PopUpProps>) => {
  const [anchorId, isPopUpOpen, setIsPopUpOpen, togglePopUp] = usePopUp(false);
  return (
    <ClickOutside action={() => setIsPopUpOpen(false)}>
      {renderTriggerElement({ id: anchorId, togglePopUp })}
      <SafAnchorRegion
        anchor={anchorId}
        horizontalDefaultPosition="center"
        verticalDefaultPosition="bottom"
        horizontalPositioningMode="locktodefault"
        verticalPositioningMode="locktodefault"
        style={{ zIndex: 'var(--saf-z-index-dropdown)' }}
        {...props}
      >
        {isPopUpOpen && popUpContent}
      </SafAnchorRegion>
    </ClickOutside>
  );
};

export default PopUp;
