import { config } from '@auth/config';
import { checkConnection } from '@auth/elasticsearch';
import { createConnection } from '@auth/queues/connection';
import { appRoutes } from '@auth/routes';
import { CustomError, IAuthPayload, IErrorResponse, winstonLogger } from '@vuphuc47edge/jobber-shared';
import { Channel } from 'amqplib';
import compression from 'compression';
import cors from 'cors';
import { Application, NextFunction, Request, Response, json, urlencoded } from 'express';
import 'express-async-errors';
import helmet from 'helmet';
import hpp from 'hpp';
import http from 'http';
import { verify } from 'jsonwebtoken';
import { Logger } from 'winston';

const SERVER_PORT = 4002;
const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'AuthServer', 'debug');

export let authChannel: Channel;

export const start = (app: Application): void => {
  securityMiddleware(app);
  standardMiddleware(app);
  routesMiddleware(app);
  startQueues();
  startElasticSearch();
  authErrorHandler(app);
  startServer(app);
};

const securityMiddleware = (app: Application): void => {
  app.set('trust proxy', 1);

  app.use(hpp());
  app.use(helmet());
  app.use(
    cors({
      origin: config.API_GATEWAY_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    })
  );

  app.use((req: Request, _res: Response, next: NextFunction) => {
    if (req.headers.authorization) {
      const token: string = req.headers.authorization.split(' ')[1] as string;
      const payload: IAuthPayload = verify(token, config.JWT_TOKEN!) as IAuthPayload;
      req.currentUser = payload;
    }

    next();
  });
};

const standardMiddleware = (app: Application): void => {
  app.use(compression());
  app.use(json({ limit: '200mb' }));
  app.use(urlencoded({ extended: true, limit: '200mb' }));
};

const routesMiddleware = (app: Application): void => {
  appRoutes(app);
};

const startQueues = async (): Promise<void> => {
  authChannel = (await createConnection()) as Channel;
};

const startElasticSearch = (): void => {
  checkConnection();
};

const authErrorHandler = (app: Application): void => {
  app.use((error: IErrorResponse, _req: Request, res: Response, next: NextFunction) => {
    log.log('error', `AuthService ${error.comingFrom}:`, error);

    if (error instanceof CustomError) {
      res.status(error.statusCode).json(error.serializeErrors());
    }

    next();
  });
};

const startServer = (app: Application): void => {
  try {
    const httpServer: http.Server = new http.Server(app);
    log.info(`AuthService has started with process id ${process.pid}`);
    httpServer.listen(SERVER_PORT, () => {
      log.info(`AuthService running on port ${SERVER_PORT}...`);
    });
  } catch (error) {
    log.log('error', 'AuthService startServer() method error:', error);
  }
};
