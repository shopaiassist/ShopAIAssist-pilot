import React from 'react';

import { FileViewerProps } from '../../../types/mfe-types';
import { AngularMFELoader } from '../../loaders';
import { useFileViewer } from './useFileViewer';

/**
 * File Viewer Component
 *
 * @param context The context for the MFE on the app shell page, including the user and auth context.
 * @param fileId The unique identifier for the file to be viewed.
 * @param page The page number to be displayed.
 * @param highlights The coordinates of the highlights to be displayed. (Optional)
 * @constructor
 */
const FileViewerComponent = ({ context, fileId, page, highlights }: FileViewerProps) => {
  const fileViewerRef = useFileViewer({ context, fileId, page, highlights });

  return (
    <div style={{ height: '100%', width: '100%', display: 'flex' }}>
      <AngularMFELoader
        module="./fileViewer"
        scope="file_management_mfe"
        url={process.env.FILE_MANAGEMENT_REMOTE_ENTRY_URL || ''}
        elementId="fileViewer"
      />
      {React.createElement('app-file-viewer', {
        ref: fileViewerRef,
        style: { flex: 1, display: 'flex', width: '100%', height: '100%' },
      })}
    </div>
  );
};

export default FileViewerComponent;
