import { Button, Icon, Textfield } from '@on/core-components/react';
import useEditableItem from '../../hooks/useEditableItem';

import './EditableItem.scss';
interface SelectableItemProps {
  initialValue: string;
  onAccept: (newName: string) => void;
  onCancel?: () => void;
}

/**
 * A component that provides an editable text field with accept and cancel buttons.
 * Utilizes useEditableItem for handling name updates and submissions.
 *
 * @param {string} initialValue - The initial value for the editable text field.
 * @param {(newName: string) => void} onAccept - Callback function that is called when the new name is submitted.
 * @param {() => void} [onCancel] - Optional callback function that is called when editing is canceled.
 * @returns {JSX.Element} The rendered component with a text field and control buttons.
 */
const EditableItem = ({ initialValue, onAccept, onCancel }: SelectableItemProps) => {
  const [updateText, submitNewText] = useEditableItem(initialValue, onAccept);
  return (
    <div className="editable-item">
      <Textfield
        data-testId="editable-text-field"
        initialValue={initialValue}
        onChange={(event) => {
          updateText(event.target.value);
        }}
        autoFocus={true}
      ></Textfield>
      <div className="button-container">
        <Button className="editable-item-button" onClick={submitNewText} data-testId="editable-item-submit">
          <Icon iconName="check" />
        </Button>
        <Button
          className="editable-item-button"
          appearance="secondary"
          onClick={onCancel}
          data-testId="editable-item-cancel"
        >
          <Icon iconName="close" />
        </Button>
      </div>
    </div>
  );
};

export default EditableItem;
