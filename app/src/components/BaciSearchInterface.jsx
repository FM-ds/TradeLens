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
  
  const [tradeType, setTradeType] = useState(initialState.tradeType || 'Trade: Imports');
  const [startYear, setStartYear] = useState(initialState.startYear || '2020');
  const [endYear, setEndYear] = useState(initialState.endYear || '2024');

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
    if (!fromCountries.includes(country)) {
      setFromCountries([...fromCountries, country]);
    }
    setFromCountrySearch('');
    setShowFromCountrySuggestions(false);
  };

  const handleRemoveFromCountry = (country) => {
    setFromCountries(fromCountries.filter(c => c !== country));
  };

  const handleToCountrySearch = (value) => {
    setToCountrySearch(value);
  };

  const handleSelectToCountry = (country) => {
    if (!toCountries.includes(country)) {
      setToCountries([...toCountries, country]);
    }
    setToCountrySearch('');
    setShowToCountrySuggestions(false);
  };

  const handleRemoveToCountry = (country) => {
    setToCountries(toCountries.filter(c => c !== country));
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
      {/* Dataset Info Header */}
      <div className="mb-8">
        <div className="rounded-lg border-2 border-blue-500 ring-2 ring-blue-500 bg-gray-800 px-8 py-6 flex flex-col items-start min-w-[220px] shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base font-bold">{config.name}</span>
          </div>
          <div className="text-lg font-semibold mb-1">Trade flows</div>
          <div className="text-sm text-gray-300 mb-1">2017-2022</div>
          <div className="text-sm text-gray-400 mb-4">{config.description}</div>
          <div className="flex items-center gap-2 mt-4 pt-2 border-t border-gray-700 w-full">
            <span className="text-lg text-blue-400">⚡</span>
            <span className="text-xs text-blue-400">Fast</span>
          </div>
        </div>
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
