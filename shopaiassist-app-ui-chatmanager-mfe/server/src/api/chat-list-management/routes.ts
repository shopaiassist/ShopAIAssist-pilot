import * as express from 'express';

import PromiseRouter from 'express-promise-router';
import MongoConnection from 'server/src/db';
import ChatListManagement from './service';
import { SortOptions } from 'server/src/lib/shared/chat-management-types';
import { routesErrorHandler } from '../../lib/utils/routes-utils';
// import { SecurityMiddleware, ensureAuthenticated } from 'react';
import { AppRequest } from 'server/src/@types/appRequest';

/**
 * Defines routing logic for chat management functionalities within an Express application.
 * Provides routes for listing chats and folders, and their sub-lists with support for sorting.
 */
export class ChatManagementRoutes {
  /**
   * Paths used in the chat management routing.
   */
  public static PATHS = {
    LIST: '/list'
  };

  /**
   * Initializes routes related to chat management.
   *
   * @param {MongoConnection} dbConnection - The database connection object used for data layer operations.
   * @param {SecurityMiddleware} security - Middleware to handle security concerns, such as authentication and authorization.
   * @returns {express.Router} A configured router instance with chat management routes.
   */
  public static routes(dbConnection: MongoConnection /* , security: SecurityMiddleware */): express.Router {
    const router = PromiseRouter();
    const foldersDatalayer = new ChatListManagement(dbConnection);

    // GET /api/list Route to fetch a list of chats and folders sorted by the specified type.
    router.get(
      this.PATHS.LIST,
      /* security.isAuthenticated, */ async (req: AppRequest, res: express.Response) => {
        try {
          
          const sortType: SortOptions = (req.query.sortType as SortOptions) || 'by_date';
          const parentId: string = req.query.parentId as string;
          const onlyArchivedMatters: string = req.query.onlyArchivedMatters as string;
          const foldersAndFiles = await foldersDatalayer.getChatsAndFolders({
            uid: req.query.uid as string,
            parentId,
            sortType,
            onlyArchivedMatters: onlyArchivedMatters === 'true'
          });
          res.json(foldersAndFiles);
          // }
        } catch (error) {
          routesErrorHandler(error, res);
          console.error(error);
        }
      }
    );

    return router;
  }
}
