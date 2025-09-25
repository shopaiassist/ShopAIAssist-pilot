import express from 'express';
import PromiseRouter from 'express-promise-router';

/**
 * Class for defining redirect routes.
 */
export class RedirectRoutes {
  public static PATHS = {
    /** California Consumer Privacy Act - Data Subject Access Request */
    DO_NOT_SELL: '/ccpa-dsar',
  };

  public static routes(): express.Router {
    const router = PromiseRouter();
    /**
     * Route for Do Not Sell link.
     */
    router.route(this.PATHS.DO_NOT_SELL).get((req: express.Request, res: express.Response) => {
      return res.redirect(
        process.env.DO_NOT_SELL_URL ||
          'https://privacyportal-cdn.onetrust.com/dsarwebform/dbf5ae8a-0a6a-4f4b-b527-7f94d0de6bbc/5dc91c0f-f1b7-4b6e-9d42-76043adaf72d.html'
      );
    });

    return router;
  }
}
