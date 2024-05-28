import { elasticSearchClient, getDocumentByID } from '@auth/elasticsearch';
import { SearchResponse } from '@elastic/elasticsearch/lib/api/types';
import { IHitsTotal, IPaginateProps, IQueryList, ISearchResult, ISellerGig } from '@vuphuc47edge/jobber-shared';

export const gigById = async (index: string, gigId: string): Promise<ISellerGig> => {
  const gig = await getDocumentByID(index, gigId);
  return gig;
};

export const gigsSearch = async (
  searchQuery: string,
  paginate: IPaginateProps,
  deliveryTime: string,
  min?: number,
  max?: number
): Promise<ISearchResult> => {
  const { from, size, type } = paginate;
  const queryList: IQueryList[] = [
    {
      query_string: {
        fields: ['username', 'title', 'description', 'basicDescription', 'basicTitle', 'categories', 'subCategories', 'tags'],
        query: `*${searchQuery}*`
      }
    },
    {
      term: {
        active: true
      }
    }
  ];

  if (deliveryTime !== 'undefined') {
    queryList.push({
      query_string: {
        fields: ['expectedDelivery'],
        query: `*${deliveryTime}*`
      }
    });
  }

  if (!isNaN(parseInt(`${min}`)) && !isNaN(parseInt(`${max}`))) {
    queryList.push({
      range: {
        price: {
          gte: min,
          lte: max
        }
      }
    });
  }

  const result: SearchResponse = await elasticSearchClient.search({
    index: 'gigs',
    size,
    query: {
      bool: {
        must: [...queryList]
      }
    },
    sort: [
      {
        sortId: type === 'forward' ? 'asc' : 'desc'
      }
    ],
    ...(from !== '0' && { search_after: [from] })
  });

  const total: IHitsTotal = result.hits.total as IHitsTotal;

  return {
    total: total.value,
    hits: result.hits.hits
  };
};
