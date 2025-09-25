import { CSSProperties } from 'react';
import { MfeContext, UserAuth } from 'react';

import { MattersProps } from './App';

// In this test harness, mark dummy components we expect to be provided externally at runtime with an ugly recognizable
// border.
const ExternalComponent = ({ children, style }: { children: React.ReactNode; style?: CSSProperties }) => (
  <div
    style={{
      display: 'flex',
      width: '50%',
      border: `0.125rem solid purple`,
      gap: '1rem',
      padding: '1rem',
      ...style
    }}
  >
    {children}
  </div>
);

export const TEST_PROPS: MattersProps = {
  context: {
    user: {
      firstName: 'Hunter',
      lastName: 'Nenneau'
    },
    getAuthToken: () => {
      return new Promise((resolve) => {
        resolve({
          /* eslint-disable  @typescript-eslint/no-explicit-any */
          tokenType: 'op-orch' as any,
          productId: 'SHOPAIASSIST',
          bearerToken:
            ''
        } as UserAuth);
      });
    }
  } as MfeContext,
  createChatComponent: ({ chatIdentifier, chatFolderIdentifier, createPersistentChat }) => (
    <ExternalComponent style={{ width: '100%', height: '100%' }}>
      {chatIdentifier ? (
        `Chat Component for chat ${chatIdentifier}${chatFolderIdentifier ? ' within ' + chatFolderIdentifier : ''}.`
      ) : (
        <button onClick={() => createPersistentChat(chatFolderIdentifier)}>Button for new chat</button>
      )}
    </ExternalComponent>
  ),
  createFileManagementComponent: ({ chatIdentifier, chatFolderIdentifier, fileCollectionId, isMatterArchived }) => (
    <ExternalComponent>
      File Management Component for collection {fileCollectionId} (
      {chatIdentifier ? 'chat ' + chatIdentifier + ' ' : ''}
      {chatFolderIdentifier ? 'within folder ' + chatFolderIdentifier : ''}) that is{' '}
      {isMatterArchived ? 'archived' : 'not archived'}
    </ExternalComponent>
  ),
  isOpen: true,
  closeSidebar: () => {}
};
