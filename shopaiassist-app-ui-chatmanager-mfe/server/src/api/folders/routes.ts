import * as express from 'express';

import PromiseRouter from 'express-promise-router';
import MongoConnection from 'server/src/db';
import { FolderItem } from 'server/src/lib/shared/chat-management-types';
import FolderManagement from './service';
import { routesErrorHandler } from '../../lib/utils/routes-utils';
import { SecurityMiddleware, ensureAuthenticated } from 'react';
import { AppRequest } from 'server/src/@types/appRequest';

/**
 * Provides Express routes for managing folder-related operations, including creating, deleting, and updating folders.
 * This class uses a PromiseRouter to handle asynchronous route actions effectively, encapsulating business logic
 * in the FolderManagement service.
 */
export class FoldersRoutes {
  /**
   * Defines the API endpoints used by the folder routes.
   */
  public static PATHS = {
    FOLDERS: '/folders'
  };

  /**
   * Configures and returns Express router instances for folder management, integrating error handling.
   *
   * @param {MongoConnection} dbConnection - Database connection to pass to the FolderManagement service for data operations.
   * @param {SecurityMiddleware} security - Middleware to handle security concerns, such as authentication and authorization.
   * @returns {express.Router} Configured router with folder management routes.
   */
  public static routes(dbConnection: MongoConnection, security: SecurityMiddleware): express.Router {
    const router = PromiseRouter();
    const foldersManagement = new FolderManagement(dbConnection);

    // POST /api/folders endpoint for creating a new folder.
    router.post(this.PATHS.FOLDERS, security.isAuthenticated, async (req: AppRequest, res: express.Response) => {
      const folderToAdd: FolderItem = req.body;
      try {
        if (ensureAuthenticated(req)) {
          const newFolder = await foldersManagement.createNewFolder(req.user, folderToAdd, req.headers);
          res.status(201).json({ newFolder });
        }
      } catch (error) {
        routesErrorHandler(error, res);
      }
    });

    // DELETE /api/folders endpoint for removing an existing folder.
    router.delete(this.PATHS.FOLDERS, security.isAuthenticated, async (req: AppRequest, res: express.Response) => {
      try {
        if (ensureAuthenticated(req)) {
          await foldersManagement.deleteFolder(req.user, req.body.id, req.headers);
          res.sendStatus(204);
        }
      } catch (error) {
        routesErrorHandler(error, res);
      }
    });

    // PATCH /api/folders endpoint for updating folder details.
    router.patch(this.PATHS.FOLDERS, security.isAuthenticated, async (req: express.Request, res: express.Response) => {
      const { id, updates } = req.body;
      try {
        if (ensureAuthenticated(req)) {
          await foldersManagement.updateFolder(req.user.id, id, updates);
          res.sendStatus(200);
        }
      } catch (error) {
        routesErrorHandler(error, res);
      }
    });

    return router;
  }
}
