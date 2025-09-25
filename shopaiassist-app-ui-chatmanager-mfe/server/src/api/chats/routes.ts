import * as express from 'express';
import PromiseRouter from 'express-promise-router';
import MongoConnection from 'server/src/db';
import ChatManagement from './service';
import { routesErrorHandler } from '../../lib/utils/routes-utils';
import { AppRequest } from '../../@types/appRequest';
import { UserProfile } from 'react/dist/types/auth';

/**
 * Handles routing for chat operations including creation, deletion, and updates.
 * This class sets up an Express router for chat management with error handling tailored to specific
 * errors such as duplicate entries or missing properties.
 */
export class ChatsRoutes {
/**
 * Paths used in chat management routing.
 */
public static readonly PATHS = {
  CHATS: '/chats',
  GENERATE_CHAT_NAME: '/generate-name',
  CHAT_BY_ID: '/chat/:chatId',
  RENAME_CHAT: '/chat/:chatId/rename'
};

  /**
   * Configures routes for managing chats.
   *
   * @param {MongoConnection} dbConnection - The database connection used by the chat management service.
   * @param {SecurityMiddleware} security - Middleware to handle security concerns, such as authentication and authorization.
   * @returns {express.Router} A router configured with chat management endpoints.
   */
  public static routes(dbConnection: MongoConnection): express.Router {
    const router = PromiseRouter();
    const chatManagement = new ChatManagement(dbConnection);

    // POST /api/chats Route for creating a new chat.
    router.post(
      this.PATHS.CHATS,
      async (req: AppRequest, res: express.Response) => {
        try {
          const newChat = await chatManagement.createNewChat(
            req.headers,
            req.body.user as Record<string, string> & UserProfile,
            req.body.parentId
          );
          res.status(201).json({ newChat });
        } catch (error) {
          routesErrorHandler(error, res);
          console.error(error);
        }
      }
    );

    // POST /api/generate-name Route for generating a name for a chat from 
    router.post(
      this.PATHS.GENERATE_CHAT_NAME,
      async (req: AppRequest, res: express.Response) => {
        try {
          const newName = await chatManagement.generateChatName(
            req.headers,
            req.user as Record<string, string> & UserProfile,
            req.body.chatId,
            req.body.chat_history
          );
          res.status(201).json({ newName });
        } catch (error) {
          routesErrorHandler(error, res);
          console.error(error);
        }
      }
    );

    // GET /api/chats Route for retrieving all chats for the user.
    router.get(
      this.PATHS.CHATS,
      async (req: AppRequest, res: express.Response) => {
        try {
          // Extract sortType from query parameters
          const sortType = req.query.sortType as string;
          
          const chats = await chatManagement.getChats(
            req.headers,
            req.user as Record<string, string> & UserProfile,
            sortType
          );
          res.status(200).json(chats);
        } catch (error) {
          routesErrorHandler(error, res);
          console.error(error);
        }
      }
    );

    // DELETE /api/chat/:chatId Route for deleting a single chat by ID in path parameter.
    router.delete(
      this.PATHS.CHAT_BY_ID,
      async (req: AppRequest, res: express.Response) => {
        try {
          await chatManagement.deleteChat(
            req.user as Record<string, string> & UserProfile,
            req.params.chatId,
            req.headers
          );
          res.status(200).json({});
        } catch (error) {
          routesErrorHandler(error, res);
        }
      }
    );

    // POST /api/chat/:chatId/rename Route for renaming a chat.
    router.post(
      this.PATHS.RENAME_CHAT,
      async (req: AppRequest, res: express.Response) => {
        try {
          await chatManagement.updateChat(
            req.headers,
            req.user as Record<string, string> & UserProfile,
            req.params.chatId,
            req.body.updates.name
          );
          res.status(200).json({});
        } catch (error) {
          routesErrorHandler(error, res);
          console.error(error);
        }
      }
    );

    return router;
  }
}
