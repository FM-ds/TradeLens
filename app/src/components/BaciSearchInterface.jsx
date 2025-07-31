import { useState, useEffect } from 'react';
import BaseSearchInterface from './BaseSearchInterface';
import useDatasetConfig from '../hooks/useDatasetConfig';
import useDatasetApi from '../hooks/useDatasetApi';

const BaciSearchInterface = ({ 
  onQueryCreated,
  disabled = false,
  initialState = {}
}) => {
  const { config, loading: configLoading, error: configError } = useDatasetConfig('baci');
  const api = useDatasetApi(config);

  // Search interface state
  const [selectedProducts, setSelectedProducts] = useState(initialState.selectedProducts || []);
  const [productSearch, setProductSearch] = useState('');
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);
  
  const [fromCountries, setFromCountries] = useState(initialState.fromCountries || []);
  const [fromCountrySearch, setFromCountrySearch] = useState('');
  const [showFromCountrySuggestions, setShowFromCountrySuggestions] = useState(false);
  
  const [toCountries, setToCountries] = useState(initialState.toCountries || []);
  const [toCountrySearch, setToCountrySearch] = useState('');
  const [showToCountrySuggestions, setShowToCountrySuggestions] = useState(false);
  
  const [tradeType, setTradeType] = useState(initialState.tradeType || 'exports');
  const [startYear, setStartYear] = useState(initialState.startYear || '2020');
  const [endYear, setEndYear] = useState(initialState.endYear || '2022');

  // API calls
  useEffect(() => {
    if (productSearch && config) {
      api.searchProducts(productSearch);
      setShowProductSuggestions(true);
    } else {
      setShowProductSuggestions(false);
    }
  }, [productSearch, config, api.searchProducts]);

  useEffect(() => {
    if (config && (fromCountrySearch || toCountrySearch || showFromCountrySuggestions || showToCountrySuggestions)) {
      const searchTerm = fromCountrySearch || toCountrySearch || '';
      api.searchCountries(searchTerm);
    }
  }, [fromCountrySearch, toCountrySearch, showFromCountrySuggestions, showToCountrySuggestions, config, api.searchCountries]);

  // Event handlers
  const handleProductSearch = (value) => {
    setProductSearch(value);
  };

  const handleSelectProduct = (product) => {
    const productKey = product[config?.product.codeField];
    if (!selectedProducts.find(p => p[config?.product.codeField] === productKey)) {
      setSelectedProducts([...selectedProducts, product]);
    }
    setProductSearch('');
    setShowProductSuggestions(false);
  };

  const handleRemoveProduct = (productCode) => {
    setSelectedProducts(selectedProducts.filter(p => p[config?.product.codeField] !== productCode));
  };

  const handleFromCountrySearch = (value) => {
    setFromCountrySearch(value);
  };

  const handleSelectFromCountry = (country) => {
    // Handle both string names (like "Everywhere", "World") and country objects
    const countryKey = typeof country === 'string' ? country : country.country_name;
    if (!fromCountries.find(c => (typeof c === 'string' ? c : c.country_name) === countryKey)) {
      setFromCountries([...fromCountries, country]);
    }
    setFromCountrySearch('');
    setShowFromCountrySuggestions(false);
  };

  const handleRemoveFromCountry = (country) => {
    const countryKey = typeof country === 'string' ? country : country.country_name;
    setFromCountries(fromCountries.filter(c => (typeof c === 'string' ? c : c.country_name) !== countryKey));
  };

  const handleToCountrySearch = (value) => {
    setToCountrySearch(value);
  };

  const handleSelectToCountry = (country) => {
    // Handle both string names (like "Everywhere", "World") and country objects
    const countryKey = typeof country === 'string' ? country : country.country_name;
    if (!toCountries.find(c => (typeof c === 'string' ? c : c.country_name) === countryKey)) {
      setToCountries([...toCountries, country]);
    }
    setToCountrySearch('');
    setShowToCountrySuggestions(false);
  };

  const handleRemoveToCountry = (country) => {
    const countryKey = typeof country === 'string' ? country : country.country_name;
    setToCountries(toCountries.filter(c => (typeof c === 'string' ? c : c.country_name) !== countryKey));
  };

  const handleExecuteQuery = () => {
    if (selectedProducts.length === 0) return;

    const query = {
      id: Date.now(),
      dataset: 'baci',
      name: `BACI Query ${Date.now()}`,
      tradeType,
      products: selectedProducts,
      fromCountries,
      toCountries,
      startYear,
      endYear,
      createdAt: new Date()
    };

    onQueryCreated?.(query);
  };

  // Loading and error states
  if (configLoading) {
    return (
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-8">
        <div className="text-center">Loading BACI configuration...</div>
      </div>
    );
  }

  if (configError) {
    return (
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-8">
        <div className="text-center text-red-400">Error loading BACI configuration: {configError}</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-8">
      {/* Dataset Description */}
      <div className="mb-6 p-4 bg-gray-700 rounded-lg border border-gray-600">
        <p className="text-sm text-gray-300 leading-relaxed">
          Search CEPII BACI data (based on UN Comtrade), available at{' '}
          <a 
            href="https://www.cepii.fr/CEPII/en/bdd_modele/bdd_modele_item.asp?id=37" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            CEPII.fr
          </a>
          . The data in the Beta version ranges from 2017-2022 and is based on HS17 product classifications. Note that data may be missing where data values have been suppressed.
        </p>
      </div>
      
      <BaseSearchInterface
        config={config}
        selectedProducts={selectedProducts}
        productSearch={productSearch}
        onProductSearch={handleProductSearch}
        showProductSuggestions={showProductSuggestions}
        productSuggestions={api.productSuggestions}
        onSelectProduct={handleSelectProduct}
        onRemoveProduct={handleRemoveProduct}
        tradeType={tradeType}
        onTradeTypeChange={setTradeType}
        fromCountries={fromCountries}
        fromCountrySearch={fromCountrySearch}
        onFromCountrySearch={handleFromCountrySearch}
        showFromCountrySuggestions={showFromCountrySuggestions}
        countrySuggestions={api.countrySuggestions}
        onSelectFromCountry={handleSelectFromCountry}
        onRemoveFromCountry={handleRemoveFromCountry}
        toCountries={toCountries}
        toCountrySearch={toCountrySearch}
        onToCountrySearch={handleToCountrySearch}
        showToCountrySuggestions={showToCountrySuggestions}
        onSelectToCountry={handleSelectToCountry}
        onRemoveToCountry={handleRemoveToCountry}
        onShowFromCountrySuggestions={setShowFromCountrySuggestions}
        onShowToCountrySuggestions={setShowToCountrySuggestions}
        startYear={startYear}
        onStartYearChange={setStartYear}
        endYear={endYear}
        onEndYearChange={setEndYear}
        onExecuteQuery={handleExecuteQuery}
        disabled={disabled}
      />
    </div>
  );
};

export default BaciSearchInterface;
