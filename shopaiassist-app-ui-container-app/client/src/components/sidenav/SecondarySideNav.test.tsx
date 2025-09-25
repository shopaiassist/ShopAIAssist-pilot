// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { renderAll, snapshot, waitFor } from '../../../jest-utils';
import SecondarySideNav from './SecondarySideNav';

describe('SecondarySideNav', () => {
  const mockOnClose = jest.fn();

  describe('render', () => {
    it('should render manage tree', async () => {
      snapshot(<SecondarySideNav tree="manage" closeNav={mockOnClose} isMobile={false} toggleMainNav={() => {}} />);
    });
    it('should render admin tree', async () => {
      snapshot(<SecondarySideNav tree="admin" closeNav={mockOnClose} isMobile={false} toggleMainNav={() => {}} />);
    });
    it('should render support tree', async () => {
      snapshot(<SecondarySideNav tree="support" closeNav={mockOnClose} isMobile={false} toggleMainNav={() => {}} />);
    });
    it('should render legal tree', async () => {
      snapshot(<SecondarySideNav tree="legal" closeNav={mockOnClose} isMobile={false} toggleMainNav={() => {}} />);
    });
  });
});
