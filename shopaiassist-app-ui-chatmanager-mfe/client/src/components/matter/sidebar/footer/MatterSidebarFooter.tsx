import { Icon, Text } from '@on/core-components/react';
import Translate from '../../../i18n/Translate';
import { SelectableItem } from '../../../common';
import useMatterFooter from '../../../../hooks/useMatterFooter';
import { FolderItem } from '../../../../@types/sidebar';

import './MatterSidebarFooter.scss';

interface MatterSidebarFooterProps {
  activeFolder?: FolderItem;
  archivedMattersView?: boolean;
  onOpenSettings: () => void;
  onOpenMatterFiles: () => void;
  toggleArchivedMattersView: () => void;
}

/**
 * A footer component for the sidebar. It renders content depending on
 * the position inside the tree and the corresponding available options.
 *
 * @param {MatterSidebarFooterProps} props - The properties for the MatterSidebarFooter component.
 * @param {FolderItem} props.activeFolder - Object with the active folder data.
 * @param {boolean} props.archivedMattersView - Flag to indicate whether a archived matters view is active.
 * @param {() => void} props.onOpenSettings - Callback function that triggers matter settings view to be active.
 * @returns {JSX.Element} The sidebar footer containing options for the current context.
 *
 * @example
 * <MatterSidebarFooter isFolderView={true} onOpenSettings={handleOpenSettings} />
 */
const MatterSidebarFooter = ({
  activeFolder,
  archivedMattersView,
  onOpenSettings,
  onOpenMatterFiles,
  toggleArchivedMattersView
}: MatterSidebarFooterProps) => {
  const [isMatterFilesActive, isMatterSettingsActive] = useMatterFooter();
  const archiveSectionActive = !archivedMattersView && !activeFolder;
  const matterSettingsActive = !!activeFolder;

  return (
    <div className="matter-sidebar-footer">
      {(archiveSectionActive || matterSettingsActive) && <hr className="matter-sidebar-footer-separator" />}

      {archiveSectionActive && (
        <>
          <div className="matter-sidebar-archived-matters-selectable">
            <div className="matter-sidebar-archived-matters-selectable-section">
              <SelectableItem onSelect={toggleArchivedMattersView} dataTestId={`archived-matters-selectable`}>
                <div className="matter-sidebar-archived-matters-selectable-item">
                  <div>
                    <Icon appearance="light" size={16} iconName="box-archive" />
                    <Text appearance="body-strong-md" id="chat-archived-matters-navigation">
                      Archived Matters
                    </Text>
                  </div>

                  <Icon
                    className="matter-sidebar-archived-matters-selectable-icon"
                    appearance="light"
                    size={16}
                    iconName="chevron-right"
                  />
                </div>
              </SelectableItem>
            </div>
          </div>
        </>
      )}

      {matterSettingsActive && (
        <>
          <div className="matter-sidebar-footer-button-container">
            <SelectableItem
              onSelect={onOpenMatterFiles}
              selected={isMatterFilesActive}
              dataTestId="matter-files-button"
            >
              <Icon appearance={isMatterFilesActive ? 'solid' : 'light'} size={16} iconName={'files'} />
              <Text appearance="body-default-md" id={`matter-files-button`}>
                <Translate tKey="MATTER_FILES" />
              </Text>
            </SelectableItem>
            <SelectableItem
              onSelect={onOpenSettings}
              selected={isMatterSettingsActive}
              dataTestId="matter-settings-button"
            >
              <Icon appearance={isMatterSettingsActive ? 'solid' : 'light'} size={16} iconName={'gear'} />
              <Text appearance="body-default-md" id={`matter-settings-button`}>
                <Translate tKey="MATTER_SETTINGS" />
              </Text>
            </SelectableItem>
          </div>
        </>
      )}
    </div>
  );
};

export default MatterSidebarFooter;
