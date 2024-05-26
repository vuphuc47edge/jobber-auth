import { config } from '@auth/config';
import { winstonLogger } from '@vuphuc47edge/jobber-shared';
import { Sequelize } from 'sequelize';
import { Logger } from 'winston';

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'AuthServiceDatabase', 'debug');

export const sequelize = new Sequelize(config.MYSQL_DB!, {
  dialect: 'mysql',
  logging: false,
  dialectOptions: {
    multipleStatements: true
  }
});

export const databaseConnection = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    log.info('AuthService Mysql database connection has been astablished success.');
  } catch (error) {
    log.error('AuthService - Unable to connect to database.');
    log.log('error', 'AuthService databaseConnection() method error:', error);
  }
};
