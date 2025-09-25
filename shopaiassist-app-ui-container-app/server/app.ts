import { LOG } from 'react';
import bodyParser from 'body-parser';
import compression from 'compression';
import MongoStore from 'connect-mongo';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import nocache from 'nocache';

import { AnalyticsRoutes } from './src/api/analytics/routes';
import { AuthRoutes } from './src/api/auth/routes';
import { ClientRoutes } from './src/api/client/routes';
import { EmailRoutes } from './src/api/email/routes';
import { HealthRoutes } from './src/api/health/routes';
import { RedirectRoutes } from './src/api/redirect/routes';
import { UserRoutes } from './src/api/user/routes';
import { DEFAULT_ABSOLUTE_SESSION_TIMEOUT_SEC } from './src/lib/auth';
import { defaultUnsetMessage, ensureDefined } from './src/lib/environment';

import { name as PACKAGE_NAME, version as PACKAGE_VERSION } from '../package.json';

/**
 * Don't let the client cache anything unless it starts with:
 * - `/static`
 * - `/manifest.json`
 * - `/favicon.ico`
 */
const NO_CACHE_URL_PATTERN = /^(?!\/static|\/manifest\.json|\/favicon\.ico).*$/;

interface Config {
  SESSION_SECRET: string;
  MONGO_URL: string;
}

export default class App {
  public app: express.Express;

  private config: Config;

  private static API_BASE_PATHS = {
    ANALYTICS: process.env.PUBLIC_URL ? `${process.env.PUBLIC_URL}/api/analytics` : '/api/analytics',
    AUTH: process.env.PUBLIC_URL ? `${process.env.PUBLIC_URL}/api/auth` : '/api/auth',
    EMAIL: process.env.PUBLIC_URL ? `${process.env.PUBLIC_URL}/api/email` : '/api/email',
    HEALTH: process.env.PUBLIC_URL ? `${process.env.PUBLIC_URL}/api/health` : '/api/health',
    USER: process.env.PUBLIC_URL ? `${process.env.PUBLIC_URL}/api/user` : '/api/user',
  };

  private static CLIENT_BASE_PATHS = {
    REDIRECT: '/redirect',
  };

  private static UI_BASE_PATHS = {
    BACKEND: '/containerapp',
    NGINX_ROUTE: '/${process.env.PLATFORM_ENV}/ui-container',
  };

  constructor() {
    this.config = App.loadConfigVars();
    // TODO: initialize things like DB's and passport for authentication
    this.verifyConfiguration();

    this.app = express();
    this.configMiddlewares();

    this.configureClientRoutes();
  }

