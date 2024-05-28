import { config } from '@auth/config';
import { Client } from '@elastic/elasticsearch';
import { ClusterHealthHealthResponseBody, GetResponse } from '@elastic/elasticsearch/lib/api/types';
import { ISellerGig, winstonLogger } from '@vuphuc47edge/jobber-shared';
import { Logger } from 'winston';

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'AuthServiceElasticSearch', 'debug');

export const elasticSearchClient = new Client({
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

const existingIndex = async (indexName: string): Promise<boolean> => {
  const result: boolean = await elasticSearchClient.indices.exists({ index: indexName });
  return result;
};

export const createIndex = async (indexName: string): Promise<void> => {
  try {
    const result: boolean = await existingIndex(indexName);

    if (result) {
      log.info(`Index "${indexName}" already exist.`);
    } else {
      await elasticSearchClient.indices.create({ index: indexName });
      await elasticSearchClient.indices.refresh({ index: indexName });
      log.info(`Created index ${indexName}`);
    }
  } catch (error) {
    log.error(`An error occured white creating the index ${indexName}...`);
    log.log('error', 'AuthService createIndex() method error:', error);
  }
};

export const getDocumentByID = async (index: string, gigId: string): Promise<ISellerGig> => {
  try {
    const result: GetResponse = await elasticSearchClient.get({
      index,
      id: gigId
    });

    return result._source as ISellerGig;
  } catch (error) {
    log.log('error', 'AuthService elasticsearch getDocumentByID() method error:', error);
    return {} as ISellerGig;
  }
};
