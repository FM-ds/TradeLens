import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import DatasetSelector from './DatasetSelector';
import DatasetSearchInterface from './DatasetSearchInterface';
import ResultsHeader from './ResultsHeader';
import TradeDataTable from './TradeDataTable';
import TradeVolumeChart from './TradeVolumeChart';
import MarketShareChart from './MarketShareChart';
import GeographicMapPanel from './GeographicMapPanel';
import EmptyState from './EmptyState';
import useTradeQuery from '../hooks/useTradeQuery';
import { downloadCSV as exportCSV } from '../utils/csvExport';

const TradeDataPlatform = () => {
  const [queries, setQueries] = useState([]);
  const [activeQueryId, setActiveQueryId] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedYear, setSelectedYear] = useState('2024');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Dataset management
  const [selectedDataset, setSelectedDataset] = useState('baci');
  const availableDatasets = ['baci', 'prodcom']; // Add more datasets here as they become available

  // Active query and trade data
  const activeQuery = queries.find(q => q.id === activeQueryId);
  const { tradeData, tradeDataTotal, tradeDataTotalPages, tradeDataLoading } = useTradeQuery(
    activeQuery,
    currentPage,
    rowsPerPage
  );

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

  // Query management
  const handleQueryCreated = (newQuery) => {
    setQueries([...queries, newQuery]);
    setActiveQueryId(newQuery.id);
    setCurrentPage(1); // Reset pagination for new query
  };

  const handleLoadQuery = (query) => {
    setActiveQueryId(query.id);
    setCurrentPage(1); // Reset pagination when loading different query
  };

  const handleDeleteQuery = (queryId) => {
    setQueries(queries.filter(q => q.id !== queryId));
    if (activeQueryId === queryId) {
      setActiveQueryId(null);
    }
  };

  const getQueryDisplayName = (query) => {
    const products = query.products.map(p => p.code || p.product_code).join(', ');
    
    if (query.dataset === 'baci') {
      // BACI query display
      const direction = query.tradeType.replace('Trade: ', '');
      const from = query.fromCountries.join(', ') || 'Any';
      const to = query.toCountries.join(', ') || 'Any';
      return `${direction} of ${products || 'products'} from ${from} to ${to}`;
    } else if (query.dataset === 'prodcom') {
      // PRODCOM query display
      const measure = query.measureType || 'Value';
      const productType = query.productTypeFilter || 'Product';
      return `${measure} for ${products || 'products'} (${productType} level)`;
    } else {
      // Generic fallback
      return `Query for ${products || 'products'}`;
    }
  };

  // Pagination logic
  const totalPages = tradeDataTotalPages;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, tradeDataTotal);

  // Universal CSV download function for any dataset
  const downloadCSV = () => {
    const dataset = activeQuery?.dataset || 'baci';
    exportCSV(tradeData, dataset);
  };

  // Pagination handler
  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

// Dummy data for charts
const topTradingPartnersData = [
  { name: 'China', value: 28, color: '#3b82f6' },
  { name: 'Canada', value: 22, color: '#10b981' },
  { name: 'Mexico', value: 18, color: '#f59e0b' },
  { name: 'Germany', value: 15, color: '#ef4444' },
  { name: 'Japan', value: 17, color: '#8b5cf6' },
];

const tradeVolumeData = [
  { month: 'Jan', exports: 45000, imports: 38000 },
  { month: 'Feb', exports: 52000, imports: 42000 },
  { month: 'Mar', exports: 48000, imports: 45000 },
  { month: 'Apr', exports: 61000, imports: 48000 },
  { month: 'May', exports: 55000, imports: 52000 },
  { month: 'Jun', exports: 67000, imports: 58000 },
];

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
          handleNewQuery={() => {}} // Disabled in new approach
          handleLoadQuery={handleLoadQuery}
          handleDeleteQuery={handleDeleteQuery}
          getQueryDisplayName={getQueryDisplayName}
          selectedProducts={[]} // Not used in new approach
        />
        {/* Main Content */}
        <div className="flex-1 p-4 md:p-8 overflow-auto min-w-0">
          <div className="max-w-7xl mx-auto">
            {/* Clean Search Interface */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-6">TradeLens</h2>
              
              {/* Dataset Selector */}
              <DatasetSelector
                availableDatasets={availableDatasets}
                selectedDataset={selectedDataset}
                onDatasetChange={setSelectedDataset}
              />
              
              {/* Dataset-specific Search Interface */}
              <DatasetSearchInterface
                selectedDataset={selectedDataset}
                onQueryCreated={handleQueryCreated}
                disabled={false}
                initialState={{}}
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
                  dataset={activeQuery?.dataset || 'baci'}
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