import * as express from 'express';
import PromiseRouter from 'express-promise-router';
import { LoggedInUser } from 'server/src/lib/auth';

import { asError } from '../../lib/util';
import { AuthService, NotAuthorizedLoginError } from './service';

declare module 'express-session' {
  interface SessionData {
    user: LoggedInUser;
  }
}

/**
 * The path to the logged in home page.
 */
export const HOMEPAGE = '/';

/** The page shown to users who pass authentication but are not authorized for ShopAIAssist. */
export const NOT_AUTHORIZED_PAGE = '/no-access.html';

/**
 * API endpoints for authenticating users
 */
export class AuthRoutes {
  public static PATHS = {
    ONE_PASS: '/onepass',
  };

  public static routes(): express.Router {
    const router = PromiseRouter();
    const authService = new AuthService();

    /**
     * Callback route that OnePass called after a user successfully logged in.
     * We use the `signontoken` query param to load the user profile from the
     *  OnePass REST API.
     *
     * GET /api/auth/onepass
     */
    router.get(this.PATHS.ONE_PASS, async (req: express.Request, res: express.Response) => {
      res.set('Cache-Control', 'private, no-store');
      const signOnToken = req.query.signontoken;
      if (!signOnToken) {
        res.status(400).send({ error: 'Missing signontoken query param' });
        return;
      }

      if (typeof signOnToken !== 'string') {
        res.status(400).send({ error: 'signontoken query param value must be a string' });
        return;
      }

      try {
        const user = await authService.loginUser(signOnToken);
        // The `req.session` property is managed by the `express-session` middleware (see: `server/app.ts`).
        // By setting the `req.session.profile` we cause the `express-session` middleware to
        // temporarily store the user profile in MongoDB and set the `connect.sid` cookie.
        // The `express-session` middleware will implicitly read the `connect.sid` cookie
        // and set the `req.session.profile` property on every request.
        // The `/api/user/me` endpoint reads this property.
        req.session.user = user;
        res.redirect(HOMEPAGE);
      } catch (err) {
        const notAuthorizedError = asError(err, NotAuthorizedLoginError);
        if (notAuthorizedError) {
          res.redirect(NOT_AUTHORIZED_PAGE);
        } else {
          throw err;
        }
      }
    });

    return router;
  }
}
