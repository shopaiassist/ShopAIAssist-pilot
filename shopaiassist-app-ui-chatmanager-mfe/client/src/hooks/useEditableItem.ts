import { useState } from 'react';

/**
 * Provides functionality for editable text fields, allowing the text to be updated locally
 * and then submitted when required. This is typically used for editable item names such as chat names.
 *
 * @param {string} initialText - The initial text value to be edited.
 * @param {(newName: string) => void} onAccept - A callback function that is called with the new text when it is submitted.
 * @returns {[(updatedName: string) => void, () => void]} A tuple containing:
 *          - {Function} updateChatName: A function to update the stateful text.
 *          - {Function} submitNewChatName: A function to submit the new text and execute the onAccept callback.
 */
const useEditableItem = (
  initialText: string,
  onAccept: (newName: string) => void
): [(updatedName: string) => void, () => void] => {
  const [text, setText] = useState(initialText);

  /**
   * Updates the current text with a new value.
   * @param {string} updatedText - The new text to be set.
   */
  const updateText = (updatedText: string) => {
    setText(updatedText);
  };

  /**
   * Submits the new text to the provided onAccept callback function.
   */
  const submitNewText = () => onAccept(text);

  return [updateText, submitNewText];
};

export default useEditableItem;
