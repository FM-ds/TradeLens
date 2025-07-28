import { useState, useEffect } from 'react';
import { Package } from 'lucide-react';
import BaseSearchInterface from './BaseSearchInterface';
import useDatasetConfig from '../hooks/useDatasetConfig';
import useDatasetApi from '../hooks/useDatasetApi';

const ProdcomSearchInterface = ({ 
  onQueryCreated,
  disabled = false,
  initialState = {}
}) => {
  const { config, loading: configLoading, error: configError } = useDatasetConfig('prodcom');
  const api = useDatasetApi(config);

  // Search interface state
  const [selectedProducts, setSelectedProducts] = useState(initialState.selectedProducts || []);
  const [productSearch, setProductSearch] = useState('');
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);
  const [productTypeFilter, setProductTypeFilter] = useState(initialState.productTypeFilter || 'Product');
  
  const [measureType, setMeasureType] = useState(initialState.measureType || 'Value');
  const [startYear, setStartYear] = useState(initialState.startYear || '2020');
  const [endYear, setEndYear] = useState(initialState.endYear || '2024');

  // API calls with product type filtering
  useEffect(() => {
    if (productSearch && config) {
      api.searchProducts(productSearch, productTypeFilter);
      setShowProductSuggestions(true);
    } else {
      setShowProductSuggestions(false);
    }
  }, [productSearch, productTypeFilter, config, api.searchProducts]);

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

  const handleProductTypeFilterChange = (newFilter) => {
    setProductTypeFilter(newFilter);
    // Clear current search to trigger new results with the filter
    if (productSearch) {
      api.searchProducts(productSearch, newFilter);
    }
  };

  const handleExecuteQuery = () => {
    if (selectedProducts.length === 0) return;

    const query = {
      id: Date.now(),
      dataset: 'prodcom',
      name: `PRODCOM Query ${Date.now()}`,
      measureType,
      products: selectedProducts,
      productTypeFilter,
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
        <div className="text-center">Loading PRODCOM configuration...</div>
      </div>
    );
  }

  if (configError) {
    return (
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-8">
        <div className="text-center text-red-400">Error loading PRODCOM configuration: {configError}</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-8">
      <div className="space-y-8">
        {/* Main Question */}
        <div>
          <h3 className="text-3xl font-medium text-gray-300 mb-6">What are you looking for?</h3>
          
          {/* Product Type Filter Toggle */}
          <div className="mb-6">
            <div className="flex gap-2">
              {['Division', 'Industry', 'Product'].map((type) => (
                <button
                  key={type}
                  onClick={() => handleProductTypeFilterChange(type)}
                  className={`px-4 py-2 text-base rounded-md border transition-colors ${
                    productTypeFilter === type
                      ? 'bg-purple-600 border-purple-500 text-white'
                      : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                  }`}
                  disabled={disabled}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Product Search Input - BACI Style */}
          <div className="relative">
            <Package className="absolute left-0 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6 z-10" />
            <div className="pl-8 pr-4 py-4 min-h-[60px] flex flex-wrap gap-3 items-center border-b-2 border-gray-600 focus-within:border-purple-500 transition-colors bg-transparent">
              {/* Product Pills */}
              {selectedProducts.map((product) => (
                <div key={product[config?.product.codeField]} className="bg-purple-600 text-white px-3 py-1 rounded-full flex items-center gap-2 text-sm font-medium">
                  <span>{product[config?.product.codeField]}:{product[config?.product.nameField]?.substring(0, 20)}...</span>
                  <button 
                    onClick={() => handleRemoveProduct(product[config?.product.codeField])} 
                    className="text-purple-200 hover:text-white text-lg leading-none"
                    disabled={disabled}
                  >
                    ×
                  </button>
                </div>
              ))}
              {/* Search Input */}
              <input
                type="text"
                value={productSearch}
                onChange={(e) => handleProductSearch(e.target.value)}
                placeholder={`Search ${productTypeFilter.toLowerCase()}s by code, name, keywords...`}
                className="flex-1 bg-transparent text-white text-xl placeholder-gray-400 focus:outline-none min-w-64 border-none"
                disabled={disabled}
              />
            </div>
            
            {/* Product Suggestions */}
            {showProductSuggestions && api.productSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-gray-700 border border-gray-600 rounded-lg mt-2 shadow-xl z-20 max-h-64 overflow-y-auto">
                {api.productSuggestions.slice(0, config?.product.defaultLimit || 8).map((product, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectProduct(product)}
                    className="w-full text-left px-6 py-4 hover:bg-gray-600 text-white border-b border-gray-600 last:border-b-0 transition-colors flex flex-col items-start"
                    disabled={disabled}
                  >
                    <span className="text-sm text-gray-400 truncate">
                      {product[config?.product.codeField]}
                    </span>
                    <span className="font-medium text-lg">
                      {product[config?.product.nameField]}
                    </span>
                    <span className="text-gray-400 text-xs">({product.type})</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Measure Type Selection */}
        <div>
          <h4 className="text-xl text-gray-400 mb-4">I want to see...</h4>
          <div className="flex gap-2">
            {['Value', 'Volume', 'Average price/Other'].map((type) => (
              <button
                key={type}
                onClick={() => setMeasureType(type)}
                className={`px-4 py-2 text-base rounded-md border transition-colors ${
                  measureType === type
                    ? 'bg-purple-600 border-purple-500 text-white'
                    : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                }`}
                disabled={disabled}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Year Range */}
        <div>
          <h4 className="text-xl text-gray-400 mb-4">Between...</h4>
          <div className="flex items-end gap-6 max-w-md">
            <div className="flex-1">
              <select
                value={startYear}
                onChange={(e) => setStartYear(e.target.value)}
                className="w-full bg-transparent text-white text-lg focus:outline-none border-b-2 border-gray-600 focus:border-purple-500 transition-colors py-3 appearance-none"
                disabled={disabled}
              >
                {Array.from({ length: 11 }, (_, i) => 2014 + i).map(year => (
                  <option key={year} value={year.toString()} className="bg-gray-700">{year}</option>
                ))}
              </select>
            </div>
            <div className="text-gray-400 text-lg pb-3">and</div>
            <div className="flex-1">
              <select
                value={endYear}
                onChange={(e) => setEndYear(e.target.value)}
                className="w-full bg-transparent text-white text-lg focus:outline-none border-b-2 border-gray-600 focus:border-purple-500 transition-colors py-3 appearance-none"
                disabled={disabled}
              >
                {Array.from({ length: 11 }, (_, i) => 2014 + i).map(year => (
                  <option key={year} value={year.toString()} className="bg-gray-700">{year}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Execute Query Button */}
        <button
          onClick={handleExecuteQuery}
          disabled={disabled || selectedProducts.length === 0}
          className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {selectedProducts.length === 0 ? 'Select products to query' : 'Execute Query'}
        </button>
      </div>
    </div>
  );
};

export default ProdcomSearchInterface;
