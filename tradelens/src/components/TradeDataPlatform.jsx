import { useState, useEffect, useRef } from 'react';
import { Search, TrendingUp, TrendingDown, Globe, Package, BarChart3, PieChart, LineChart, DollarSign } from 'lucide-react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, AreaChart, Area } from 'recharts';

// 1. Define API base URL
// const API_BASE = "http://ec2-13-50-241-167.eu-north-1.compute.amazonaws.com:8000";
const API_BASE = "http://0.0.0.0:8000"; // Open a local end base


const TradeDataPlatform = () => {
  const [queries, setQueries] = useState([]);
  const [activeQueryId, setActiveQueryId] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);
  const [fromCountry, setFromCountry] = useState('Everywhere');
  const [fromCountrySearch, setFromCountrySearch] = useState('');
  const [showFromCountrySuggestions, setShowFromCountrySuggestions] = useState(false);
  const [toCountry, setToCountry] = useState('United Kingdom');
  const [toCountrySearch, setToCountrySearch] = useState('');
  const [showToCountrySuggestions, setShowToCountrySuggestions] = useState(false);
  const [startYear, setStartYear] = useState('2020');
  const [endYear, setEndYear] = useState('2024');
  const [tradeType, setTradeType] = useState('Trade: Imports');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedYear, setSelectedYear] = useState('2024');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10); // allow changing if needed

  // Auto-collapse on narrow screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) { // lg breakpoint
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Trade type options
  const tradeTypeOptions = [
    'Trade: All',
    'Trade: Exports',
    'Trade: Imports'
  ];

  // API-backed suggestions
  const [productSuggestions, setProductSuggestions] = useState([]);
  const [countrySuggestions, setCountrySuggestions] = useState([]);
  const [productLoading, setProductLoading] = useState(false);
  const [countryLoading, setCountryLoading] = useState(false);

  // Trade data from API
  const [tradeData, setTradeData] = useState([]);
  const [tradeDataTotal, setTradeDataTotal] = useState(0);
  const [tradeDataTotalPages, setTradeDataTotalPages] = useState(1);
  const [tradeDataLoading, setTradeDataLoading] = useState(false);

  // 2. Fetch product suggestions from API
  useEffect(() => {
    if (!productSearch) {
      setProductSuggestions([]);
      return;
    }
    setProductLoading(true);
    fetch(`${API_BASE}/api/products/?search=${encodeURIComponent(productSearch)}&limit=8`)

      .then(res => res.json())
      .then(data => setProductSuggestions(data))
      .catch(() => setProductSuggestions([]))
      .finally(() => setProductLoading(false));
  }, [productSearch]);

  // // 3. Fetch country suggestions from API
  useEffect(() => {
    if (!fromCountrySearch && !showFromCountrySuggestions && !toCountrySearch && !showToCountrySuggestions) {
      setCountrySuggestions([]);
      return;
    }
    const search = fromCountrySearch || toCountrySearch || '';
    setCountryLoading(true);
    fetch(`${API_BASE}/api/countries/?search=${encodeURIComponent(search)}&limit=10`)

      .then(res => res.json())
      .then(data => setCountrySuggestions(data))
      .catch(() => setCountrySuggestions([]))
      .finally(() => setCountryLoading(false));
  }, [fromCountrySearch, showFromCountrySuggestions, toCountrySearch, showToCountrySuggestions]);

  // 4. Fetch trade data from API when query is active - !!! Trade API here?
  useEffect(() => {
    // If no active query - set default values
    if (!activeQueryId) {
      setTradeData([]);
      setTradeDataTotal(0);
      setTradeDataTotalPages(1);
      return;
    }
    // Search for active queries
    const query = queries.find(q => q.id === activeQueryId);
    if (!query) return;

    setTradeDataLoading(true);

    //// Map UI values to API params
    const trade_type = query.tradeType.toLowerCase().replace('trade: ', '');
    const product_codes = query.products.map(p => p.code).join(',');

    // Use code for from_country and to_country if possible
    let from_country = query.fromCountry === 'Everywhere' ? 'everywhere'
      : query.fromCountry === 'World' ? 'world'
      : getCountryCodeByName(query.fromCountry);

    let to_country = query.toCountry === 'Everywhere' ? 'everywhere'
      : query.toCountry === 'World' ? 'world'
      : getCountryCodeByName(query.toCountry);

    const year_from = query.startYear;
    const year_to = query.endYear;
    const page = currentPage;
    const page_size = rowsPerPage;

    const params = new URLSearchParams({
      trade_type,
      product_codes,
      from_country,
      to_country,
      year_from,
      year_to,
      page,
      page_size,
    });
    // Activate query end point
    fetch(`${API_BASE}/api/trade-query/?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        console.log("Query URL:", `${API_BASE}/api/trade-query?${params.toString()}`);
        setTradeData(data.data || []);
        setTradeDataTotal(data.total_records || 0);
        setTradeDataTotalPages(data.total_pages || 1);
      })
      .catch(() => {
        setTradeData([]);
        setTradeDataTotal(0);
        setTradeDataTotalPages(1);
      })
      .finally(() => setTradeDataLoading(false));
  // eslint-disable-next-line
  }, [activeQueryId, currentPage, rowsPerPage, queries]);

  const handleProductSearch = (value) => {
    setProductSearch(value);
    setShowProductSuggestions(value.length > 0);
  };

  const handleFromCountrySearch = (value) => {
    setFromCountrySearch(value);
    setShowFromCountrySuggestions(value.length > 0);
  };

  const handleToCountrySearch = (value) => {
    setToCountrySearch(value);
    setShowToCountrySuggestions(value.length > 0);
  };

  const handleSelectProduct = (product) => {
    if (!selectedProducts.find(p => p.code === product.code)) {
      setSelectedProducts([...selectedProducts, product]);
    }
    setProductSearch('');
    setShowProductSuggestions(false);
  };

  const handleRemoveProduct = (productCode) => {
    setSelectedProducts(selectedProducts.filter(p => p.code !== productCode));
  };

  const handleSelectFromCountry = (country) => {
    setFromCountry(country);
    setFromCountrySearch('');
    setShowFromCountrySuggestions(false);
  };

  const handleSelectToCountry = (country) => {
    setToCountry(country);
    setToCountrySearch('');
    setShowToCountrySuggestions(false);
  };

  const handleNewQuery = () => {
    const newQuery = {
      id: Date.now(),
      name: `Query ${queries.length + 1}`,
      tradeType,
      products: selectedProducts,
      fromCountry,
      toCountry,
      startYear,
      endYear,
      createdAt: new Date()
    };
    setQueries([...queries, newQuery]);
    setActiveQueryId(newQuery.id);
  };

  const handleLoadQuery = (query) => {
    setActiveQueryId(query.id);
    setTradeType(query.tradeType);
    setSelectedProducts(query.products);
    setFromCountry(query.fromCountry);
    setToCountry(query.toCountry);
    setStartYear(query.startYear);
    setEndYear(query.endYear);
  };

  const handleDeleteQuery = (queryId) => {
    setQueries(queries.filter(q => q.id !== queryId));
    if (activeQueryId === queryId) {
      setActiveQueryId(null);
    }
  };

  const getQueryDisplayName = (query) => {
    const products = query.products.map(p => p.code).join(', ');
    const direction = query.tradeType.replace('Trade: ', '');
    return `${direction} of ${products || 'products'} from ${query.fromCountry} to ${query.toCountry}`;
  };

  // 7. Pagination logic (from API)
  const totalPages = tradeDataTotalPages;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, tradeDataTotal);

  // 8. Download CSV from current API data
  const downloadCSV = () => {
    if (tradeData.length === 0) return;
    const headers = ['Product Code', 'Product Name', 'Year', 'Partner', 'Trade Flow', 'Value (USD)', 'Quantity', 'Unit'];
    const csvContent = [
      headers.join(','),
      ...tradeData.map(row => [
        row.product_code,
        `"${row.product}"`,
        row.year,
        row.partner,
        row.trade_flow,
        row.value,
        row.quantity,
        row.unit
      ].join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trade-data-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredProductSuggestions = productSuggestions;
const filteredFromCountrySuggestions = countrySuggestions;
const filteredToCountrySuggestions = countrySuggestions;

// Dummy data for charts (add before return)
const tradeVolumeData = [
  { month: 'Jan', exports: 45000, imports: 38000 },
  { month: 'Feb', exports: 52000, imports: 42000 },
  { month: 'Mar', exports: 48000, imports: 45000 },
  { month: 'Apr', exports: 61000, imports: 48000 },
  { month: 'May', exports: 55000, imports: 52000 },
  { month: 'Jun', exports: 67000, imports: 58000 },
];

const topTradingPartnersData = [
  { name: 'China', value: 28, color: '#3b82f6' },
  { name: 'Canada', value: 22, color: '#10b981' },
  { name: 'Mexico', value: 18, color: '#f59e0b' },
  { name: 'Germany', value: 15, color: '#ef4444' },
  { name: 'Japan', value: 17, color: '#8b5cf6' },
];

useEffect(() => {
  fetch(`${API_BASE}/api/countries/?limit=1000`)
    .then(res => res.json())
    .then(data => {
      const map = {};
      data.forEach(c => {
        if (c.country_name && c.code) {
          map[c.country_name] = c.code;
        }
      });
      setCountryCodeMap(map);
    });
}, []);

// Helper to get country code from countrySuggestions by name
function getCountryCodeByName(name) {
  if (!name) return '';
  return countryCodeMap[name] || name;
}
const [countryCodeMap, setCountryCodeMap] = useState({});

// MAIN FRONT END DESIGN CODE
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex h-screen">
        {/* Collapsing Sidebar */}
        <div className={`${
          sidebarCollapsed 
            ? 'w-16' 
            : 'w-72'
        } bg-gray-800 border-r border-gray-700 transition-all duration-300 flex flex-col flex-shrink-0`}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-6">
              {!sidebarCollapsed && (
                <h1 className="text-lg font-bold text-white flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
                  TradeLens
                </h1>
              )}
              
              {sidebarCollapsed && (
                <div className="flex justify-center w-full">
                  <BarChart3 className="w-6 h-6 text-blue-400" />
                </div>
              )}
              
              {/* Sidebar Toggle - always available for manual control */}
              {!sidebarCollapsed && (
                <button
                  onClick={() => setSidebarCollapsed(true)}
                  className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition-colors flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}

              {sidebarCollapsed && (
                <button
                  onClick={() => setSidebarCollapsed(false)}
                  className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
            
            {/* New Query Button */}
            <button
              onClick={handleNewQuery}
              disabled={selectedProducts.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 px-4 py-3"
              title={sidebarCollapsed ? "New Query" : ""}
            >
              <Search className="w-4 h-4 flex-shrink-0" />
              {!sidebarCollapsed && <span className="text-sm">New Query</span>}
            </button>
          </div>
          
          {/* Saved Queries */}
          <div className="flex-1 overflow-y-auto px-4 pb-6">
            {!sidebarCollapsed && (
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">
                Saved Queries ({queries.length})
              </h3>
            )}
            
            {queries.length === 0 ? (
              !sidebarCollapsed && (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                    <BarChart3 className="w-6 h-6 text-gray-500" />
                  </div>
                  <p className="text-gray-500 text-sm">No queries yet</p>
                  <p className="text-gray-600 text-xs mt-1">Create your first query to get started</p>
                </div>
              )
            ) : (
              <div className="space-y-2">
                {queries.map((query) => (
                  <div
                    key={query.id}
                    className={`p-3 rounded-lg border transition-colors cursor-pointer group relative ${
                      activeQueryId === query.id
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                    }`}
                    onClick={() => handleLoadQuery(query)}
                    title={sidebarCollapsed ? getQueryDisplayName(query) : ""}
                  >
                    {sidebarCollapsed ? (
                      /* Collapsed View - Just indicator */
                      <div className="flex items-center justify-center">
                        <div className={`w-3 h-3 rounded-full ${
                          activeQueryId === query.id ? 'bg-white' : 'bg-gray-400'
                        }`}></div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {query.name}
                          </div>
                          <div className="text-xs opacity-75 mt-1 line-clamp-2 leading-tight">
                            {getQueryDisplayName(query)}
                          </div>
                          <div className="text-xs opacity-60 mt-2">
                            {query.createdAt.toLocaleDateString()}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteQuery(query.id);
                          }}
                          className="text-gray-400 hover:text-red-400 ml-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 md:p-8 overflow-auto min-w-0">
          <div className="max-w-7xl mx-auto">
            {/* Clean Search Interface */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-6">TradeLens</h2>
              
              {/* Search Panel */}
              <div className="bg-gray-800 border border-gray-600 rounded-lg p-8">
                {/* Main Question */}
                <div className="mb-8">
                  <h3 className="text-3xl font-medium text-gray-300 mb-6">What are you looking for?</h3>
                  
                  {/* Underlined Search Bar */}
                  <div className="relative">
                    <Package className="absolute left-0 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6 z-10" />
                    <div className="pl-8 pr-4 py-4 min-h-[60px] flex flex-wrap gap-3 items-center border-b-2 border-gray-600 focus-within:border-blue-500 transition-colors bg-transparent">
                      {/* Product Pills */}
                      {selectedProducts.map((product) => (
                        <div
                          key={product.code}
                          className="bg-blue-600 text-white px-3 py-1 rounded-full flex items-center gap-2 text-sm font-medium"
                        >
                          <span>{product.code}</span>
                          <button
                            onClick={() => handleRemoveProduct(product.code)}
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
                            <span className="text-sm text-gray-400 truncate">
                              {suggestion.code || suggestion.product_code}
                            </span>
                            <span className="font-medium text-lg">
                              {suggestion.name || suggestion.description}
                            </span>
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
                    <button
                      onClick={() => setTradeType('Trade: Imports')}
                      className={`px-6 py-3 rounded-full font-medium text-base transition-colors ${
                        tradeType.includes('Imports') 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Imports
                    </button>
                    <button
                      onClick={() => setTradeType('Trade: Exports')}
                      className={`px-6 py-3 rounded-full font-medium text-base transition-colors ${
                        tradeType.includes('Exports') 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      Exports
                    </button>
                    <button
                      onClick={() => setTradeType('Trade: All')}
                      className={`px-6 py-3 rounded-full font-medium text-base transition-colors ${
                        tradeType.includes('All') 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      All Trade
                    </button>
                  </div>
                </div>

                {/* From/To Countries */}
                <div className="mb-8">
                  <h4 className="text-xl text-gray-400 mb-4">In Location...</h4>
                  <div className="flex items-end gap-6">
                    {/* From Country */}
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={fromCountrySearch || fromCountry}
                        onChange={(e) => handleFromCountrySearch(e.target.value)}
                        onFocus={() => {
                          setFromCountrySearch('');
                          setShowFromCountrySuggestions(true);
                        }}
                        className="w-full bg-transparent text-white text-lg placeholder-gray-400 focus:outline-none border-b-2 border-gray-600 focus:border-blue-500 transition-colors py-3"
                        placeholder="From country..."
                      />
                      
                      {/* Country Suggestions */}
                      {showFromCountrySuggestions && (
                        <div className="absolute top-full left-0 right-0 bg-gray-700 border border-gray-600 rounded-lg mt-2 shadow-xl z-20 max-h-48 overflow-y-auto">
                          <button
                            onClick={() => handleSelectFromCountry('Everywhere')}
                            className="w-full text-left px-4 py-3 hover:bg-gray-600 text-white border-b border-gray-600 font-medium"
                          >
                            <div className="font-medium">Everywhere</div>
                            <div className="text-xs text-gray-400">Individual country records</div>
                          </button>
                          <button
                            onClick={() => handleSelectFromCountry('World')}
                            className="w-full text-left px-4 py-3 hover:bg-gray-600 text-white border-b border-gray-600 font-medium"
                          >
                            <div className="font-medium">World</div>
                            <div className="text-xs text-gray-400">Aggregated global data</div>
                          </button>
                          {filteredFromCountrySuggestions.slice(0, 6).map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => handleSelectFromCountry(suggestion.country_name || suggestion)}
                              className="w-full text-left px-4 py-3 hover:bg-gray-600 text-white border-b border-gray-600 last:border-b-0"
                            >
                              {suggestion.country_name || suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="text-gray-400 text-lg pb-3">to</div>

                    {/* To Country */}
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={toCountrySearch || toCountry}
                        onChange={(e) => handleToCountrySearch(e.target.value)}
                        onFocus={() => {
                          setToCountrySearch('');
                          setShowToCountrySuggestions(true);
                        }}
                        className="w-full bg-transparent text-white text-lg placeholder-gray-400 focus:outline-none border-b-2 border-gray-600 focus:border-blue-500 transition-colors py-3"
                        placeholder="To country..."
                      />
                      
                      {/* To Country Suggestions */}
                      {showToCountrySuggestions && (
                        <div className="absolute top-full left-0 right-0 bg-gray-700 border border-gray-600 rounded-lg mt-2 shadow-xl z-20 max-h-48 overflow-y-auto">
                          {filteredToCountrySuggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => handleSelectToCountry(suggestion.country_name || suggestion)}
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

                {/* Time Period */}
                <div className="mb-8">
                  <h4 className="text-xl text-gray-400 mb-4">Between...</h4>
                  <div className="flex items-end gap-6 max-w-md">
                    <div className="flex-1">
                      <select
                        value={startYear}
                        onChange={(e) => setStartYear(e.target.value)}
                        className="w-full bg-transparent text-white text-lg focus:outline-none border-b-2 border-gray-600 focus:border-blue-500 transition-colors py-3 appearance-none"
                      >
                        {Array.from({length: 15}, (_, i) => 2024 - i).map(year => (
                          <option key={year} value={year} className="bg-gray-700">{year}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="text-gray-400 text-lg pb-3">and</div>
                    
                    <div className="flex-1">
                      <select
                        value={endYear}
                        onChange={(e) => setEndYear(e.target.value)}
                        className="w-full bg-transparent text-white text-lg focus:outline-none border-b-2 border-gray-600 focus:border-blue-500 transition-colors py-3 appearance-none"
                      >
                        {Array.from({length: 15}, (_, i) => 2024 - i).map(year => (
                          <option key={year} value={year} className="bg-gray-700">{year}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Search Button */}
                <div>
                  <button
                    onClick={handleNewQuery}
                    disabled={selectedProducts.length === 0}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-medium text-lg transition-colors flex items-center gap-3"
                  >
                    <Search className="w-5 h-5" />
                    Search
                  </button>
                </div>
              </div>
            </div>

            {/* Results Section */}
            {activeQueryId && (
              <div className="space-y-6">
                {/* Results Header */}
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">
                        Analysis Results: {queries.find(q => q.id === activeQueryId)?.name}
                      </h3>
                      <p className="text-gray-400">
                        {getQueryDisplayName(queries.find(q => q.id === activeQueryId))} ({queries.find(q => q.id === activeQueryId)?.startYear} - {queries.find(q => q.id === activeQueryId)?.endYear})
                      </p>
                    </div>
                    <button
                      onClick={downloadCSV}
                      disabled={tradeData.length === 0}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download CSV
                    </button>
                  </div>
                </div>

                {/* Data Table Panel */}
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <h4 className="text-lg font-semibold mb-4">Trade Data ({tradeDataTotal} records)</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-600">
                          <th className="text-left py-2 px-3 font-medium text-gray-300">Code</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-300">Product</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-300">Year</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-300">Partner</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-300">Flow</th>
                          <th className="text-right py-2 px-3 font-medium text-gray-300">Value (USD)</th>
                          <th className="text-right py-2 px-3 font-medium text-gray-300">Quantity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tradeDataLoading ? (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-gray-400">Loading...</td>
                          </tr>
                        ) : tradeData.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-gray-400">No data found</td>
                          </tr>
                        ) : (
                          tradeData.map((row, idx) => (
                            <tr key={row.id || idx} className="border-b border-gray-700 hover:bg-gray-750">
                              <td className="py-2 px-3 text-blue-400 font-mono text-xs">{row.product_code}</td>
                              <td className="py-2 px-3 text-white max-w-xs truncate text-sm" title={row.product}>
                                {row.product}
                              </td>
                              <td className="py-2 px-3 text-gray-300">{row.year}</td>
                              <td className="py-2 px-3 text-gray-300">{row.partner}</td>
                              <td className="py-2 px-3 text-gray-300 text-xs">{row.trade_flow}</td>
                              <td className="py-2 px-3 text-right text-green-400 font-mono text-sm">
                                ${(row.value / 1000).toFixed(0)}k
                              </td>
                              <td className="py-2 px-3 text-right text-gray-300 font-mono text-xs">
                                {(row.quantity / 1000).toFixed(0)}k {row.unit}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
                      <div className="text-sm text-gray-400">
                        Showing {startIndex + 1}-{endIndex} of {tradeDataTotal} records
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => goToPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="px-3 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Previous
                        </button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }t
                            return (
                              <button
                                key={pageNum}
                                onClick={() => goToPage(pageNum)}
                                className={`px-3 py-1 rounded text-sm transition-colors ${
                                  currentPage === pageNum
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                        </div>
                        <button
                          onClick={() => goToPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Time Series Chart Panel */}
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <h4 className="text-lg font-semibold mb-4">Trade Volume Over Time</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsLineChart data={tradeVolumeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="exports" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        name="Exports"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="imports" 
                        stroke="#ef4444" 
                        strokeWidth={2}
                        name="Imports"
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>

                {/* Market Share Chart Panel */}
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold">Market Share by Country</h4>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="2024">2024</option>
                      <option value="2023">2023</option>
                      <option value="2022">2022</option>
                      <option value="2021">2021</option>
                      <option value="2020">2020</option>
                    </select>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={topTradingPartnersData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({name, value}) => `${name}: ${value}%`}
                      >
                        {topTradingPartnersData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }} 
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>

                {/* Geographic Map Panel */}
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <h4 className="text-lg font-semibold mb-4">Geographic Distribution</h4>
                  <div className="h-80 bg-gray-700 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Globe className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg">Interactive Map</p>
                      <p className="text-gray-500 text-sm">Coming soon - geographic visualization of trade flows</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!activeQueryId && (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-400 mb-2">
                  Create your first query
                </h3>
                <p className="text-gray-500">
                  Search for products and create queries to analyze trade data for business suspensions
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeDataPlatform;