import { Schema } from 'mongoose';
import { TreeItem } from 'server/src/lib/shared/chat-management-types';

/**
 * Schema for Chats Mongo collection
 */
export const ChatsSchema = {
  SCHEMA: new Schema<TreeItem>(
    {
      treeItemId: { type: String, required: true, unique: true, index: true },
      uid: String,
      name: String,
      type: { type: String, enum: ['chat'] },
      parentId: String,
      fileCollectionId: String
    },
    { timestamps: true }
  ),
  COLLECTION_NAME: 'chats'
};
