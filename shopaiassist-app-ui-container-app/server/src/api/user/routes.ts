import * as express from 'express';
import PromiseRouter from 'express-promise-router';

import { LoggedInUser } from '../../lib/auth';

const DEFAULT_IDLE_TIME = 90 * 60 * 1000;
const DEFAULT_WARNING_THRESHOLD = DEFAULT_IDLE_TIME * 0.1;

declare module 'express-session' {
  interface SessionData {
    user: LoggedInUser;
  }
}

/**
 * Auth cookie name
 */
export const AUTH_TOKEN_COOKIE_NAME = 'ShopAIAssistAuth';

/**
 * API endpoints for user information
 */
export class UserRoutes {
  public static PATHS = {
    ME: '/me',
    TIMEOUTS: '/timeouts',
    LOGOUT: '/logout',
  };

  public static routes(): express.Router {
    const router = PromiseRouter();

    /**
     * Returns logged in user information
     *
     * GET /api/user/me
     */
    router.get(this.PATHS.ME, async (req, res) => {
      res.set('Cache-Control', 'private, no-store');
      if (req.session.user) {
        res.send(req.session.user);
      } else {
        res.status(401).send({ message: 'No authorized user', code: 'no_authorized_user' });
      }
    });

    /**
     * Returns session timeouts
     * Will eventually be configurable by org
     *
     * GET /api/user/timeouts
     */
    router.get(this.PATHS.TIMEOUTS, async (req, res) => {
      res.set('Cache-Control', 'private, no-store');
      // TODO: Make this configurable by org
      res.send({
        idleTime: DEFAULT_IDLE_TIME,
        warningThreshold: DEFAULT_WARNING_THRESHOLD,
      });
    });

    /**
     * Route for logging out user
     *
     * POST /api/user/logout
     */
    router.post(this.PATHS.LOGOUT, async (req, res, next) => {
      req.session.destroy((err) => {
        if (err) {
          next(err);
          return;
        }
        res.status(201).end();
      });
    });

    return router;
  }
}
