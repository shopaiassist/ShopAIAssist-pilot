import { AiFlowMessage, AiPreparedFlowRequestMessage, SavedInputResponse, TextInputs } from '@/';
import { Chat, DatabaseInfo, DomComponent, EventHandler, FileHandle, MfeContext } from '@';
import { UploadedFile } from '@/pantheon';

import { PendoEvent } from '../hooks/useModalCommunication';
import { ModalType } from '../store/modalStore';

// These types are duplicated from their respective MFEs. They can eventually be imported from the published types
// package of each MFE (and re-exported from this file).

// --------------------------------------------------------
// Matters & Chat Management MFE
// --------------------------------------------------------

/**
 * Properties for the main Matters MFE component, which renders the left-nav, the matter details content, and hosts the
 * chat component, the footer component, and a few management buttons like 'databases'.
 *
 * MFE: matters_mfe
 * Component: ./App
 */
export * from '@/themis-mfe-client';

// --------------------------------------------------------
// AI Assistant MFE
// --------------------------------------------------------

/**
 * Properties for the AI Assistant's Chat Component, which can display either a new chat--calling onChatCreated() when
 * the user interacts enough to create a first-class persisted chat--or an existing chat, identified by chatIdentifier.
 * This component hosts other components that render chat messages specific to a skill, created via a factory function.
 *
 * MFE: ai_assistant_mfe
 * Component: ./AiAssistant
 */
export * from '@/hermes-mfe-client';

// --------------------------------------------------------
// AI Skills MFE
// --------------------------------------------------------
/** Skill Agnostic MFEs */

/**
 * Properties for the Skill MFE's ChatWelcomeMessageProps component, which returns a component that displays skill
 * buttons the user might push to start a brand-new conversation.
 *
 * MFE: ai_skills_mfe
 * Component: ./SkillChatWelcomeMessage
 */
// export { AiSkillChatWelcomeMessageProps } from '@/delphi-skills-mfe-client';

export interface AiSkillComponentWithContext {
  context: MfeContext;
}

export interface AiSkillChatWelcomeMessageProps {
  /**
   * A callback called when the user selects a skill to run, or selects "what else can you do?". Parameters include
   * the message to send in chat.
   */
  onSkillWelcomeSelected: (eventData: { message: string }) => Promise<void>;
  context: MfeContext;
}

/**
 * Properties for the Skill MFE's Skills component, which returns a component that displays a button that opens
 * a dialog with a list of skills the user can select. Parameters include the message to send in chat.
 *
 * MFE: ai_skills_mfe
 * Component: ./Skills
 */
// export { AiSkillsProps } from '@/delphi-skills-mfe-client';
export interface AiSkillsProps {
  /** the skills licensed/authorized for this user */
  allowedSkills: SkillFlowType[];
  /**
   * A callback called when the user selects a skill to run. Parameters include the message to send in chat.
   */
  onSkillSelected: (eventData: { message: string }) => Promise<void>;
  context: MfeContext;
}
export type SkillFlowType = AiFlowMessage['function_input']['request_type'] | 'deposition_questions';

/** Skill Specific MFEs */

/**
 * Properties for the Skill MFE's AiSkillMessage component, which is used to render either
 *  - a form for the user to fill out, which will be sent to the skill for processing.
 *  - a skill-specific message/history within the chat. This could display a progress indicator of a running skill,
 *    or a summary of results for a completed skill with a button to see the full results.
 *
 * MFE: ai_skills_mfe
 * Component: ./AiSkillMessage
 */
//export { AiSkillMessageProps } from '@/delphi-skills-mfe-client';
export interface AiSkillMessageProps {
  /** The context for the MFE on the app shell page, including the user and auth context. */
  context: MfeContext;
  appear?: boolean;
  errorString?: string;
  favoritesData?: InputList;
  getUploadedFiles: (fileObjects: TextInputs['data'] | string[]) => Promise<UploadedFile[] | undefined>;
  message: AiFlowMessage | AiPreparedFlowRequestMessage;
  messageShownCallback?: (id?: string) => void;
  notificationComponent?: JSX.Element;
  onCancel: (request: Chat.CancelRequest) => void;
  onError?: (error: string) => void;
  onShowResult?: (viewOptions?: ViewOptions, propsThatTheResultViewerNeeds?: AiSkillResponsePropsForwarded) => void;
  onSubmit?: (request: Chat.FormRequest) => void;
  pending?: boolean;
  savedInputComponent?: JSX.Element;
  showFavoritesModal?: (type?: string) => void;
  initialRequest?: boolean;
  /**
   * Function provided to Delphi to get the secure URL to trigger skill complete notification emails. See the Olympus readme for an explanation of how this process works.
   */
  getEmailUrl?: (skillId: string, flowId: string) => Promise<string>;
}

type SavedInputData = SavedInputResponse['data'];

type InputList = SavedInputData['input_list'];

