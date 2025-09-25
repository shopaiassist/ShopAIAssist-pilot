/* eslint-disable @typescript-eslint/no-explicit-any */
import { TextInputs } from '@/';
import { SummarizeRequest, UploadedFile } from '@/pantheon';
import { Text } from '@/';
import { Box } from '@mui/material';

import AiSkillChatWelcomeMessage from '../components/mfes/AiSkillChatWelcomeMessage';
import AiSkillForm from '../components/mfes/AiSkillForm';
import AiSkillResponse from '../components/mfes/AiSkillResponse';
import AiSkillSummary from '../components/mfes/AiSkillSummary';
import LOG from '../services/LoggingService';
import { AiSkillFormProps, AiSkillResponseProps, AiSkillSummaryProps } from '../types/mfe-types';

// Just a generic example to confirm that the AiSkills components are rendering correctly within olympus

const preparedMessage = {
  id: '6a4f6705-55f1-46ec-a2a1-1b233219f072',
  sent_time: '2024-04-23T22:54:56.322484+00:00',
  sender: 'ai',
  message_type: 'request',
  message: 'I understand you want to summarize the document ShopAIAssist_ai_assisted_legal_research_2024_04_18.docx.',
  system_flags: [],
  cancelled: false,
  function_input: {
    request_type: 'summarize',
    chat_id: 'b0d93405-0ff8-4eda-bb4d-a76c3893ec9f',
    content: '',
    summary_type: 'DETAILED',
    text: {
      data: [
        {
          type: 'filestore',
          ids: ['d58bf9e9-0507-416f-8ff5-c449de33ba59'],
        },
      ],
    },
    user_instruction: null,
  },
  flow_id: 'c0e974ab-7b1b-470b-b34f-8be65b518ecf',
};

const flowInput = {
  request_type: 'summarize',
  summary_type: 'BRIEF',
  text: {
    data: [
      {
        type: 'filestore',
        ids: ['d58bf9e9-0507-416f-8ff5-c449de33ba59'],
      },
    ],
  },
  user_instruction: null,
  ran_from_chat: false,
  chat_id: 'b0d93405-0ff8-4eda-bb4d-a76c3893ec9f',
} as any as SummarizeRequest;

const flowId = 'c0e974ab-7b1b-470b-b34f-8be65b518ecf';

const getShopAIAssistDownloadLink = (flowId: string) => {
  return 'https://www.example.com/' + flowId; // dummy link
};

const onSkillWelcomeSelected = async (evtData: { message: string }) => {
  LOG.log(evtData);
  // fake delay to mimic async behavior
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, 2000);
  });
};

// TODO: this should get replaced with  or Pantheon passing through the requisite data to render directly
// at no point should it be required to fetch the data from the shell app
// Sample get uploaded files function
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getUploadedFiles = (fileObjects: TextInputs['data'] | string[]) => {
  return new Promise<UploadedFile[] | undefined>((resolve) => {
    resolve([
      {
        name: 'file1.pdf',
        handle: '123',
        type: 'application/pdf',
        size: 123456,
      },
      {
        name: 'file2.docx',
        handle: '456',
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 654321,
      },
    ]);
  });
};

const AiSkillsSampleDisplay = () => {
  const RequestFlowType = preparedMessage?.function_input?.request_type;
  const ResponseFlowType = flowInput?.request_type;
  const skillResponseProps: AiSkillResponseProps = {
    skill: ResponseFlowType,
    props: { flowId, getShopAIAssistDownloadLink, getUploadedFiles },
  };

  const skillSummaryProps: AiSkillSummaryProps = {
    skill: ResponseFlowType,
    props: {
      flowId,
      input: flowInput as any,
      getUploadedFiles,
      onCancel: () => {},
      viewResult: () => {},
    },
  };

  const skillFormProps: AiSkillFormProps = {
    skill: RequestFlowType,
    props: {
      appear: true,
      message: preparedMessage as any,
      errorString: 'oopsie doopsies',
      pending: false,
      requiresIntegration: false,
      /**
       * Get the callback URL for onepass
       * @returns The callback URL for the onepass
       */
      getOnePassCallbackUrl: () => 'https://www.casetext.com',

      /**
       * Called when the form is submitted
       * @param function_input - The input from the form
       * @param message_id - The message id
       */
      onSubmit: ({ function_input, message_id }) => {
        LOG.log('Submitted:', function_input, message_id);
      },

      /**
       * Called when the form is cancelled
       */
      onCancel: () => {
        LOG.log('Cancelled');
      },

      /**
       * Called when errors occur in the form
       */
      onError: (error) => {
        LOG.error('Error:', error);
      },

      /**
       * Called when the form is shown initially
       * used to disable form appear
       * @param id - The id of the message shown
       */
      messageShownCallback: (id?: string) => {
        LOG.log('Message shown:', id);
      },
    },
  };

  /**
   * Renders the skill input form for the selected chat request message
   * @returns The skill input form for the selected chat request message
   */
  const renderSkillForm = () => {
    return (
      <>
        <Text>The skill input form for the selected chat request message:</Text>
        <Box my={2} p={1} border={'2px dotted purple'}>
          <AiSkillForm {...skillFormProps} />
        </Box>
      </>
    );
  };

  /**
   * Renders the skill chat message summary for the selected chat flow message
   * @returns The skill chat message summary for the selected chat flow message
   */
  const renderSkillSummary = () => {
    return (
      <>
        <Text>The skill summary for the selected chat flow message</Text>
        <Box my={2} p={1} border={'2px dotted purple'}>
          <AiSkillSummary {...skillSummaryProps} />
        </Box>
      </>
    );
  };

  /**
   * Renders the skill response for the selected chat flow message
   * @returns The skill response for the selected chat flow message
   */
  const renderSkillResponse = () => {
    return (
      <>
        <Text>The skill response for the selected chat flow message</Text>
        <Box my={2} p={1} border={'2px dotted purple'}>
          <AiSkillResponse {...skillResponseProps} />
        </Box>
      </>
    );
  };

  const renderSkillChatWelcomeMessage = () => {
    return (
      <>
        <Text>The chat welcome message display - skill agnostic</Text>
        <Box my={2} p={1} border={'2px dotted purple'}>
          <AiSkillChatWelcomeMessage onSkillWelcomeSelected={onSkillWelcomeSelected} />
        </Box>
      </>
    );
  };

  return (
    <Box>
      {renderSkillChatWelcomeMessage()}
      {renderSkillForm()}
      {renderSkillSummary()}
      {renderSkillResponse()}
    </Box>
  );
};

export default AiSkillsSampleDisplay;
