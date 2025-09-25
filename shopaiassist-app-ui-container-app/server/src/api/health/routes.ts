import express from 'express';
import PromiseRouter from 'express-promise-router';

/**
 * Class for defining routes for the health check endpoint.
 */
export class HealthRoutes {
  public static PATHS = {
    PING: '/ping',
  };

  public static routes(): express.Router {
    const router = PromiseRouter();
    /**
     * Route for retrieving all apps for a user.
     */
    router.route(this.PATHS.PING).get((req: express.Request, res: express.Response) => {
      return res.json({
        status: 'Main server up!!!!',
      });
    });

    return router;
  }
}
