import { AiAssistantProps, AiChatInputProps } from '@/hermes-mfe-client';

import { mfeConfig } from '../../config/mfeConfig';
import {
  AiSkillChatWelcomeMessageProps,
  AiSkillComponentWithContext,
  AiSkillMessageProps,
  AiSkillResponseProps,
  AiSkillsProps,
  DatabaseManagementProps,
  FileLibraryProps,
  MatterFileManagementProps,
  MattersProps,
  ModalProps,
  PendoProps,
  UploadButtonProps,
} from '../../types/mfe-types';
import { AngularMFELoader, ReactMFELoader } from '../loaders';

/** Helper function to create references to MFEs with defined props */
const createMfe =
  <P extends object>(cfg: AngularMfeLoaderConfig<P> | ReactMfeLoaderConfig<P>) =>
  (props: P) =>
    !(cfg as AngularMfeLoaderConfig).elementId
      ? ReactMFELoader<P>({ ...cfg, props })
      : AngularMFELoader<P>({ ...(cfg as AngularMfeLoaderConfig), props });

export const AiAssistant = createMfe<AiAssistantProps & PendoProps>(mfeConfig.ai_assistant_mfe);
export const AiChatInput = createMfe<AiChatInputProps>(mfeConfig.ai_chat_input_mfe);
export const AiSkillChatWelcomeMessage = createMfe<AiSkillChatWelcomeMessageProps>(
  mfeConfig.ai_skill_chat_welcome_message_mfe
);
export const AiSkillResponse = createMfe<AiSkillResponseProps>(mfeConfig.ai_skill_response_mfe);
export const AiSkillMessage = createMfe<AiSkillMessageProps>(mfeConfig.ai_skill_message_mfe);
export const AiSkills = createMfe<AiSkillsProps>(mfeConfig.ai_skills_mfe);
export const ManageFavorites = createMfe<AiSkillComponentWithContext>(mfeConfig.ai_skill_favorites_mfe);
export const FileManagement = createMfe<FileLibraryProps>(mfeConfig.file_management_mfe);
export const Matters = createMfe<MattersProps & PendoProps & ModalProps>(mfeConfig.matters_mfe);
export const UploadButtonComponent = createMfe<UploadButtonProps>(mfeConfig.file_management_upload_button_mfe);
export const DatabaseManagement = createMfe<DatabaseManagementProps>(mfeConfig.file_management_database_management_mfe);
export const MatterFileManagement = createMfe<MatterFileManagementProps>(
  mfeConfig.file_management_matter_file_management_mfe
);
