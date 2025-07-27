import { Search, Package } from 'lucide-react';

const SearchPanel = ({
  selectedProducts,
  productSearch,
  handleProductSearch,
  showProductSuggestions,
  filteredProductSuggestions,
  handleSelectProduct,
  handleRemoveProduct,
  tradeType,
  setTradeType,
  fromCountries,
  fromCountrySearch,
  handleFromCountrySearch,
  showFromCountrySuggestions,
  filteredFromCountrySuggestions,
  handleSelectFromCountry,
  handleRemoveFromCountry,
  toCountries,
  toCountrySearch,
  handleToCountrySearch,
  showToCountrySuggestions,
  filteredToCountrySuggestions,
  handleSelectToCountry,
  handleRemoveToCountry,
  setShowFromCountrySuggestions,
  setShowToCountrySuggestions,
  startYear,
  setStartYear,
  endYear,
  setEndYear,
  handleNewQuery,
  selectedDataset,
  setSelectedDataset,
  baciInfo
}) => (
  <div className="bg-gray-800 border border-gray-600 rounded-lg p-8">
    {/* Dataset Selector */}
    <div className="mb-8 flex gap-6">
      <button
        className={`rounded-lg border-2 border-gray-700 bg-gray-800 px-8 py-6 flex flex-col items-start min-w-[220px] shadow-lg transition-all ${selectedDataset === 'baci' ? 'border-blue-500 ring-2 ring-blue-500' : 'hover:border-blue-400'}`}
        onClick={() => setSelectedDataset('baci')}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base font-bold">{baciInfo.name}</span>
        </div>
        <div className="text-lg font-semibold mb-1">{baciInfo.title}</div>
        <div className="text-sm text-gray-300 mb-1">{baciInfo.yearRange}</div>
        <div className="text-sm text-gray-400 mb-4">{baciInfo.description}</div>
        <div className="flex items-center gap-2 mt-4 pt-2 border-t border-gray-700 w-full">
          <span className="text-lg text-blue-400">{baciInfo.speedIcon}</span>
          <span className="text-xs text-blue-400">{baciInfo.speed}</span>
        </div>
      </button>
      {/* Add more dataset buttons here in future */}
    </div>
    {/* Main Question */}
    <div className="mb-8">
      <h3 className="text-3xl font-medium text-gray-300 mb-6">What are you looking for?</h3>
      {/* Underlined Search Bar */}
      <div className="relative">
        <Package className="absolute left-0 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6 z-10" />
        <div className="pl-8 pr-4 py-4 min-h-[60px] flex flex-wrap gap-3 items-center border-b-2 border-gray-600 focus-within:border-blue-500 transition-colors bg-transparent">
          {/* Product Pills */}
          {selectedProducts.map((product) => {
            const code = product.code || '';
            const name = product.name || product.description || '';
            const displayName = `${code}:${name.length > 12 ? name.slice(0, 12) + '...' : name}`;
            return (
              <div key={product.code} className="bg-blue-600 text-white px-3 py-1 rounded-full flex items-center gap-2 text-sm font-medium">
                <span>{displayName}</span>
                <button onClick={() => handleRemoveProduct(product.code)} className="text-blue-200 hover:text-white text-lg leading-none">×</button>
              </div>
            );
          })}
          {/* Search Input */}
          <input
            type="text"
            value={productSearch}
            onChange={(e) => handleProductSearch(e.target.value)}
            placeholder="Search by products, services, commodity codes, and e.t.c"
            className="flex-1 bg-transparent text-white text-xl placeholder-gray-400 focus:outline-none min-w-64 border-none"
          />
        </div>
        {/* Product Suggestions */}
        {showProductSuggestions && filteredProductSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-gray-700 border border-gray-600 rounded-lg mt-2 shadow-xl z-20 max-h-64 overflow-y-auto">
            {filteredProductSuggestions.slice(0, 8).map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSelectProduct(suggestion)}
                className="w-full text-left px-6 py-4 hover:bg-gray-600 text-white border-b border-gray-600 last:border-b-0 transition-colors flex flex-col items-start"
              >
                <span className="text-sm text-gray-400 truncate">{suggestion.code || suggestion.product_code}</span>
                <span className="font-medium text-lg">{suggestion.name || suggestion.description}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
    {/* Trade Direction */}
    <div className="mb-8">
      <h4 className="text-xl text-gray-400 mb-4">Looking for...</h4>
      <div className="flex gap-4">
        <button onClick={() => setTradeType('Trade: Imports')} className={`px-6 py-3 rounded-full font-medium text-base transition-colors ${tradeType.includes('Imports') ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>Imports</button>
        <button onClick={() => setTradeType('Trade: Exports')} className={`px-6 py-3 rounded-full font-medium text-base transition-colors ${tradeType.includes('Exports') ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>Exports</button>
        <button onClick={() => setTradeType('Trade: All')} className={`px-6 py-3 rounded-full font-medium text-base transition-colors ${tradeType.includes('All') ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>All Trade</button>
      </div>
    </div>
    {/* From/To Countries */}
    <div className="mb-8">
      <h4 className="text-xl text-gray-400 mb-4">In Location...</h4>
      <div className="flex items-end gap-6">
        {/* From Country */}
        <div className="relative flex-1">
          {/* From Country Pills */}
          <div className="flex flex-wrap gap-2 mb-2">
            {fromCountries.map((country) => (
              <div key={country} className="bg-blue-600 text-white px-3 py-1 rounded-full flex items-center gap-2 text-sm font-medium">
                <span>{country}</span>
                <button onClick={() => handleRemoveFromCountry(country)} className="text-blue-200 hover:text-white text-lg leading-none">×</button>
              </div>
            ))}
          </div>
          {/* From Country Input */}
          <div className="relative">
            <input
              type="text"
              value={fromCountrySearch}
              onChange={(e) => handleFromCountrySearch(e.target.value)}
              onFocus={() => setShowFromCountrySuggestions(true)}
              onBlur={() => setShowFromCountrySuggestions(false)}
              className="w-full bg-transparent text-white text-lg placeholder-gray-400 focus:outline-none border-b-2 border-gray-600 focus:border-blue-500 transition-colors py-3"
              placeholder="Add from country..."
            />
            {/* Country Suggestions */}
            {showFromCountrySuggestions && (
              <div className="absolute top-full left-0 right-0 bg-gray-700 border border-gray-600 rounded-lg mt-2 shadow-xl z-20 max-h-48 overflow-y-auto">
                {filteredFromCountrySuggestions.slice(0, 6).map((suggestion, index) => (
                  <button
                    key={index}
                    onMouseDown={e => {
                      e.preventDefault();
                      handleSelectFromCountry(suggestion.country_name || suggestion);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-600 text-white border-b border-gray-600 last:border-b-0"
                  >
                    {suggestion.country_name || suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="text-gray-400 text-lg pb-3">to</div>
        {/* To Country */}
        <div className="relative flex-1">
          {/* To Country Pills */}
          <div className="flex flex-wrap gap-2 mb-2">
            {toCountries.map((country) => (
              <div key={country} className="bg-blue-600 text-white px-3 py-1 rounded-full flex items-center gap-2 text-sm font-medium">
                <span>{country}</span>
                <button onClick={() => handleRemoveToCountry(country)} className="text-blue-200 hover:text-white text-lg leading-none">×</button>
              </div>
            ))}
          </div>
          {/* To Country Input */}
          <div className="relative">
            <input
              type="text"
              value={toCountrySearch}
              onChange={(e) => handleToCountrySearch(e.target.value)}
              onFocus={() => setShowToCountrySuggestions(true)}
              onBlur={() => setShowToCountrySuggestions(false)}
              className="w-full bg-transparent text-white text-lg placeholder-gray-400 focus:outline-none border-b-2 border-gray-600 focus:border-blue-500 transition-colors py-3"
              placeholder="Add to country..."
            />
            {/* To Country Suggestions */}
            {showToCountrySuggestions && (
              <div className="absolute top-full left-0 right-0 bg-gray-700 border border-gray-600 rounded-lg mt-2 shadow-xl z-20 max-h-48 overflow-y-auto">
                {!toCountrySearch && (
                  <>
                    <button
                      onMouseDown={e => {
                        e.preventDefault();
                        handleSelectToCountry('Everywhere');
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-600 text-white border-b border-gray-600 font-medium"
                    >
                      <div className="font-medium">Everywhere</div>
                      <div className="text-xs text-gray-400">Individual country records</div>
                    </button>
                    <button
                      onMouseDown={e => {
                        e.preventDefault();
                        handleSelectToCountry('World');
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-600 text-white border-b border-gray-600 font-medium"
                    >
                      <div className="font-medium">World</div>
                      <div className="text-xs text-gray-400">Aggregated global data</div>
                    </button>
                  </>
                )}
                {filteredToCountrySuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onMouseDown={e => {
                      e.preventDefault();
                      handleSelectToCountry(suggestion.country_name || suggestion);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-600 text-white border-b border-gray-600 last:border-b-0"
                  >
                    {suggestion.country_name || suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    {/* Time Period */}
    <div className="mb-8">
      <h4 className="text-xl text-gray-400 mb-4">Between...</h4>
      <div className="flex items-end gap-6 max-w-md">
        <div className="flex-1">
          <select value={startYear} onChange={(e) => setStartYear(e.target.value)} className="w-full bg-transparent text-white text-lg focus:outline-none border-b-2 border-gray-600 focus:border-blue-500 transition-colors py-3 appearance-none">
            {Array.from({length: 15}, (_, i) => 2024 - i).map(year => (
              <option key={year} value={year} className="bg-gray-700">{year}</option>
            ))}
          </select>
        </div>
        <div className="text-gray-400 text-lg pb-3">and</div>
        <div className="flex-1">
          <select value={endYear} onChange={(e) => setEndYear(e.target.value)} className="w-full bg-transparent text-white text-lg focus:outline-none border-b-2 border-gray-600 focus:border-blue-500 transition-colors py-3 appearance-none">
            {Array.from({length: 15}, (_, i) => 2024 - i).map(year => (
              <option key={year} value={year} className="bg-gray-700">{year}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
    {/* Search Button */}
    <div>
      <button onClick={handleNewQuery} disabled={selectedProducts.length === 0} className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-medium text-lg transition-colors flex items-center gap-3">
        <Search className="w-5 h-5" />
        Search
      </button>
    </div>
  </div>
);

export default SearchPanel;
