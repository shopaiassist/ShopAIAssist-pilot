import { Text } from '@on/core-components/react';
import MatterSidebarHeader from './header/MatterSidebarHeader';
import ChatList from './chat-list/ChatList';
import { FolderItem, TreeItem } from '../../../@types/sidebar';
import MatterSidebarNavigation from './header/MatterSidebarNavigation';
import useMeasure from 'react-use-measure';
import { animated, useSpring } from '@react-spring/web';
import { useChatSidebarStore } from '../../../store/useChatSidebarStore';
import MatterSidebarFooter from './footer/MatterSidebarFooter';

import './MatterSidebar.scss';
import classNames from 'classnames';
import { ModalType } from '../../../App';
import { useMatters } from '../../../views/Context';

interface MatterSidebarProps {
  isOpen: boolean;
  tree?: (TreeItem | FolderItem)[];
  onNewChat: () => void;
  closeSidebar: () => void;
}

/**
 * A responsive sidebar component for displaying a tree of items such as chats and folders.
 * This sidebar can be toggled to show or hide using an animated transition.
 * The component adapts to changes in the sidebar's width and employs animations for smooth transitions.
 *
 * @param {MatterSidebarProps} props - The properties for the MatterSidebar component.
 * @param {(TreeItem | FolderItem)[]} [props.tree] - Data structure representing the tree items to be displayed in the sidebar.
 * @param {() => void} props.onNewChat - Callback function that triggers when a new chat is initiated.
 * @returns {JSX.Element} The animated sidebar containing a header and a list of chat or folder items.
 *
 * @example
 * <MatterSidebar tree={treeData} onNewChat={handleNewChat} />
 */
const MatterSidebar = ({ isOpen, tree, onNewChat, closeSidebar }: MatterSidebarProps) => {
  const [measureRef, { width }] = useMeasure();
  const springProps = useSpring({
    transform: !isOpen ? `translateX(-${width}px)` : 'translateX(0px)',
    marginRight: !isOpen ? `-${width}px` : '0px'
  });
  const [
    activeFolder,
    setIsMattersettingsActive,
    setIsMatterFilesActive,
    setActiveChat,
    archivedMattersView,
    toggleArchivedMattersView
  ] = useChatSidebarStore((state) => [
    state.activeFolder,
    state.setIsMattersettingsActive,
    state.setIsMatterFilesActive,
    state.setActiveChat,
    state.archivedMattersView,
    state.toggleArchivedMattersView
  ]);
  const { modalType } = useMatters();

  return (
    <animated.div
      style={springProps}
      className={classNames('matter-sidebar-container', {
        'compact-mode': modalType === ModalType.Compact,
        'full-mode': modalType !== ModalType.Compact
      })}
    >
      <div
        ref={measureRef}
        className={classNames('matter-sidebar', {
          'compact-mode': modalType === ModalType.Compact,
          'full-mode': modalType !== ModalType.Compact
        })}
        data-testid="matter-sidebar"
        is-open={isOpen.toString()}
      >
        <MatterSidebarNavigation
          className="matter-sidebar-nav-header"
          isSubsectionView={!!activeFolder || !!archivedMattersView}
          closeSidebar={closeSidebar}
        />
        {activeFolder && (
          <div className="matter-sidebar-folder-name">
            <Text appearance="heading-lg">{activeFolder?.name}</Text>
          </div>
        )}
        {archivedMattersView && (
          <div className="matter-sidebar-folder-name">
            <Text appearance="heading-lg">Archived Matters</Text>
          </div>
        )}
        <MatterSidebarHeader
          className="matter-sidebar-header"
          onNewChat={() => {
            onNewChat();
            if (modalType === ModalType.Compact) {
              closeSidebar();
            }
          }}
          showAddChatButton={!archivedMattersView}
          isFolderView={!!activeFolder}
        />
        <ChatList chatsAndFolders={tree} closeSidebar={closeSidebar} />

        {/* <MatterSidebarFooter
          activeFolder={activeFolder}
          archivedMattersView={archivedMattersView}
          onOpenSettings={() => {
            setIsMattersettingsActive(true), setIsMatterFilesActive(false);
          }}
          onOpenMatterFiles={() => {
            setActiveChat();
            setIsMatterFilesActive(true);
          }}
          toggleArchivedMattersView={toggleArchivedMattersView}
        /> */}
      </div>
    </animated.div>
  );
};

export default MatterSidebar;
