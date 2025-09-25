import React, { useMemo, useState } from 'react';
import { MfeContext } from '@';
import { i18n } from '@/';
import { SafButton, SafIcon } from '@/core-components/react';

import useMattersSideNav from '../../hooks/useMattersSideNav';
import useMfeContentComponents from '../../hooks/useMFEContent';
import useModalCommunication from '../../hooks/useModalCommunication';
import LOG, { addConsoleUtilityWithTag } from '../../services/LoggingService';
import { AiAssistantProps } from '../../types/mfe-types';
import { EmailAPI } from '../../utils/api/email';
import {
  AiAssistant,
  AiSkillChatWelcomeMessage,
  AiSkillMessage,
  AiSkills,
  MatterFileManagement,
  Matters,
  UploadButtonComponent,
} from '.';

import './MfeContent.scss';

export const useContextWithTaggedConsole = (context: MfeContext, tag: string) =>
  useMemo<MfeContext>(() => addConsoleUtilityWithTag(context, tag), [context]);

const allowedSkills = [
  'ai_assisted_legal_research',
  'ask_practical_law_ai',
  'contract_answer',
  'deposition_questions',
  'draft_correspondence',
  'review_documents',
  'sdb',
  'summarize',
  'timeline',
];

const MfeContent = ({ context }: { context: MfeContext }) => {
  const { t } = i18n.useTranslation();
  const mattersContext = useContextWithTaggedConsole(context, '[matters-mfe]');
  const aiAssistantContext = useContextWithTaggedConsole(context, '[ai-assistant-mfe]');
  const fileManagementContext = useContextWithTaggedConsole(context, '[file-management-mfe]');
  const aiSkillsContext = useContextWithTaggedConsole(context, '[ai-skills-mfe]');

  // eslint-disable-next-line use-encapsulation/prefer-custom-hooks
  const [tableView, setTableView] = useState(false);

  const emailApi = new EmailAPI();

  const [isSidebarOpen, setIsSidebarOpen] = useMattersSideNav();

  const { skillResultPanel, showSkillResult } = useMfeContentComponents({
    fileManagementContext,
    aiSkillsContext,
    aiAssistantContext,
    allowedSkills,
  });

  const renderSkillMessageForChatMessage: AiAssistantProps['messages']['skill'] = (message, opts) => {
    return (
      <AiSkillMessage
        context={aiSkillsContext}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        message={message as any}
        onCancel={(req) => opts?.cancelRequest?.(req)}
        onSubmit={(req) => opts?.executeRequest?.(req)}
        initialRequest={!!opts?.initialRequest}
        getUploadedFiles={async () => {
          LOG.log(`TODO: AiSkillSummary.getUploadedFiles() called.`);
          return [];
        }}
        onShowResult={showSkillResult}
        getEmailUrl={emailApi.getEmailUrl}
      />
    );
  };

  const renderSkillWelcomeMessage = (options: {
    onInitiateSkill: (initiateMessage: string, skillId?: string) => void;
  }) => (
    <AiSkillChatWelcomeMessage
      context={context}
      onSkillWelcomeSelected={async ({ message }) => {
        LOG.log('[olympus] AiSkillChatWelcomeMessage.onSkillWelcomeSelected() called with message:', message);
        options.onInitiateSkill(message);
      }}
    />
  );

  const renderSkills = (options: { onSkillSelected: (skill: string, skillId?: string) => void }) => (
    <AiSkills
      context={context}
      allowedSkills={allowedSkills}
      onSkillSelected={async ({ message }) => {
        LOG.log('[olympus] AiSkills.onSkillSelected() called with message:', message);
        options.onSkillSelected(message);
      }}
    />
  );

  return (
    <Matters
      isOpen={isSidebarOpen}
      closeSidebar={() => setIsSidebarOpen(false)}
      context={mattersContext}
      trackPendo={useModalCommunication().trackPendo}
      modalType={useModalCommunication().modalType}
      createChatComponent={({
        chatFolderIdentifier,
        chatIdentifier,
        fileCollectionId,
        isReadOnly,
        createPersistentChat,
      }) => (
        <div className="ai-assistant-container">
          <AiAssistant
            readOnly={isReadOnly}
            chatIdentifier={chatIdentifier}
            createNewChat={createPersistentChat}
            allowedSkills={allowedSkills as AiAssistantProps['allowedSkills']}
            context={aiAssistantContext}
            // actions={{
            //   createFileAction: (uploadButtonProps) => (
            //     <UploadButtonComponent
            //       context={fileManagementContext}
            //       chatIdentifier={chatIdentifier || ''}
            //       chatFolderIdentifier={chatFolderIdentifier}
            //       fileCollectionId={fileCollectionId || ''}
            //       {...uploadButtonProps}
            //     />
            //   ),
            //   createSkillAction: renderSkills,
            // }}
            displayTable={tableView}
            messages={{
              skill: renderSkillMessageForChatMessage,
              welcome: renderSkillWelcomeMessage,
            }}
            resultPanel={skillResultPanel || undefined}
            trackPendo={useModalCommunication().trackPendo}
          />
        </div>
      )}
      createFileManagementComponent={({ chatIdentifier, chatFolderIdentifier, fileCollectionId, isMatterArchived }) => (
        <MatterFileManagement
          context={fileManagementContext}
          chatIdentifier={chatIdentifier}
          chatFolderIdentifier={chatFolderIdentifier}
          fileCollectionId={fileCollectionId}
          readOnly={isMatterArchived}
        />
      )}
      headerActions={{
        // not sure if this should reside in olympus or be provided by the files MFE
        createFilePanel: ({ toggleFileManagement, isChatFiles }) => (
          <SafButton appearance="tertiary" density="compact" onClick={toggleFileManagement}>
            <SafIcon aria-hidden="true" icon-name="files" role="presentation" slot="start" />
            {t(isChatFiles ? 'CHAT_FILES' : 'MATTER_FILES')}
          </SafButton>
        ),
        showChatTable: () => (
          <SafButton appearance="tertiary" density="compact" onClick={() => setTableView(!tableView)}>
            <SafIcon aria-hidden="true" icon-name="square-list" role="presentation" slot="start" />
            {t('RESULTS')}
          </SafButton>
        ),
      }}
    />
  );
};

export default MfeContent;
