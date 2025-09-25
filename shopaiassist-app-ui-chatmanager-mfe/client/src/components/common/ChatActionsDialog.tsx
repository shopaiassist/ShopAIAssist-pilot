import { Alert, Button, Dialog, Text, Textfield } from '@on/core-components/react';
import Translate from '../i18n/Translate';
import { useTranslation } from 'react-i18next';
import useChatActionsDialog from '../../hooks/useChatActionsDialog';
import { ChatDialogState } from '../../store/useModalStore';

import './ChatActionsDialog.scss';

/**
 * ChatActionsDialog component handles the UI for various chat actions such as renaming and deleting a chat.
 * It uses Dialog for the modal, Textfield for input, and Button for actions.
 *
 * The component dynamically switches between different states (like deleting a chat or renaming it)
 * and updates its content accordingly using the state and actions from the `useChatActionsDialog` hook.
 *
 * @component
 * @returns {JSX.Element} The rendered ChatActionsDialog component.
 */
const ChatActionsDialog = () => {
  const [dialogCopy, chatName, hideModal, modalState, onUpdateChatName, onCancel, onModalAction, dismiss] =
    useChatActionsDialog();
  const { t } = useTranslation();
  return (
    <Dialog
      hidden={hideModal}
      dialogTitle={t(dialogCopy.title)}
      isFooter="true"
      onClose={onCancel}
      onHide={dismiss}
      className="chat-actions-dialog"
    >
      <div className="chat-actions-dialog-body">
        {modalState === ChatDialogState.DELETE_CHAT ? (
          <Alert appearance="error" hideCloseButton={true}>
            <Translate tKey="CONFIRM_CHAT_DELETE" />
          </Alert>
        ) : (
          <div className="chat-rename-field">
            <Text appearance="heading-md">{`* ${t('INDICATES_REQUIRED_FIELD')}`}</Text>
            <Textfield
              data-testid="chat-name-field"
              label={`${t('NAME')}*`}
              maxlength={128}
              value={chatName}
              onInput={(e) => {
                onUpdateChatName(e.target.value);
              }}
            />
          </div>
        )}
      </div>
      <div slot="footer" className="delete-dialog-footer">
        <Button data-testid="chat-dialog-cancel" appearance="secondary" onClick={onCancel}>
          <Translate tKey={'CANCEL'} />
        </Button>
        <Button
          data-testid="chat-dialog-action"
          appearance="primary"
          disabled={!chatName?.length}
          onClick={onModalAction}
        >
          <Translate tKey={dialogCopy.actionButton} />
        </Button>
      </div>
    </Dialog >
  );
};
export default ChatActionsDialog;
