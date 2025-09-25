import { Schema } from 'mongoose';
import { FolderItem } from '../../lib/shared/chat-management-types';

/**
 * Schema for Folders mongo collection
 */
export const FoldersSchema = {
  SCHEMA: new Schema<FolderItem>(
    {
      treeItemId: { type: String, required: true, unique: true, index: true, show: true },
      uid: String,
      name: String,
      matterId: String,
      description: String,
      type: { type: String, enum: ['folder'] },
      parentId: String,
      isArchived: Boolean,
      fileCollectionId: String
    },
    { timestamps: true }
  ),
  COLLECTION_NAME: 'folders'
};
