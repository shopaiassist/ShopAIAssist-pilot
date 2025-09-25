import * as express from 'express';
import PromiseRouter from 'express-promise-router';
import * as path from 'path';

/**
 * Class for configuring routes for the client (User facing application) app.
 */
export class ClientRoutes {
  public static readonly PATHS = { CATCH_ALL: '*' };
  public static readonly CLIENT_BUILD_DIR = '../../../../client/dist';

  public static routes(): express.Router {
    const router = PromiseRouter();

    // Serve static files from the React app
    router.use(express.static(path.join(__dirname, this.CLIENT_BUILD_DIR)));

    // The "catchall" handler: for any request that doesn't
    // match one above, send back React's index.html file.
    router.get(this.PATHS.CATCH_ALL, (req: express.Request, res: express.Response) => {
      res.sendFile(path.join(`${path.join(__dirname, this.CLIENT_BUILD_DIR)}/index.html`));
    });

    return router;
  }
}
