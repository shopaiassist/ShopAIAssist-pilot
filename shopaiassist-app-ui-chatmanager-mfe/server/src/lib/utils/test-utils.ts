import express, { NextFunction } from 'express';
import { AppRequest } from 'server/src/@types/appRequest';

/**
 * Sample data representing chat items for testing sorting and other functionalities.
 */
export const testChatsData = [
  {
    type: 'chat',
    name: 'New name for this chat',
    treeItemId: 'e35607c7-be8f-4172-a3cd-ae7e39bc2b97',
    createdAt: '2024-04-25T18:23:45.704Z',
    updatedAt: '2024-04-25T18:23:45.704Z',
    uid: '8beab79b628b479cb9c40855777a511d',
    parentId: '8c1b78b3-a798-4557-871a-bff6c8ac804e'
  },
  {
    createdAt: '2024-03-01T17:00:33.564Z',
    updatedAt: '2024-03-01T17:00:33.564Z',
    treeItemId: 'e35607c7-be8f-4172-a3cd-ae7e39bc2b96',
    uid: '8beab79b628b479cb9c40855777a511d',
    name: 'Chat Name 1',
    type: 'chat'
  },
  {
    createdAt: '2024-02-21T20:51:41.137Z',
    updatedAt: '2024-02-21T20:51:41.137Z',
    treeItemId: 'e4a9bc6a-cfb1-48ac-bc6e-1b6f135147c0',
    uid: '8beab79b628b479cb9c40855777a511d',
    name: 'Chat Name 2',
    type: 'chat'
  },
  {
    createdAt: '2024-02-21T20:49:41.137Z',
    updatedAt: '2024-02-21T20:49:41.137Z',
    treeItemId: 'c807ff14-58da-4199-8832-da90252fa743',
    parentId: 'b5014a24-8f61-42eb-a24e-8f0b88fd18ab',
    uid: '8beab79b628b479cb9c40855777a511d',
    name: 'Archived Chat',
    type: 'chat'
  }
];

/**
 * Sample data representing folder items for testing sorting and other functionalities.
 */
export const testFoldersData = [
  {
    createdAt: '2024-02-23T16:30:33.080Z',
    updatedAt: '2024-02-23T16:30:33.080Z',
    treeItemId: '8c1b78b3-a798-4557-871a-bff6c8ac804e',
    uid: '8beab79b628b479cb9c40855777a511d',
    name: 'new2',
    type: 'folder'
  },
  {
    createdAt: '2024-02-23T16:30:17.078Z',
    updatedAt: '2024-02-23T16:30:17.078Z',
    treeItemId: 'b39f37a3-6781-4445-8573-77658d9ee7ae',
    uid: '8beab79b628b479cb9c40855777a511d',
    name: 'new1',
    type: 'folder'
  },
  {
    createdAt: '2024-02-23T16:26:17.254Z',
    updatedAt: '2024-02-23T16:26:17.254Z',
    treeItemId: '9bc3c583-a6e4-41cc-92f1-27e1be3ba4f6',
    uid: '8beab79b628b479cb9c40855777a511d',
    name: 'newnewenewnew',
    type: 'folder',
    parentId: '8c1b78b3-a798-4557-871a-bff6c8ac804e'
  },
  {
    createdAt: '2024-02-23T16:20:00.254Z',
    updatedAt: '2024-02-23T16:20:00.254Z',
    treeItemId: 'b5014a24-8f61-42eb-a24e-8f0b88fd18ab',
    uid: '8beab79b628b479cb9c40855777a511d',
    name: 'archived folder',
    type: 'folder',
    isArchived: true
  }
];

/**
 * Sample data for testing sorting chat and folder items by date.
 */
