import { useEffect, useRef } from 'react';
import { MfeContext } from '@';

import { Coordinates, FileViewerProps } from '../../../types/mfe-types';

interface FileViewerElement extends HTMLElement {
  context: MfeContext;
  fileId: string;
  page: number;
  highlights: Coordinates[];
}

/** Hook for file viewer updates */
export const useFileViewer = ({ context, fileId, page, highlights }: FileViewerProps) => {
  const fileViewerRef = useRef<FileViewerElement>(null);

  useEffect(() => {
    if (fileViewerRef.current) {
      fileViewerRef.current.context = context;
      fileViewerRef.current.fileId = fileId;
      fileViewerRef.current.page = page;
      fileViewerRef.current.highlights = highlights;
    }
  }, [context, fileId, page, highlights]);

  return fileViewerRef;
};
