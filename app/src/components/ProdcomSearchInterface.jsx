import { useState, useEffect } from 'react';
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
      {/* Dataset Info Header */}
      <div className="mb-8">
        <div className="rounded-lg border-2 border-purple-500 ring-2 ring-purple-500 bg-gray-800 px-8 py-6 flex flex-col items-start min-w-[220px] shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base font-bold">{config.name}</span>
          </div>
          <div className="text-lg font-semibold mb-1">Manufacturers' Sales</div>
          <div className="text-sm text-gray-300 mb-1">2014-2024</div>
          <div className="text-sm text-gray-400 mb-4">{config.description}</div>
          <div className="flex items-center gap-2 mt-4 pt-2 border-t border-gray-700 w-full">
            <span className="text-lg text-purple-400">🏭</span>
            <span className="text-xs text-purple-400">Manufacturing</span>
          </div>
        </div>
      </div>

      {/* Products Search Section */}
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Products</label>
          
          {/* Product Type Filter Toggle */}
          <div className="mb-4">
            <div className="flex gap-2">
              {['Division', 'Industry', 'Product'].map((type) => (
                <button
                  key={type}
                  onClick={() => handleProductTypeFilterChange(type)}
                  className={`px-3 py-1 text-sm rounded-md border transition-colors ${
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

          {/* Product Search Input */}
          <div className="relative">
            <input
              type="text"
              value={productSearch}
              onChange={(e) => handleProductSearch(e.target.value)}
              placeholder={`Search ${productTypeFilter.toLowerCase()}s...`}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={disabled}
            />
            
            {/* Product Suggestions */}
            {showProductSuggestions && api.productSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {api.productSuggestions.map((product, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectProduct(product)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-600 focus:bg-gray-600 focus:outline-none"
                    disabled={disabled}
                  >
                    <span className="text-purple-400 text-sm">{product[config?.product.codeField]}</span>
                    <span className="text-white ml-2">{product[config?.product.nameField]}</span>
                    <span className="text-gray-400 text-xs ml-2">({product.type})</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Products */}
          {selectedProducts.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedProducts.map((product) => (
                <span
                  key={product[config?.product.codeField]}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-600 text-white"
                >
                  {product[config?.product.codeField]}:{product[config?.product.nameField]?.substring(0, 20)}...
                  <button
                    onClick={() => handleRemoveProduct(product[config?.product.codeField])}
                    className="ml-2 text-purple-300 hover:text-white"
                    disabled={disabled}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
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
