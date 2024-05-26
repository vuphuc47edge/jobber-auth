import { config } from '@auth/config';
import { Client } from '@elastic/elasticsearch';
import { ClusterHealthHealthResponseBody } from '@elastic/elasticsearch/lib/api/types';
import { winstonLogger } from '@vuphuc47edge/jobber-shared';
import { Logger } from 'winston';

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'AuthServiceElasticSearch', 'debug');

const elasticSearchClient = new Client({
  node: `${config.ELASTIC_SEARCH_URL}`
});

export const checkConnection = async (): Promise<void> => {
  let isConnected = false;

  while (!isConnected) {
    try {
      const health: ClusterHealthHealthResponseBody = await elasticSearchClient.cluster.health({});
      log.info(`AuthSerivce ElasticSearch health status - ${health.status}`);
      isConnected = true;
    } catch (error) {
      log.error('AuthService connecting to ElasticSearch failed. Retrying...');
      log.log('error', 'AuthService checkConnection() method error:', error);
    }
  }
};
