import { useState, useEffect } from 'react';
import useDatasetConfig from './useDatasetConfig';
import useDatasetApi from './useDatasetApi';

const useTradeQuery = (query, currentPage = 1, rowsPerPage = 10) => {
  const { config } = useDatasetConfig(query?.dataset);
  const api = useDatasetApi(config);
  
  const [tradeData, setTradeData] = useState([]);
  const [tradeDataTotal, setTradeDataTotal] = useState(0);
  const [tradeDataTotalPages, setTradeDataTotalPages] = useState(1);
  const [tradeDataLoading, setTradeDataLoading] = useState(false);

  useEffect(() => {
    if (!query || !config) {
      setTradeData([]);
      setTradeDataTotal(0);
      setTradeDataTotalPages(1);
      return;
    }

    const executeQuery = async () => {
      setTradeDataLoading(true);

      try {
        let queryParams;
        let result;

        if (query.dataset === 'baci') {
          // BACI query parameters
          const tradeType = query.tradeType.toLowerCase().includes('trade:') 
            ? query.tradeType.toLowerCase().replace('trade: ', '')
            : query.tradeType.toLowerCase();
          const productCodes = query.products.map(p => p[config.product.codeField]).join(',');
          
          // Map countries to codes, handling special cases
          const fromCountry = query.fromCountries.map(c => {
            if (c.toLowerCase() === 'everywhere') return 'everywhere';
            if (c.toLowerCase() === 'world') return 'world';
            return api.getCountryCodeByName(c);
          }).join(',');
          
          const toCountry = query.toCountries.map(c => {
            if (c.toLowerCase() === 'everywhere') return 'everywhere';
            if (c.toLowerCase() === 'world') return 'world';
            return api.getCountryCodeByName(c);
          }).join(',');

          queryParams = {
            tradeType,
            productCodes,
            fromCountry,
            toCountry,
            yearFrom: query.startYear,
            yearTo: query.endYear
          };

          result = await api.executeTradeQuery(queryParams, currentPage, rowsPerPage);
        } else if (query.dataset === 'prodcom') {
          // PRODCOM query parameters
          const productCodes = query.products.map(p => p[config.product.codeField]).join(',');
          
          queryParams = {
            productCodes,
            yearFrom: query.startYear,
            yearTo: query.endYear,
            measure: query.measureType
          };

          result = await api.executeProdcomQuery(queryParams, currentPage, rowsPerPage);
        } else {
          throw new Error(`Unsupported dataset: ${query.dataset}`);
        }
        
        setTradeData(result.data || []);
        setTradeDataTotal(result.total_records || 0);
        setTradeDataTotalPages(result.total_pages || 1);
      } catch (error) {
        console.error('Failed to execute trade query:', error);
        setTradeData([]);
        setTradeDataTotal(0);
        setTradeDataTotalPages(1);
      } finally {
        setTradeDataLoading(false);
      }
    };

    executeQuery();
  }, [query, currentPage, rowsPerPage, config, api.executeTradeQuery, api.getCountryCodeByName]);

  return {
    tradeData,
    tradeDataTotal,
    tradeDataTotalPages,
    tradeDataLoading
  };
};

export default useTradeQuery;
