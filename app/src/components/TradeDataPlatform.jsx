import { useState, useEffect } from 'react';
import { Search, TrendingUp, TrendingDown, Globe, Package, BarChart3, PieChart, LineChart, DollarSign } from 'lucide-react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import Sidebar from './Sidebar';
import SearchPanel from './SearchPanel';
import ResultsHeader from './ResultsHeader';
import TradeDataTable from './TradeDataTable';
import TradeVolumeChart from './TradeVolumeChart';
import MarketShareChart from './MarketShareChart';
import GeographicMapPanel from './GeographicMapPanel';
import EmptyState from './EmptyState';

// 1. Define API base URL
// const API_BASE = "http://ec2-13-50-241-167.eu-north-1.compute.amazonaws.com:8000";
// const API_BASE = "http://0.0.0.0:8000"; // Open a local end base
const API_BASE = "http://localhost:8000";

const TradeDataPlatform = () => {
  const [queries, setQueries] = useState([]);
  const [activeQueryId, setActiveQueryId] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);
  const [fromCountries, setFromCountries] = useState([]);
  const [fromCountrySearch, setFromCountrySearch] = useState('');
  const [showFromCountrySuggestions, setShowFromCountrySuggestions] = useState(false);
  const [toCountries, setToCountries] = useState([]);
  const [toCountrySearch, setToCountrySearch] = useState('');
  const [showToCountrySuggestions, setShowToCountrySuggestions] = useState(false);
  const [startYear, setStartYear] = useState('2020');
  const [endYear, setEndYear] = useState('2024');
  const [tradeType, setTradeType] = useState('Trade: Imports');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedYear, setSelectedYear] = useState('2024');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10); // allow changing if needed

  // New: Dataset selector state
  const [selectedDataset, setSelectedDataset] = useState('baci');

  // New: BACI dataset info (could be loaded from config)
  const baciInfo = {
    id: 'baci',
    name: 'BACI',
    title: 'Trade flows',
    yearRange: '2017-2022',
    description: 'Annual trade flows for HS6 products.',
    speed: 'Fast',
    speedIcon: '⚡',
  };

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

    // Use arrays for countries
    const from_country = query.fromCountries.map(c => c === 'everywhere' ? 'everywhere' : c === 'world' ? 'world' : getCountryCodeByName(c)).join(',');
    const to_country = query.toCountries.map(c => c === 'everywhere' ? 'everywhere' : c === 'world' ? 'world' : getCountryCodeByName(c)).join(',');

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

  // Update handlers for country pills
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

  const handleNewQuery = () => {
    const newQuery = {
      id: Date.now(),
      name: `Query ${queries.length + 1}`,
      tradeType,
      products: selectedProducts,
      fromCountries,
      toCountries,
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
    setFromCountries(query.fromCountries);
    setToCountries(query.toCountries);
    setStartYear(query.startYear);
    setEndYear(query.endYear);
  };

  const handleDeleteQuery = (queryId) => {
    setQueries(queries.filter(q => q.id !== queryId));
    if (activeQueryId === queryId) {
      setActiveQueryId(null);
    }
  };

  // Update getQueryDisplayName for arrays
  const getQueryDisplayName = (query) => {
    const products = query.products.map(p => p.code).join(', ');
    const direction = query.tradeType.replace('Trade: ', '');
    const from = query.fromCountries.join(', ');
    const to = query.toCountries.join(', ');
    return `${direction} of ${products || 'products'} from ${from} to ${to}`;
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

// Pagination handler
const goToPage = (page) => {
  if (page < 1 || page > totalPages) return;
  setCurrentPage(page);
};

// MAIN FRONT END DESIGN CODE
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex h-screen">
        {/* Collapsing Sidebar */}
        <Sidebar
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          queries={queries}
          activeQueryId={activeQueryId}
          handleNewQuery={handleNewQuery}
          handleLoadQuery={handleLoadQuery}
          handleDeleteQuery={handleDeleteQuery}
          getQueryDisplayName={getQueryDisplayName}
          selectedProducts={selectedProducts}
        />
        {/* Main Content */}
        <div className="flex-1 p-4 md:p-8 overflow-auto min-w-0">
          <div className="max-w-7xl mx-auto">
            {/* Clean Search Interface */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-6">TradeLens</h2>
              <SearchPanel
                selectedProducts={selectedProducts}
                productSearch={productSearch}
                handleProductSearch={handleProductSearch}
                showProductSuggestions={showProductSuggestions}
                filteredProductSuggestions={filteredProductSuggestions}
                handleSelectProduct={handleSelectProduct}
                handleRemoveProduct={handleRemoveProduct}
                tradeType={tradeType}
                setTradeType={setTradeType}
                fromCountries={fromCountries}
                fromCountrySearch={fromCountrySearch}
                handleFromCountrySearch={handleFromCountrySearch}
                showFromCountrySuggestions={showFromCountrySuggestions}
                filteredFromCountrySuggestions={filteredFromCountrySuggestions}
                handleSelectFromCountry={handleSelectFromCountry}
                handleRemoveFromCountry={handleRemoveFromCountry}
                toCountries={toCountries}
                toCountrySearch={toCountrySearch}
                handleToCountrySearch={handleToCountrySearch}
                showToCountrySuggestions={showToCountrySuggestions}
                filteredToCountrySuggestions={filteredToCountrySuggestions}
                handleSelectToCountry={handleSelectToCountry}
                handleRemoveToCountry={handleRemoveToCountry}
                setShowFromCountrySuggestions={setShowFromCountrySuggestions}
                setShowToCountrySuggestions={setShowToCountrySuggestions}
                startYear={startYear}
                setStartYear={setStartYear}
                endYear={endYear}
                setEndYear={setEndYear}
                handleNewQuery={handleNewQuery}
                selectedDataset={selectedDataset}
                setSelectedDataset={setSelectedDataset}
                baciInfo={baciInfo}
              />
            </div>
            {/* Results Section */}
            {activeQueryId && (
              <div className="space-y-6">
                <ResultsHeader
                  query={queries.find(q => q.id === activeQueryId)}
                  getQueryDisplayName={getQueryDisplayName}
                  downloadCSV={downloadCSV}
                  tradeData={tradeData}
                />
                <TradeDataTable
                  tradeData={tradeData}
                  tradeDataLoading={tradeDataLoading}
                  tradeDataTotal={tradeDataTotal}
                  startIndex={startIndex}
                  endIndex={endIndex}
                  totalPages={totalPages}
                  currentPage={currentPage}
                  goToPage={goToPage}
                  rowsPerPage={rowsPerPage}
                />
                <TradeVolumeChart tradeVolumeData={tradeVolumeData} />
                <MarketShareChart
                  topTradingPartnersData={topTradingPartnersData}
                  selectedYear={selectedYear}
                  setSelectedYear={setSelectedYear}
                />
                <GeographicMapPanel />
              </div>
            )}
            {/* Empty State */}
            {!activeQueryId && <EmptyState />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeDataPlatform;