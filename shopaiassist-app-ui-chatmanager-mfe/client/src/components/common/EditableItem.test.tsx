import { act, fireEvent, renderWithI18n, snapshot, waitFor } from '../../../jest-utils';
import EditableItem from './EditableItem';

const getMockedComponent = (opts: { initialValue: string; onAccept: (newName: string) => void }) => {
  return <EditableItem initialValue={opts.initialValue} onAccept={opts.onAccept} />;
};

describe('EditableItem Tests', () => {
  describe('render', () => {
    it('should render', async () => {
      snapshot(getMockedComponent({ initialValue: 'Hello', onAccept: () => {} }));
    });
  });

  describe('user action', () => {
    const mockOnAccept = jest.fn();
    it('should change name of item', async () => {
      const component = getMockedComponent({ initialValue: 'Hello', onAccept: mockOnAccept });
      const wrapper = renderWithI18n(component);

      const textField = wrapper.getByTestId(`editable-text-field`);
      textField.click();
      fireEvent.change(textField, { target: { value: 'new name' } });
      await act(() => waitFor(() => wrapper.rerender(component)));
      const submitButton = wrapper.getByTestId(`editable-item-submit`);
      submitButton.click();
      await act(() => waitFor(() => wrapper.rerender(component)));

      expect(mockOnAccept).toHaveBeenCalledWith('new name');
    });
  });
});
