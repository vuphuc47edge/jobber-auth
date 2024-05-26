import { config } from '@auth/config';
import { databaseConnection } from '@auth/database';
import { start } from '@auth/server';
import express, { Express } from 'express';

const initialize = (): void => {
  databaseConnection();
  config.cloudinaryConfig();
  const app: Express = express();
  start(app);
};

initialize();
