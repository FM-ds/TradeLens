import { Search, Package } from 'lucide-react';

const BaseSearchInterface = ({
  config,
  selectedProducts,
  productSearch,
  onProductSearch,
  showProductSuggestions,
  productSuggestions,
  onSelectProduct,
  onRemoveProduct,
  tradeType,
  onTradeTypeChange,
  fromCountries,
  fromCountrySearch,
  onFromCountrySearch,
  showFromCountrySuggestions,
  countrySuggestions,
  onSelectFromCountry,
  onRemoveFromCountry,
  toCountries,
  toCountrySearch,
  onToCountrySearch,
  showToCountrySuggestions,
  onSelectToCountry,
  onRemoveToCountry,
  onShowFromCountrySuggestions,
  onShowToCountrySuggestions,
  startYear,
  onStartYearChange,
  endYear,
  onEndYearChange,
  onExecuteQuery,
  disabled = false
}) => {
  if (!config) return null;

  const formatProductPill = (product) => {
    const code = product[config.product.codeField] || '';
    const name = product[config.product.nameField] || product.description || '';
    const truncateLength = config.ui?.productNameTruncate || 12;
    const displayName = config.ui?.productPillFormat
      ?.replace('{code}', code)
      ?.replace('{name}', name.length > truncateLength ? name.slice(0, truncateLength) + '...' : name)
      || `${code}:${name.length > truncateLength ? name.slice(0, truncateLength) + '...' : name}`;
    return displayName;
  };

  const getProductKey = (product) => product[config.product.codeField];
  const getCountryName = (suggestion) => suggestion[config.country.nameField] || suggestion;

  return (
    <div className="space-y-8">
      {/* Main Question */}
      <div>
        <h3 className="text-3xl font-medium text-gray-300 mb-6">What are you looking for?</h3>
        {/* Product Search */}
        <div className="relative">
          <Package className="absolute left-0 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6 z-10" />
          <div className="pl-8 pr-4 py-4 min-h-[60px] flex flex-wrap gap-3 items-center border-b-2 border-gray-600 focus-within:border-blue-500 transition-colors bg-transparent">
            {/* Product Pills */}
            {selectedProducts.map((product) => (
              <div key={getProductKey(product)} className="bg-blue-600 text-white px-3 py-1 rounded-full flex items-center gap-2 text-sm font-medium">
                <span>{formatProductPill(product)}</span>
                <button 
                  onClick={() => onRemoveProduct(getProductKey(product))} 
                  className="text-blue-200 hover:text-white text-lg leading-none"
                >
                  ×
                </button>
              </div>
            ))}
            {/* Search Input */}
            <input
              type="text"
              value={productSearch}
              onChange={(e) => onProductSearch(e.target.value)}
              placeholder="Search by products, services, commodity codes, and e.t.c"
              className="flex-1 bg-transparent text-white text-xl placeholder-gray-400 focus:outline-none min-w-64 border-none"
              disabled={disabled}
            />
          </div>
          {/* Product Suggestions */}
          {showProductSuggestions && productSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-gray-700 border border-gray-600 rounded-lg mt-2 shadow-xl z-20 max-h-64 overflow-y-auto">
              {productSuggestions.slice(0, config.product.defaultLimit).map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => onSelectProduct(suggestion)}
                  className="w-full text-left px-6 py-4 hover:bg-gray-600 text-white border-b border-gray-600 last:border-b-0 transition-colors flex flex-col items-start"
                >
                  <span className="text-sm text-gray-400 truncate">
                    {suggestion[config.product.codeField] || suggestion.product_code}
                  </span>
                  <span className="font-medium text-lg">
                    {suggestion[config.product.nameField] || suggestion.description}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Trade Direction - only show if trade type options exist */}
      {config.query.tradeTypeOptions && config.query.tradeTypeOptions.length > 0 && (
        <div>
          <h4 className="text-xl text-gray-400 mb-4">Looking for...</h4>
          <div className="flex gap-4">
            {config.query.tradeTypeOptions.map((option) => (
              <button
                key={option}
                onClick={() => onTradeTypeChange(option)}
                disabled={disabled}
                className={`px-6 py-3 rounded-full font-medium text-base transition-colors ${
                  tradeType === option
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {option.replace('Trade: ', '')}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* From/To Countries */}
      <div>
        <h4 className="text-xl text-gray-400 mb-4">Location...</h4>
        <div className="flex items-end gap-6">
          {/* From Country */}
          <div className="relative flex-1">
            {/* From Country Pills */}
            <div className="flex flex-wrap gap-2 mb-2">
              {fromCountries.map((country) => (
                <div key={country} className="bg-blue-600 text-white px-3 py-1 rounded-full flex items-center gap-2 text-sm font-medium">
                  <span>{country}</span>
                  <button 
                    onClick={() => onRemoveFromCountry(country)} 
                    className="text-blue-200 hover:text-white text-lg leading-none"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            {/* From Country Input */}
            <div className="relative">
              <input
                type="text"
                value={fromCountrySearch}
                onChange={(e) => onFromCountrySearch(e.target.value)}
                onFocus={() => onShowFromCountrySuggestions(true)}
                onBlur={() => onShowFromCountrySuggestions(false)}
                className="w-full bg-transparent text-white text-lg placeholder-gray-400 focus:outline-none border-b-2 border-gray-600 focus:border-blue-500 transition-colors py-3"
                placeholder="Add exporter country..."
                disabled={disabled}
              />
              {/* From Country Suggestions */}
              {showFromCountrySuggestions && (
                <div className="absolute top-full left-0 right-0 bg-gray-700 border border-gray-600 rounded-lg mt-2 shadow-xl z-20 max-h-48 overflow-y-auto">
                  {countrySuggestions.slice(0, config.country.defaultLimit).map((suggestion, index) => (
                    <button
                      key={index}
                      onMouseDown={e => {
                        e.preventDefault();
                        onSelectFromCountry(getCountryName(suggestion));
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-600 text-white border-b border-gray-600 last:border-b-0"
                    >
                      {getCountryName(suggestion)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="text-gray-400 text-lg pb-3">
            to
          </div>

          {/* To Country */}
          <div className="relative flex-1">
            {/* To Country Pills */}
            <div className="flex flex-wrap gap-2 mb-2">
              {toCountries.map((country) => (
                <div key={country} className="bg-blue-600 text-white px-3 py-1 rounded-full flex items-center gap-2 text-sm font-medium">
                  <span>{country}</span>
                  <button 
                    onClick={() => onRemoveToCountry(country)} 
                    className="text-blue-200 hover:text-white text-lg leading-none"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            {/* To Country Input */}
            <div className="relative">
              <input
                type="text"
                value={toCountrySearch}
                onChange={(e) => onToCountrySearch(e.target.value)}
                onFocus={() => onShowToCountrySuggestions(true)}
                onBlur={() => onShowToCountrySuggestions(false)}
                className="w-full bg-transparent text-white text-lg placeholder-gray-400 focus:outline-none border-b-2 border-gray-600 focus:border-blue-500 transition-colors py-3"
                placeholder="Add importer country..."
                disabled={disabled}
              />
              {/* To Country Suggestions */}
              {showToCountrySuggestions && (
                <div className="absolute top-full left-0 right-0 bg-gray-700 border border-gray-600 rounded-lg mt-2 shadow-xl z-20 max-h-48 overflow-y-auto">
                  {!toCountrySearch && config.ui?.showEverywhereOption && (
                    <>
                      <button
                        onMouseDown={e => {
                          e.preventDefault();
                          onSelectToCountry('Everywhere');
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-600 text-white border-b border-gray-600 font-medium"
                      >
                        <div className="font-medium">Everywhere</div>
                        <div className="text-xs text-gray-400">Individual country records</div>
                      </button>
                      {config.ui?.showWorldOption && (
                        <button
                          onMouseDown={e => {
                            e.preventDefault();
                            onSelectToCountry('World');
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-gray-600 text-white border-b border-gray-600 font-medium"
                        >
                          <div className="font-medium">World</div>
                          <div className="text-xs text-gray-400">Aggregated global data</div>
                        </button>
                      )}
                    </>
                  )}
                  {countrySuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onMouseDown={e => {
                        e.preventDefault();
                        onSelectToCountry(getCountryName(suggestion));
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-600 text-white border-b border-gray-600 last:border-b-0"
                    >
                      {getCountryName(suggestion)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Time Period */}
      <div>
        <h4 className="text-xl text-gray-400 mb-4">Between...</h4>
        <div className="flex items-end gap-6 max-w-md">
          <div className="flex-1">
            <select 
              value={startYear} 
              onChange={(e) => onStartYearChange(e.target.value)} 
              className="w-full bg-transparent text-white text-lg focus:outline-none border-b-2 border-gray-600 focus:border-blue-500 transition-colors py-3 appearance-none"
              disabled={disabled}
            >
              {(() => {
                const yearRange = config.query?.yearRange;
                if (yearRange) {
                  return Array.from({length: yearRange.max - yearRange.min + 1}, (_, i) => yearRange.max - i).map(year => (
                    <option key={year} value={year} className="bg-gray-700">{year}</option>
                  ));
                } else {
                  return Array.from({length: 15}, (_, i) => 2024 - i).map(year => (
                    <option key={year} value={year} className="bg-gray-700">{year}</option>
                  ));
                }
              })()}
            </select>
          </div>
          <div className="text-gray-400 text-lg pb-3">and</div>
          <div className="flex-1">
            <select 
              value={endYear} 
              onChange={(e) => onEndYearChange(e.target.value)} 
              className="w-full bg-transparent text-white text-lg focus:outline-none border-b-2 border-gray-600 focus:border-blue-500 transition-colors py-3 appearance-none"
              disabled={disabled}
            >
              {(() => {
                const yearRange = config.query?.yearRange;
                if (yearRange) {
                  return Array.from({length: yearRange.max - yearRange.min + 1}, (_, i) => yearRange.max - i).map(year => (
                    <option key={year} value={year} className="bg-gray-700">{year}</option>
                  ));
                } else {
                  return Array.from({length: 15}, (_, i) => 2024 - i).map(year => (
                    <option key={year} value={year} className="bg-gray-700">{year}</option>
                  ));
                }
              })()}
            </select>
          </div>
        </div>
      </div>

      {/* Search Button */}
      <div>
        <button 
          onClick={onExecuteQuery} 
          disabled={disabled || selectedProducts.length === 0} 
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-medium text-lg transition-colors flex items-center gap-3"
        >
          <Search className="w-5 h-5" />
          Search
        </button>
      </div>
    </div>
  );
};

export default BaseSearchInterface;
