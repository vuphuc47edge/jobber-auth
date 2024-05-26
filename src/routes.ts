import { authRoutes } from '@auth/routes/auth';
import { currentUserRoutes } from '@auth/routes/current-user';
import { healthRoutes } from '@auth/routes/health';
import { verifyGatewayRequest } from '@vuphuc47edge/jobber-shared';
import { Application } from 'express';

const BASE_PATH = '/api/v1/auth';

export const appRoutes = (app: Application): void => {
  app.use('', healthRoutes());
  app.use(BASE_PATH, verifyGatewayRequest, authRoutes());
  app.use(BASE_PATH, verifyGatewayRequest, currentUserRoutes());
};
