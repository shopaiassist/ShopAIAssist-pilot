import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import cors, { CorsOptions } from 'cors';
import express from 'express';
import helmet from 'helmet';
import nocache from 'nocache';
import { HadesCoreExpress, SecurityMiddleware } from 'react';

import { ClientRoutes } from './src/api/client/routes';
import { name as PACKAGE_NAME, version as PACKAGE_VERSION } from '../package.json';
import MongoConnection from './src/db/index';
import { FoldersRoutes } from './src/api/folders/routes';
import { ChatsRoutes } from './src/api/chats/routes';
import { ChatManagementRoutes } from './src/api/chat-list-management/routes';
import { getCorsOrigin } from '../client/tool/cors-util';
import PromiseRouter from 'express-promise-router';

/**
 * Don't let the client cache anything unless it starts with:
 * - `/static`
 * - `/manifest.json`
 * - `/favicon.ico`
 */
const NO_CACHE_URL_PATTERN = /^(?!\/static|\/manifest\.json|\/favicon\.ico).*$/;

export default class App {
  public static readonly API_BASE_URI = '/api';

  public app: express.Express;
  public mongoDbInstance = new MongoConnection(process.env.MONGO_URL);
  public security = new SecurityMiddleware();

  private static API_BASE_PATHS = {
    HEALTH: process.env.PUBLIC_URL ? `${process.env.PUBLIC_URL}/health` : '/health'
  };

  private static UI_BASE_PATHS = {
    BACKEND: '/chatmgmt',
    NGINX_ROUTE: `/${process.env.PLATFORM_ENV}/oia/ui-chatmgmt`
  };

  constructor() {
    // TODO: initialize things like DB's, etc.

    this.app = express();
    this.configMiddlewares();

    this.configureClientRoutes();
  }

  /**
   * Function to configure middleware for both express apps
   */
  private configMiddlewares(): void {
    if (process.env.NODE_ENV === 'production') {
      if (!process.env.SESSION_SECRET) {
        console.warn('SESSION_SECRET is NOT set, please set a secret');
      }
    }

    if (!process.env.CORS_ORIGINS) {
      console.warn('CORS_ORIGINS is NOT set, CORS is disabled');
    }

    if (!process.env.CSP_SRC) {
      console.error('CSP_SRC is NOT set, please set a CSP script source environment variable');
      throw new Error('CSP_SRC not set');
    }

    this.app.enable('trust proxy');

    const corsOptions: CorsOptions = {
      origin: true,
      credentials: true
    };
    this.app.options('*', cors(corsOptions));
    this.app.use(cors(corsOptions));

    const cspSrc = process.env.CSP_SRC.split(',');
    this.app.use(
      helmet({
        crossOriginEmbedderPolicy: false,
        contentSecurityPolicy: {
          directives: {
            'default-src': cspSrc,
            'script-src': cspSrc,
            'script-src-elem': cspSrc
          }
        },
        crossOriginResourcePolicy: {
          policy: 'cross-origin'
        }
      })
    );

    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: false }));
    this.app.use(cookieParser());
    this.app.use(compression());
    // Match anything but /static/* resources.
    this.app.use(NO_CACHE_URL_PATTERN, nocache());
    this.app.set('json spaces', 2);
  }

  protected configureApiRoutes(): void {
    const apiRouter = PromiseRouter();
    apiRouter.use(function (req, res, next) {
      res.contentType('application/json');
      next();
    });

    apiRouter.use(
      `${App.UI_BASE_PATHS.BACKEND}${App.API_BASE_PATHS.HEALTH}`,
      new HadesCoreExpress.HealthRoutes(PACKAGE_NAME, PACKAGE_VERSION, 'Matters').createRoutes()
    );
    apiRouter.use(
      `${App.UI_BASE_PATHS.NGINX_ROUTE}${App.API_BASE_PATHS.HEALTH}`,
      new HadesCoreExpress.HealthRoutes(PACKAGE_NAME, PACKAGE_VERSION, 'Matters').createRoutes()
    );
    apiRouter.use(
      App.API_BASE_PATHS.HEALTH,
      new HadesCoreExpress.HealthRoutes(PACKAGE_NAME, PACKAGE_VERSION, 'Matters').createRoutes()
    );

    apiRouter.use(App.UI_BASE_PATHS.BACKEND, FoldersRoutes.routes(this.mongoDbInstance, this.security));
    apiRouter.use(App.UI_BASE_PATHS.BACKEND, ChatsRoutes.routes(this.mongoDbInstance /* , this.security */));
    apiRouter.use(App.UI_BASE_PATHS.BACKEND, ChatManagementRoutes.routes(this.mongoDbInstance /* , this.security */));

    // onesourcetax.com nginx routes
    apiRouter.use(App.UI_BASE_PATHS.NGINX_ROUTE, FoldersRoutes.routes(this.mongoDbInstance, this.security));
    apiRouter.use(App.UI_BASE_PATHS.NGINX_ROUTE, ChatsRoutes.routes(this.mongoDbInstance /* , this.security */));
    apiRouter.use(
      App.UI_BASE_PATHS.NGINX_ROUTE,
      ChatManagementRoutes.routes(this.mongoDbInstance /* , this.security */)
    );

    // local only
    apiRouter.use(FoldersRoutes.routes(this.mongoDbInstance, this.security));
    apiRouter.use(ChatsRoutes.routes(this.mongoDbInstance /* , this.security */));
    apiRouter.use(ChatManagementRoutes.routes(this.mongoDbInstance /* , this.security */));

    this.app.use(`${App.UI_BASE_PATHS.BACKEND}${App.API_BASE_URI}`, apiRouter);
    this.app.use(`${App.UI_BASE_PATHS.NGINX_ROUTE}${App.API_BASE_URI}`, apiRouter);
    this.app.use(App.API_BASE_URI, apiRouter);
  }

  /**
   * Function to configure routes for main app
   */
  protected configureClientRoutes(): void {
    this.configureApiRoutes();
    // this must be defined last since it has a 'catch all' route
    this.app.use(`${App.UI_BASE_PATHS.BACKEND}`, ClientRoutes.routes());
    this.app.use(`${App.UI_BASE_PATHS.NGINX_ROUTE}`, ClientRoutes.routes());
    this.app.use(ClientRoutes.routes());
  }

  /**
   * Utility for getting the express application.
   * @return The Express app.
   */
  public getApplication() {
    return this.app;
  }
}