export const chatsAndFoldersByDate = [
  {
    createdAt: '2024-03-01T17:00:33.564Z',
    updatedAt: '2024-03-01T17:00:33.564Z',
    treeItemId: 'e35607c7-be8f-4172-a3cd-ae7e39bc2b96',
    uid: '8beab79b628b479cb9c40855777a511d',
    name: 'Chat Name 1',
    type: 'chat'
  },
  {
    createdAt: '2024-02-23T16:30:33.080Z',
    updatedAt: '2024-02-23T16:30:33.080Z',
    treeItemId: '8c1b78b3-a798-4557-871a-bff6c8ac804e',
    uid: '8beab79b628b479cb9c40855777a511d',
    name: 'new2',
    type: 'folder'
  },
  {
    createdAt: '2024-02-23T16:30:17.078Z',
    updatedAt: '2024-02-23T16:30:17.078Z',
    treeItemId: 'b39f37a3-6781-4445-8573-77658d9ee7ae',
    uid: '8beab79b628b479cb9c40855777a511d',
    name: 'new1',
    type: 'folder'
  },
  {
    createdAt: '2024-02-21T20:51:41.137Z',
    updatedAt: '2024-02-21T20:51:41.137Z',
    treeItemId: 'e4a9bc6a-cfb1-48ac-bc6e-1b6f135147c0',
    uid: '8beab79b628b479cb9c40855777a511d',
    name: 'Chat Name 2',
    type: 'chat'
  }
];

/**
 * Sample data for testing sorting chat and folder items by name.
 */
export const chatsAndFoldersByName = [
  {
    createdAt: '2024-03-01T17:00:33.564Z',
    updatedAt: '2024-03-01T17:00:33.564Z',
    treeItemId: 'e35607c7-be8f-4172-a3cd-ae7e39bc2b96',
    uid: '8beab79b628b479cb9c40855777a511d',
    name: 'Chat Name 1',
    type: 'chat'
  },
  {
    createdAt: '2024-02-21T20:51:41.137Z',
    updatedAt: '2024-02-21T20:51:41.137Z',
    treeItemId: 'e4a9bc6a-cfb1-48ac-bc6e-1b6f135147c0',
    uid: '8beab79b628b479cb9c40855777a511d',
    name: 'Chat Name 2',
    type: 'chat'
  },
  {
    createdAt: '2024-02-23T16:30:17.078Z',
    updatedAt: '2024-02-23T16:30:17.078Z',
    treeItemId: 'b39f37a3-6781-4445-8573-77658d9ee7ae',
    uid: '8beab79b628b479cb9c40855777a511d',
    name: 'new1',
    type: 'folder'
  },
  {
    createdAt: '2024-02-23T16:30:33.080Z',
    updatedAt: '2024-02-23T16:30:33.080Z',
    treeItemId: '8c1b78b3-a798-4557-871a-bff6c8ac804e',
    uid: '8beab79b628b479cb9c40855777a511d',
    name: 'new2',
    type: 'folder'
  }
];

/**
 * Sample data for testing sorting chat and folder items by type.
 */
export const chatsAndFoldersByType = [
  {
    createdAt: '2024-03-01T17:00:33.564Z',
    updatedAt: '2024-03-01T17:00:33.564Z',
    treeItemId: 'e35607c7-be8f-4172-a3cd-ae7e39bc2b96',
    uid: '8beab79b628b479cb9c40855777a511d',
    name: 'Chat Name 1',
    type: 'chat'
  },
  {
    createdAt: '2024-02-21T20:51:41.137Z',
    updatedAt: '2024-02-21T20:51:41.137Z',
    treeItemId: 'e4a9bc6a-cfb1-48ac-bc6e-1b6f135147c0',
    uid: '8beab79b628b479cb9c40855777a511d',
    name: 'Chat Name 2',
    type: 'chat'
  },
  {
    createdAt: '2024-02-23T16:30:33.080Z',
    updatedAt: '2024-02-23T16:30:33.080Z',
    treeItemId: '8c1b78b3-a798-4557-871a-bff6c8ac804e',
    uid: '8beab79b628b479cb9c40855777a511d',
    name: 'new2',
    type: 'folder'
  },
  {
    createdAt: '2024-02-23T16:30:17.078Z',
    updatedAt: '2024-02-23T16:30:17.078Z',
    treeItemId: 'b39f37a3-6781-4445-8573-77658d9ee7ae',
    uid: '8beab79b628b479cb9c40855777a511d',
    name: 'new1',
    type: 'folder'
  }
];

