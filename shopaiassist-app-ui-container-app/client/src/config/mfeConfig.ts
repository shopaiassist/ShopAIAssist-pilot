/** This file contains the configuration for the micro frontends to load */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mfeConfig: { [k: string]: ReactMfeLoaderConfig<any> | AngularMfeLoaderConfig<any> } = {
  /** AI Assistant MFE */
  ai_assistant_mfe: {
    url: process.env.AI_ASSISTANT_REMOTE_ENTRY_URL || '',
    scope: 'ai_assistant_mfe',
    module: './AiAssistant',
  },
  ai_chat_input_mfe: {
    url: process.env.AI_ASSISTANT_REMOTE_ENTRY_URL || '',
    scope: 'ai_assistant_mfe',
    module: './AiChatInput',
  },

  /** AI Skills MFE */
  // Skill Agnostic
  ai_skill_chat_welcome_message_mfe: {
    url: process.env.AI_SKILLS_REMOTE_ENTRY_URL || '',
    scope: 'ai_skills_mfe',
    module: './AiSkillChatWelcomeMessage',
  },
  ai_skills_mfe: {
    url: process.env.AI_SKILLS_REMOTE_ENTRY_URL || '',
    scope: 'ai_skills_mfe',
    module: './AiSkills',
  },
  // Skill Specific
  ai_skill_response_mfe: {
    url: process.env.AI_SKILLS_REMOTE_ENTRY_URL || '',
    scope: 'ai_skills_mfe',
    module: './AiSkillResponse',
  },
  ai_skill_message_mfe: {
    url: process.env.AI_SKILLS_REMOTE_ENTRY_URL || '',
    scope: 'ai_skills_mfe',
    module: './AiSkillMessage',
  },
  ai_skill_favorites_mfe: {
    url: process.env.AI_SKILLS_REMOTE_ENTRY_URL || '',
    scope: 'ai_skills_mfe',
    module: './Favorites',
  },

  /** Matters MFE */
  matters_mfe: {
    url: process.env.MATTERS_REMOTE_ENTRY_URL || '',
    scope: 'matters_mfe',
    module: './App',
  },

  /** Files MFE */
  file_management_mfe: {
    url: process.env.FILE_MANAGEMENT_REMOTE_ENTRY_URL || '',
    scope: 'file_management_mfe',
    module: './fileManagement',
    elementId: 'fileManagement',
  },
  file_management_upload_button_mfe: {
    url: process.env.FILE_MANAGEMENT_REMOTE_ENTRY_URL || '',
    scope: 'file_management_mfe',
    module: './UploadButtonComponent',
    elementId: 'fileManagementUploadButton',
  },
  file_management_database_management_mfe: {
    url: process.env.FILE_MANAGEMENT_REMOTE_ENTRY_URL || '',
    scope: 'file_management_mfe',
    module: './DatabaseManagementComponent',
    elementId: 'databaseManagement',
  },
  file_management_matter_file_management_mfe: {
    url: process.env.FILE_MANAGEMENT_REMOTE_ENTRY_URL || '',
    scope: 'file_management_mfe',
    module: './FileLibraryComponent',
    elementId: 'appFileLibrary',
  },
};

export type MfeIdentifier = keyof typeof mfeConfig;
