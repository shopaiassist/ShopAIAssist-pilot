# MongoDB Documentation

## Overview

This document provides an overview of the MongoDB schemas used in the project. The database includes collections for folders and chats, with schemas defined using Mongoose.

## Table of Contents

- [Folders Schema](#folders-schema)
- [Chats Schema](#chats-schema)

## Folders Schema

The `Folders` collection stores information about folders, including metadata and hierarchical relationships.

### Schema Definition

```js
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
```

### Fields

- **treeItemId**: String, required, unique, indexed, shows in output
  - Unique identifier for the folder.

- **uid**: String
  - User identifier for the owner of the folder.

- **name**: String
  - Name of the folder.

- **matterId**: String
  - Identifier for the matter associated with the folder.

- **description**: String
  - Description of the folder.

- **type**: String, enum: ['folder']
  - Type of the item, which is always 'folder' for this schema.

- **parentId**: String
  - Identifier of the parent folder, if applicable.

- **isArchived**: Boolean
  - Flag indicating if the folder is archived.

- **fileCollectionId**: String
  - Identifier for the file collection associated with the folder.

- **timestamps**: Boolean
  - Mongoose option to add `createdAt` and `updatedAt` fields.

### Collection Name

- **folders**

## Chats Schema

The `Chats` collection stores information about chats, including metadata and hierarchical relationships.

### Schema Definition

```js
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
```

### Fields

- **treeItemId**: String, required, unique, indexed
  - Unique identifier for the chat.

- **uid**: String
  - User identifier for the owner of the chat.

- **name**: String
  - Name of the chat.

- **type**: String, enum: ['chat']
  - Type of the item, which is always 'chat' for this schema.

- **parentId**: String
  - Identifier of the parent folder, if applicable.

- **fileCollectionId**: String
  - Identifier for the file collection associated with the chat.

- **timestamps**: Boolean
  - Mongoose option to add `createdAt` and `updatedAt` fields.

### Collection Name

- **chats**