/**
 * Sample data for testing sorting chat and folder items by type.
 */
export const archivedChatsAndFoldersByType = [
  {
    createdAt: '2024-02-23T16:20:00.254Z',
    updatedAt: '2024-02-23T16:20:00.254Z',
    treeItemId: 'b5014a24-8f61-42eb-a24e-8f0b88fd18ab',
    uid: '8beab79b628b479cb9c40855777a511d',
    name: 'archived folder',
    type: 'folder',
    isArchived: true
  }
];

/**
 * Sample data for testing sorting chat and folder items by type.
 */
export const archivedSubChatsAndFoldersByType = [
  {
    createdAt: '2024-02-21T20:49:41.137Z',
    updatedAt: '2024-02-21T20:49:41.137Z',
    treeItemId: 'c807ff14-58da-4199-8832-da90252fa743',
    parentId: 'b5014a24-8f61-42eb-a24e-8f0b88fd18ab',
    uid: '8beab79b628b479cb9c40855777a511d',
    name: 'Archived Chat',
    type: 'chat'
  }
];

export const requestHeaders = [
  'authorization',
  'op-orch 0702241037270OsnGa3dYt2HQ63uQhF3xaVG9i3ctHLqykE6E8KI1ydoGl05xQPMYPzpz44SBTWG1nxQryAKW7OmWwsZUK9z31yAWY3Q91b1puRZso9CW5n7MF9HXhnuwqNOaeODJw5_bTwg_Ky2ZdAhEI6p9GKSSBirRcRxU4veo-beuiyJ7OPXaRqxy5uV2kahg9dp4_P2PYeIbVcQV-p9wGy2mlekRfCNIp8aY97kjQOGKuQdvOkbIHm3d8b_IgT90rf1QQ3BoOSaH-gX5odIDYxz8eJAl83wgn98x3RxJuYkowEQ_VzyWFM4x4fCHu7E_dgML2Xr1UpR4I-PaY5JL6DPGkQr3QA'
];

const ONEPASS_ORCHESTRATION_TOKEN_TYPE = 'op-orch';
const UNAUTHORIZED_BODY = { message: 'No authorized user', code: 'no_authorized_user' };
const INVALID_TOKEN_BODY = { message: 'Invalid authorization token type', code: 'invalid_auth_token_type' };

/**
 * This is a mock of the security middleware from Hades for use in unit tests.
 */
export class MockSecurityMiddleware {
  constructor() {}

  /**
   * Requires the user to be authenticated and adds the logged in user profile
   * and orchestration token to the express request object
   *
   * @param req   An express request with the `user` and `orchestrationToken` property added to it
   * @param res   An express response
   * @param next  An express next function
   */
  public isAuthenticated = async (req: AppRequest, res: express.Response, next: NextFunction) => {
    const userMap = new Map();
    userMap.set(requestHeaders[1], {
      email: 'hunter.nenneau+localtest1@thomsonreuters.com',
      firstName: 'Hunter',
      lastName: 'Nenneau',
      id: '8beab79b628b479cb9c40855777a511d',
      username: 'hunter.nenneau+localtest1@thomsonreuters.com',
      registrationKey: ''
    });
    try {
      const { authorization } = req.headers;
      if (authorization) {
        const [type, token] = authorization.split(' ');
        if (type === ONEPASS_ORCHESTRATION_TOKEN_TYPE) {
          try {
            req.orchestrationToken = token;
            req.user = userMap.get(authorization);
            next();
          } catch (err: unknown) {
            next(err);
          }
        } else if (type) {
          res.status(400).send(INVALID_TOKEN_BODY);
        }
      } else {
        res.status(401).send(UNAUTHORIZED_BODY);
      }
    } catch (err) {
      next(err);
    }
  };
}