/**
 * Properties for the Skill MFE's AiSkillResponse component, which is used to render the results of a skill's processing
 * of the user's input.
 *
 * MFE: ai_skills_mfe
 * Component: ./AiSkillResponse
 */
// export { AiSkillResponseProps } from '@/delphi-skills-mfe-client';
export interface AiSkillResponseProps {
  context: MfeContext;
  message?: AiFlowMessage;
  onCloseResult?: () => void;
  getUploadedFiles: (fileObjects: TextInputs['data'] | string[]) => Promise<UploadedFile[] | undefined>;
  updateFileViewer: (updateFileViewerProps: FileViewerPropsNoContext) => void;
  fileViewerComponent: DomComponent;
  createChatInputComponent: (props: CreateChatInputProps) => DomComponent /*React.ReactNode*/;
}

export interface CreateChatInputProps {
  chatIdentifier: string;
  formData?: Chat.FlowRequest;
  onChatSubmit?: () => void;
}

export type AiSkillResponsePropsForwarded = Omit<
  AiSkillResponseProps,
  'getShopAIAssistDownloadLink' | 'getUploadedFiles' | 'context'
>;
export interface ViewOptions {
  desiredSize?: PanelSize;
  fileViewerProps?: FileViewerPropsNoContext;
}
type PanelSize = 'half' | 'full';

// --------------------------------------------------------
// File Management MFE
// --------------------------------------------------------

/**
 * Common properties that are present in all file management components.
 */
interface BaseFileManagementProps {
  /** The context for the MFE on the app shell page, including the user and auth context. */
  context: MfeContext;
}

/**
 * Common properties that are present when a file management component is used in the context of a chat or chat folder.
 */
interface BaseFileManagementChatProps extends BaseFileManagementProps {
  /**
   * The identifier for the folder, if File Management is being displayed for a folder, or `undefined` if the
   * `fileCollectionId` is for a top-level ('Quick') chat.
   */
  chatFolderIdentifier?: string;
  /** The identifier of the chat. Usually not relevant to file management. */
  chatIdentifier: string;
  /** The identifier for the file management system's (Mercury's) collection. */
  fileCollectionId: string;
}

/**
 * Properties for the File Management MFE's UploadButtonComponent, which is used to allow the user to select files,
 * by uploading files from their device, selecting matter files, or selecting a database.
 *
 * MFE: file_management_mfe
 * Component: ./UploadButtonComponent
 */
// REVIEW: These Provider interfaces pull in onFilesSelected() and onDatabaseSelected() callbacks. Do those details need
//         to be adapted to an Angular-friendly format?
export interface UploadButtonProps extends BaseFileManagementChatProps {
  /** A callback to be called when file(s) are selected in this component. */
  onFilesSelected: EventHandler<FileHandle[]>;
  /** A callback to be called when a database is selected in this component. */
  onDatabaseSelected: EventHandler<DatabaseInfo>;
}

/**
 * Properties for the File Management MFE's UploadMessageComponent, which is used within a chat conversation to allow the
 * user to select files, by uploading files from their device, selecting matter files, or selecting a database.
 *
 * MFE: file_management_mfe
 * Component: ./UploadMessageComponent
 */
export interface UploadMessageProps extends BaseFileManagementChatProps {}

/**
 * Properties for the File Management MFE's FileViewerComponent, which is used to render the contents of an input or
 * output file.
 *
 * MFE: file_management_mfe
 * Component: ./fileViewer
 */
export interface FileViewerProps extends BaseFileManagementProps {
  fileId: string;
  page: number;
  highlights: Coordinates[];
  quoteNumber?: string;
}

export interface Coordinates {
  page: number;
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export type FileViewerPropsNoContext = Omit<FileViewerProps, 'context'>;

/**
 * Properties for the File Management MFE's FileLibraryComponent, which is used to list and manage the files within a
 * single collection, namely a chat folder containing all the files related to chats within that folder.
 *
 * REVIEW: Is this component needed?
 *
 * MFE: file_management_mfe
 * Component: ./FileLibraryComponent
 */
export interface FileLibraryProps extends BaseFileManagementProps {
  /** A unique identifier for the folder (collection of chats), which is itself associated with a Matter. */
  chatFolderIdentifier: string;
}

/**
 * Properties for the File Management MFE's DatabaseManagementComponent, which is used to list and manage all the files
 * the user has access to.
 *
 * MFE: file_management_mfe
 * Component: ./DatabaseManagementComponent
 */
export interface DatabaseManagementProps extends BaseFileManagementProps {}

/**
 * Properties for the Matter File Management component, which is used to manage the files related to a specific chat folder.
 *
 * MFE: file_management_mfe
 * Component: ./MatterFileManagement
 */
export interface MatterFileManagementProps extends BaseFileManagementChatProps {
  /**
   * Whether the list of files should be treated as read-only (typically because the chat folder has been archived).
   */
  readOnly?: boolean;
}

export type PendoProps = {
  trackPendo: (pendoEvent: PendoEvent) => void;
};

export type ModalProps = {
  modalType: ModalType;
};
