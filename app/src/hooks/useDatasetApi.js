import { useState, useEffect, useCallback } from 'react';

const useDatasetApi = (config) => {
  const [productSuggestions, setProductSuggestions] = useState([]);
  const [countrySuggestions, setCountrySuggestions] = useState([]);
  const [productLoading, setProductLoading] = useState(false);
  const [countryLoading, setCountryLoading] = useState(false);
  const [countryCodeMap, setCountryCodeMap] = useState({});

  // Load country code map on config change
  useEffect(() => {
    if (!config) return;

    const loadCountryCodeMap = async () => {
      try {
        const response = await fetch(`${config.apiBase}${config.endpoints.countries}?limit=1000`);
        const data = await response.json();
        const map = {};
        data.forEach(c => {
          if (c[config.country.nameField] && c[config.country.codeField]) {
            map[c[config.country.nameField]] = c[config.country.codeField];
          }
        });
        setCountryCodeMap(map);
      } catch (error) {
        console.error('Failed to load country code map:', error);
      }
    };

    loadCountryCodeMap();
  }, [config]);

  const searchProducts = useCallback(async (searchTerm, typeFilter = null) => {
    if (!config || !searchTerm) {
      setProductSuggestions([]);
      return;
    }

    setProductLoading(true);
    try {
      const params = new URLSearchParams({
        [config.product.searchParam]: searchTerm,
        [config.product.limitParam]: config.product.defaultLimit
      });
      
      // Add product_type parameter if specified in config
      if (config.product.productTypeParam && config.product.productType) {
        params.append(config.product.productTypeParam, config.product.productType);
      }
      
      // Add type filter if provided (for filtering Division/Industry/Product)
      if (typeFilter) {
        params.append('type', typeFilter);
      }
      
      const response = await fetch(`${config.apiBase}${config.endpoints.products}?${params}`);
      const data = await response.json();
      setProductSuggestions(data);
    } catch (error) {
      console.error('Failed to search products:', error);
      setProductSuggestions([]);
    } finally {
      setProductLoading(false);
    }
  }, [config]);

  const searchCountries = useCallback(async (searchTerm) => {
    if (!config) {
      setCountrySuggestions([]);
      return;
    }

    setCountryLoading(true);
    try {
      const params = new URLSearchParams({
        [config.country.searchParam]: searchTerm || '',
        [config.country.limitParam]: config.country.defaultLimit
      });
      
      const response = await fetch(`${config.apiBase}${config.endpoints.countries}?${params}`);
      const data = await response.json();
      setCountrySuggestions(data);
    } catch (error) {
      console.error('Failed to search countries:', error);
      setCountrySuggestions([]);
    } finally {
      setCountryLoading(false);
    }
  }, [config]);

  const executeTradeQuery = useCallback(async (queryParams, page = 1, pageSize = 10) => {
    if (!config) return { data: [], total_records: 0, total_pages: 1, apiUrl: '' };

    try {
      const params = new URLSearchParams({
        [config.query.params.trade_type]: queryParams.tradeType,
        [config.query.params.product_codes]: queryParams.productCodes,
        [config.query.params.from_country]: queryParams.fromCountry,
        [config.query.params.to_country]: queryParams.toCountry,
        [config.query.params.year_from]: queryParams.yearFrom,
        [config.query.params.year_to]: queryParams.yearTo,
        [config.query.params.page]: page,
        [config.query.params.page_size]: pageSize
      });

      const fullUrl = `${config.apiBase}${config.endpoints.tradeQuery}?${params}`;
      const response = await fetch(fullUrl);
      const data = await response.json();
      
      // Return the URL along with the data so it can be stored and reused
      return { ...data, apiUrl: fullUrl };
    } catch (error) {
      console.error('Failed to execute trade query:', error);
      return { data: [], total_records: 0, total_pages: 1, apiUrl: '' };
    }
  }, [config]);

  const executeProdcomQuery = useCallback(async (queryParams, page = 1, pageSize = 10) => {
    if (!config) return { data: [], total_records: 0, total_pages: 1 };

    try {
      const params = new URLSearchParams({
        [config.query.params.product_codes]: queryParams.productCodes,
        [config.query.params.year_from]: queryParams.yearFrom,
        [config.query.params.year_to]: queryParams.yearTo,
        [config.query.params.measure]: queryParams.measure,
        [config.query.params.page]: page,
        [config.query.params.page_size]: pageSize
      });

      const response = await fetch(`${config.apiBase}${config.endpoints.tradeQuery}?${params}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to execute PRODCOM query:', error);
      return { data: [], total_records: 0, total_pages: 1 };
    }
  }, [config]);

  const getCountryCodeByName = useCallback((name) => {
    if (!name) return '';
    return countryCodeMap[name] || name;
  }, [countryCodeMap]);

  return {
    productSuggestions,
    countrySuggestions,
    productLoading,
    countryLoading,
    searchProducts,
    searchCountries,
    executeTradeQuery,
    executeProdcomQuery,
    getCountryCodeByName
  };
};

export default useDatasetApi;
