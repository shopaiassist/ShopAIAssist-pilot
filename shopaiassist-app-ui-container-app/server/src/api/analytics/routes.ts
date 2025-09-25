import { AliasParams, IdentifyParams, PageParams, TrackParams } from 'analytics-node';
import express from 'express';
import PromiseRouter from 'express-promise-router';

import { AnalyticsService } from './service';

/**
 * Class for defining routes for the health check endpoint.
 */
export class AnalyticsRoutes {
  public static PATHS = {
    ANALYTICS_ALIAS: '/alias',
    ANALYTICS_IDENTIFY: '/identify',
    ANALYTICS_PAGE: '/page',
    ANALYTICS_TRACK: '/track',
  };

  public static routes(): express.Router {
    const router = PromiseRouter();
    const service = new AnalyticsService();

    /**
     * Route for track requests.
     */
    router.post(this.PATHS.ANALYTICS_TRACK, async (req: express.Request, res: express.Response) => {
      const message: TrackParams = req.body.message;
      service
        .track(message)
        .then(() => {
          res.sendStatus(200);
        })
        .catch(() => {
          res.sendStatus(500);
        });
    });

    /**
     * Route for alias requests.
     */
    router.post(this.PATHS.ANALYTICS_ALIAS, (req: express.Request, res: express.Response) => {
      const message: AliasParams = req.body.message;
      service
        .alias(message)
        .then(() => {
          res.sendStatus(200);
        })
        .catch(() => {
          res.sendStatus(500);
        });
      res.sendStatus(200);
    });

    /**
     * Route for identify requests.
     */
    router.post(this.PATHS.ANALYTICS_IDENTIFY, (req: express.Request, res: express.Response) => {
      const message: IdentifyParams = req.body.message;
      service
        .identify(message)
        .then(() => {
          res.sendStatus(200);
        })
        .catch(() => {
          res.sendStatus(500);
        });
      res.sendStatus(200);
    });

    /**
     * Route for page requests.
     */
    router.post(this.PATHS.ANALYTICS_PAGE, (req: express.Request, res: express.Response) => {
      const message: PageParams = req.body.message;
      service
        .page(message)
        .then(() => {
          res.sendStatus(200);
        })
        .catch(() => {
          res.sendStatus(500);
        });
      res.sendStatus(200);
    });

    return router;
  }
}
