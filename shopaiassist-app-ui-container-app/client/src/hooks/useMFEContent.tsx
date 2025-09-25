import React, { useCallback, useMemo } from 'react';
import { DomComponent, MfeContext } from '@';
import { PanelSize } from '@/hermes-mfe-client';

import { AiChatInput, AiSkillResponse } from '../components/mfes';
import FileViewerComponent from '../components/mfes/FileManagement/FileViewerComponent';
import LOG from '../services/LoggingService';
import {
  AiChatInputProps,
  AiSkillResponsePropsForwarded,
  CreateChatInputProps,
  FileViewerPropsNoContext,
  ViewOptions,
} from '../types/mfe-types';
import useStableState from './useStableState';

/** Hook for MFE content components (i.e. to handle updates of file viewer props or the skill response) */
const useMfeContentComponents = (contexts: {
  fileManagementContext: MfeContext;
  aiSkillsContext: MfeContext;
  aiAssistantContext: MfeContext;
  allowedSkills: string[];
}) => {
  const { fileManagementContext, aiSkillsContext, aiAssistantContext, allowedSkills } = contexts;

  const [desiredSize, setDesiredSize] = useStableState<PanelSize>('none');
  const [skillResultPanelProps, setSkillResultPanelProps] = useStableState<AiSkillResponsePropsForwarded | null>(null);
  const [fileViewerProps, setFileViewerProps] = useStableState<FileViewerPropsNoContext | null>(null);

  const getUploadedFiles = useCallback(async () => {
    LOG.log(`TODO: getUploadedFiles() called.`);
    return [];
  }, []);

  const closeSkillResult = useCallback(() => {
    LOG.info(`Closing result panel.`);
    setSkillResultPanelProps(null);
    setDesiredSize('none');
  }, [setSkillResultPanelProps]);

  const createChatInputComponent = useCallback(
    (createChatInputProps: CreateChatInputProps) => (
      <AiChatInput
        allowedSkills={allowedSkills as AiChatInputProps['allowedSkills']}
        context={aiAssistantContext}
        chatIdentifier={createChatInputProps.chatIdentifier || ''}
      />
    ),
    [aiAssistantContext, allowedSkills]
  );

  const updateFileViewer = useCallback(
    (selectedFileInfo: FileViewerPropsNoContext) => {
      LOG.info(`Updating file viewer with selected file info.`, { selectedFileInfo });
      setFileViewerProps(selectedFileInfo);
    },
    [setFileViewerProps]
  );

  const fileViewer = useMemo(
    () => (
      <FileViewerComponent
        context={fileManagementContext}
        fileId={fileViewerProps?.fileId || ''}
        page={fileViewerProps?.page || 1}
        highlights={fileViewerProps?.highlights || []}
      />
    ),
    [fileManagementContext, fileViewerProps]
  );

  const skillResultPanel = useMemo(
    () => ({
      content: (
        <AiSkillResponse
          context={aiSkillsContext}
          getUploadedFiles={getUploadedFiles}
          onCloseResult={closeSkillResult}
          updateFileViewer={updateFileViewer}
          fileViewerComponent={fileViewer}
          createChatInputComponent={createChatInputComponent}
          {...skillResultPanelProps}
        />
      ) as DomComponent,
      desiredSize: desiredSize || 'none',
    }),
    [
      aiSkillsContext,
      getUploadedFiles,
      closeSkillResult,
      createChatInputComponent,
      updateFileViewer,
      fileViewer,
      skillResultPanelProps,
      desiredSize,
    ]
  );

  const showSkillResult = useCallback(
    (viewOptions?: ViewOptions, propsThatTheResultViewerNeeds?: AiSkillResponsePropsForwarded) => {
      LOG.info(`Showing result panel.`, { viewOptions, propsThatTheResultViewerNeeds });
      setDesiredSize(viewOptions?.desiredSize || 'full');
      setSkillResultPanelProps(propsThatTheResultViewerNeeds || null);
      setFileViewerProps(viewOptions?.fileViewerProps || null);
    },
    [setDesiredSize, setSkillResultPanelProps, setFileViewerProps]
  );

  return {
    desiredSize,
    skillResultPanel,
    showSkillResult,
  };
};

export default useMfeContentComponents;
