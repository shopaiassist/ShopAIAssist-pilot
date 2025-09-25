import { Icon, Button, Text, Textarea, Textfield } from '@on/core-components/react';
import './MatterSettings.scss';
import { useMatterSettings } from '../../hooks/useMatterSettings';
import { UpdateType } from '../../hooks/useMatterDetailsDialog';
import Translate from '../../components/i18n/Translate';
import { useTranslation } from 'react-i18next';

/**
 * The Matter Settings page c|omponent
 * This component handles edit, archive and delete actions for the current folder
 *
 * @returns {JSX.Element} The rendered MatterSettings component.
 */
const MatterSettings = () => {
  const { t } = useTranslation();
  const [
    activeFolder,
    matterName,
    matterId,
    matterDescription,
    updateMatterDetails,
    onDeleteMatter,
    onUpdateMatter,
    onArchiveMatter,
    onUnarchiveMatter
  ] = useMatterSettings();

  return (
    <div className="matter-settings-container">
      <Text appearance="heading-2xl" className="matter-settings-title">
        <Translate tKey="MATTER_SETTINGS" />
      </Text>

      <div className="matter-settings-fields">
        <Text appearance="body-default-md">{`* ${t('INDICATES_REQUIRED_FIELD')}`}</Text>
        <Textfield
          data-testid="matter-settings-name-field"
          label={t('NAME')}
          maxlength={128}
          value={matterName}
          required={true}
          invalid={!matterName}
          validationMessage={t('REQUIRED_FIELD')}
          onInput={(e) => {
            updateMatterDetails(UpdateType.NAME, e.target.value);
          }}
        />
        <Textarea
          data-testid="matter-settings-description-field"
          label={t('DESCRIPTION')}
          maxlength={2000}
          resize="vertical"
          value={matterDescription}
          onInput={(e) => {
            updateMatterDetails(UpdateType.DESCRIPTION, e.target.value);
          }}
        />
        <Textfield
          data-testid="matter-settings-id-field"
          label={t('MATTER_ID')}
          maxlength={128}
          value={matterId}
          onInput={(e) => {
            updateMatterDetails(UpdateType.ID, e.target.value);
          }}
        />

        <Button disabled={!matterName.length} onClick={onUpdateMatter} data-testid="matter-settings-update">
          <Translate tKey="UPDATE_FOLDER" />
        </Button>
      </div>

      <div className="matter-settings-bottom">
        {!activeFolder.isArchived && (
          <Button appearance="secondary" onClick={onArchiveMatter} data-testid="matter-settings-archive">
            <Icon slot="start" iconName="box-archive" />
            <Translate tKey="ARCHIVE_FOLDER" />
          </Button>
        )}
        {activeFolder.isArchived && (
          <Button appearance="secondary" onClick={onUnarchiveMatter} data-testid="matter-settings-unarchive">
            <Icon slot="start" iconName="box-archive" />
            <Translate tKey="UNARCHIVE_FOLDER" />
          </Button>
        )}
        <Button appearance="secondary" onClick={onDeleteMatter} data-testid="matter-settings-delete">
          <Icon slot="start" iconName="trash-can" />
          <Translate tKey="DELETE_MATTER" />
        </Button>
      </div>
    </div>
  );
};

export default MatterSettings;
