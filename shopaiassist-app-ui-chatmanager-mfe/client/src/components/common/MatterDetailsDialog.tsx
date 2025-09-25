import { Dialog, Button, Textfield, Textarea, Text, Alert } from '@on/core-components/react';
import Translate from '../i18n/Translate';
import { useTranslation } from 'react-i18next';
import { UpdateType, useMatterDetailsDialog } from '../../hooks/useMatterDetailsDialog';
import { MatterDialogState, useMatterActionsStore } from '../../store/useMatterActionsStore';

import './MatterDetailsDialog.scss';

/**
 * MatterDetailsDialog component provides a dialog interface for creating or updating matter details.
 *
 * The dialog includes input fields for matter name, description, and ID, with validation and state management
 * provided through custom hooks. It utilizes Dialog, Button, Textfield, and Textarea components
 * from the '@on/core-components/react' library for its UI elements.
 *
 * @component
 * @example
 * return (
 *   <MatterDetailsDialog />
 * )
 */
const MatterDetailsDialog = () => {
  const { t } = useTranslation();
  const [dialogState, hideMatterActionsDialog, toggleMatterDialog] = useMatterActionsStore((state) => [
    state.dialogState,
    state.hideMatterActionsDialog,
    state.toggleMatterDialog
  ]);
  const [matterName, matterId, matterDescription, dialogCopy, updateMatterDetails, dialogAction] =
    useMatterDetailsDialog();

  return (
    <Dialog
      hidden={hideMatterActionsDialog}
      dialogTitle={t(dialogCopy.title)}
      isFooter="true"
      onClose={() => toggleMatterDialog(MatterDialogState.NEW_MATTER, undefined)}
      className="matter-details-dialog"
    >
      <div className="matter-details-dialog-body">
        {dialogState === MatterDialogState.DELETE_MATTER && (
          <Alert hideCloseButton={true} appearance="error">
            {t(dialogCopy.subTitle)}
          </Alert>
        )}
        <Text appearance="heading-md">{`* ${t('INDICATES_REQUIRED_FIELD')}`}</Text>
        <Textfield
          data-testid="matter-dialog-name-field"
          label={`${t('NAME')}*`}
          maxlength={128}
          value={matterName}
          disabled={dialogState === MatterDialogState.DELETE_MATTER || dialogState === MatterDialogState.ARCHIVE_MATTER}
          onInput={(e) => {
            updateMatterDetails(UpdateType.NAME, e.target.value);
          }}
        />
        <Textarea
          data-testid="matter-dialog-description-field"
          label={t('DESCRIPTION')}
          maxlength={2000}
          resize="vertical"
          value={matterDescription}
          disabled={dialogState === MatterDialogState.DELETE_MATTER || dialogState === MatterDialogState.ARCHIVE_MATTER}
          onInput={(e) => {
            updateMatterDetails(UpdateType.DESCRIPTION, e.target.value);
          }}
        />
        <Textfield
          data-testid="matter-dialog-id-field"
          label={t('MATTER_ID')}
          maxlength={128}
          value={matterId}
          disabled={dialogState === MatterDialogState.DELETE_MATTER || dialogState === MatterDialogState.ARCHIVE_MATTER}
          onChange={(e) => {
            updateMatterDetails(UpdateType.ID, e.target.value);
          }}
        />
      </div>
      <div slot="footer" className="matter-details-dialog-footer">
        <Button
          appearance="secondary"
          onClick={() => toggleMatterDialog(MatterDialogState.NEW_MATTER, undefined)}
          data-testid="matter-dialog-close"
        >
          <Translate tKey={'CANCEL'} />
        </Button>
        <Button
          disabled={!matterName.length}
          appearance="primary"
          onClick={dialogAction}
          data-testid="matter-dialog-confirm"
        >
          <Translate tKey={dialogCopy.actionButton} />
        </Button>
      </div>
    </Dialog>
  );
};

export default MatterDetailsDialog;
