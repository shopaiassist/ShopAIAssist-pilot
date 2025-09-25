// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { renderAll, snapshot, waitFor } from '../../../jest-utils';
import MainSideNav from './MainSideNav';

describe('MainSideNav', () => {
  const mockToggleExpanded = jest.fn();
  const mockSetSecondaryNavState = jest.fn();

  const props = {
    expanded: true,
    toggleExpanded: mockToggleExpanded,
    setSecondaryNavState: mockSetSecondaryNavState,
  };

  describe('render', () => {
    it('should render', async () => {
      snapshot(<MainSideNav {...props} isMobile={false} />);
    });
  });
});