  /**
   * Function to configure middleware for both express apps
   */
  protected configMiddlewares(): void {
    this.app.use(
      session({
        saveUninitialized: false, // don't create session until something stored
        resave: false, //don't save session if unmodified
        secret: this.config.SESSION_SECRET,
        cookie: {
          maxAge: DEFAULT_ABSOLUTE_SESSION_TIMEOUT_SEC,
        },
        store: MongoStore.create({
          mongoUrl: this.config.MONGO_URL,
        }),
      })
    );

    if (process.env.NODE_ENV === 'production') {
      if (!process.env.SESSION_SECRET) {
        LOG.warn('SESSION_SECRET is NOT set, please set a secret');
      }
    }

    if (!process.env.CORS_ORIGINS) {
      LOG.warn('CORS_ORIGINS is NOT set, CORS is disabled');
    }

    if (!process.env.CSP_SRC) {
      LOG.error('CSP_SRC is NOT set, please set a CSP script source environment variable');
      throw new Error('CSP_SRC not set');
    }

    this.app.enable('trust proxy');
    this.app.use(
      cors({
        origin: true
      })
    );

    const cspSrc = process.env.CSP_SRC.split(',');
    this.app.use(
      helmet({
        crossOriginEmbedderPolicy: false,
        contentSecurityPolicy: {
          directives: {
            'default-src': cspSrc,
            'script-src': cspSrc,
            'script-src-elem': cspSrc.concat("'unsafe-inline'"),
            'img-src': [...cspSrc, 'data:'],
          },
        },
        crossOriginResourcePolicy: {
          policy: 'cross-origin',
        },
      })
    );

    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: false }));
    this.app.use(cookieParser());
    this.app.use(compression());
    // Match anything but /static/* resources.
    this.app.use(NO_CACHE_URL_PATTERN, nocache());
  }

  /**
   * Function to configure routes for main app
   */
  protected configureClientRoutes(): void {
    // aws backend routes
    this.app.use(`${App.UI_BASE_PATHS.BACKEND}${App.API_BASE_PATHS.HEALTH}`, HealthRoutes.routes());
    this.app.use(`${App.UI_BASE_PATHS.BACKEND}${App.API_BASE_PATHS.AUTH}`, AuthRoutes.routes());
    this.app.use(`${App.UI_BASE_PATHS.BACKEND}${App.API_BASE_PATHS.ANALYTICS}`, AnalyticsRoutes.routes());
    this.app.use(`${App.UI_BASE_PATHS.BACKEND}${App.API_BASE_PATHS.USER}`, UserRoutes.routes());
    this.app.use(`${App.UI_BASE_PATHS.BACKEND}${App.API_BASE_PATHS.EMAIL}`, EmailRoutes.routes());
    this.app.use(`${App.UI_BASE_PATHS.BACKEND}${App.CLIENT_BASE_PATHS.REDIRECT}`, RedirectRoutes.routes());

    //onesourcetax.com nginx routes
    this.app.use(`${App.UI_BASE_PATHS.NGINX_ROUTE}${App.API_BASE_PATHS.HEALTH}`, HealthRoutes.routes());
    this.app.use(`${App.UI_BASE_PATHS.NGINX_ROUTE}${App.API_BASE_PATHS.AUTH}`, AuthRoutes.routes());
    this.app.use(`${App.UI_BASE_PATHS.NGINX_ROUTE}${App.API_BASE_PATHS.ANALYTICS}`, AnalyticsRoutes.routes());
    this.app.use(`${App.UI_BASE_PATHS.NGINX_ROUTE}${App.API_BASE_PATHS.USER}`, UserRoutes.routes());
    this.app.use(`${App.UI_BASE_PATHS.NGINX_ROUTE}${App.API_BASE_PATHS.EMAIL}`, EmailRoutes.routes());
    this.app.use(`${App.UI_BASE_PATHS.NGINX_ROUTE}${App.CLIENT_BASE_PATHS.REDIRECT}`, RedirectRoutes.routes());

    // local routes
    this.app.use(App.API_BASE_PATHS.HEALTH, HealthRoutes.routes());
    this.app.use(App.API_BASE_PATHS.AUTH, AuthRoutes.routes());
    this.app.use(App.API_BASE_PATHS.ANALYTICS, AnalyticsRoutes.routes());
    this.app.use(App.API_BASE_PATHS.USER, UserRoutes.routes());
    this.app.use(App.API_BASE_PATHS.EMAIL, EmailRoutes.routes());
    this.app.use(App.CLIENT_BASE_PATHS.REDIRECT, RedirectRoutes.routes());

    // this must be defined last since it has a 'catch all' route
    this.app.use(App.UI_BASE_PATHS.BACKEND, ClientRoutes.routes());
    this.app.use(App.UI_BASE_PATHS.NGINX_ROUTE, ClientRoutes.routes());
    this.app.use(ClientRoutes.routes());
  }

  protected verifyConfiguration(): void {
    LOG.info(
      `Starting ${PACKAGE_NAME} v${PACKAGE_VERSION} with configuration: ${JSON.stringify(
        {
          AI_ASSISTANT_REMOTE_ENTRY_URL: process.env.AI_ASSISTANT_REMOTE_ENTRY_URL,
          AI_SKILLS_REMOTE_ENTRY_URL: process.env.AI_SKILLS_REMOTE_ENTRY_URL,
          MATTERS_REMOTE_ENTRY_URL: process.env.MATTERS_REMOTE_ENTRY_URL,
          FILE_MANAGEMENT_REMOTE_ENTRY_URL: process.env.FILE_MANAGEMENT_REMOTE_ENTRY_URL,
        },
        null,
        2
      )}`
    );
  }

  /**
   * Utility for getting the express application.
   * @return The Express app.
   */
  public getApplication() {
    return this.app;
  }

  /**
   * @returns Config variables loaded from `process.env`.
   */
  private static loadConfigVars(): Config {
    const { SESSION_SECRET, MONGO_URL } = process.env;
    return ensureDefined(
      {
        SESSION_SECRET,
        MONGO_URL,
      },
      (unset) => `${defaultUnsetMessage(unset)}. You can get SESSION_SECRET from 1Password`
    );
  }
}
