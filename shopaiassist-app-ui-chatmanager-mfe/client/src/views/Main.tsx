import React, { ReactNode, useState } from 'react';
import { MfeContext } from 'react';
import MatterSidebar from '../components/matter/sidebar/MatterSidebar';
import useMainView from '../hooks/useMainView';
import { MattersProps } from '../App';
import { ChatActionsDialog, ChatOrFolderMenu, MatterDetailsDialog, TypewriterText } from '../components/common';
import MatterSettings from './MatterSettings/MatterSettings';
import { Breadcrumbs } from '@reacttext/prometheus';

import './Main.scss';
import { Text } from '@on/core-components/react';
import { TYPEWRITER_DELAY } from '../utils/constatnts';

interface MainProps extends Omit<MattersProps, 'context'> {
  context: MfeContext;
}

/**
 * Main component for the Matters application.
 *
 * This component manages the main view, including the sidebar, body, and dialogs for chat and matter details.
 *
 * @param {MainProps} props - The properties for the Main component.
 * @returns {JSX.Element} The rendered Main component.
 */
const Main = (props: MainProps): JSX.Element => {
  const { isOpen, closeSidebar, createChatComponent, createFileManagementComponent, createHeaderActions } = props;
  const [
    activeChat,
    activeFolder,
    chatsAndFolders,
    breadcrumbs,
    isMatterSettingsActive,
    isMatterFilesActive,
    createPersistentChat,
    setActiveChat
  ] = useMainView(props.context);
  // eslint-disable-next-line use-encapsulation/prefer-custom-hooks
  const [menuOpen, setMenuOpen] = useState(false);

  const returnMatterBodyComponent = () => {
    if (isMatterSettingsActive) {
      return <MatterSettings />;
    } else if (isMatterFilesActive) {
      if (activeFolder) {
        return createFileManagementComponent({
          chatIdentifier: activeChat?.treeItemId as string,
          chatFolderIdentifier: activeFolder.treeItemId,
          fileCollectionId: activeFolder.fileCollectionId,
          isMatterArchived: activeFolder.isArchived || false
        }) as ReactNode;
      }
    } else {
      return createChatComponent({
        chatFolderIdentifier: activeChat?.fileCollectionId,
        chatIdentifier: activeChat?.treeItemId,
        createPersistentChat
      }) as ReactNode;
    }
  };

  return (
    <div className="main-app-container">
      <MatterSidebar
        data-testid="matters-main-view-sidebar"
        tree={chatsAndFolders}
        onNewChat={() => setActiveChat(undefined)}
        isOpen={isOpen}
        closeSidebar={closeSidebar}
      />
      <div className="main-body-container">
        <div className="main-header">
          <h4 className='chat-title' id={`chat-text-${activeChat?.treeItemId}`}>
            <TypewriterText text={activeChat?.name || ''} delay={TYPEWRITER_DELAY} />
          </h4>
          {/* <Breadcrumbs data-testid="matters-main-view-breadcrumbs" items={breadcrumbs} /> */}
          {/* <div className="main-header-actions">
            {createHeaderActions?.() as React.ReactNode}
            {!!activeChat?.treeItemId && (
              <ChatOrFolderMenu
                isOpen={menuOpen}
                itemId={activeChat?.treeItemId}
                itemType="chat"
                toggleOpen={() => setMenuOpen(!menuOpen)}
              />
            )}
          </div> */}
        </div>
        <div className="matters-ai-assistant-container">{returnMatterBodyComponent()}</div>
      </div>

      <ChatActionsDialog />
      <MatterDetailsDialog />
    </div>
  );
};

export default Main;
