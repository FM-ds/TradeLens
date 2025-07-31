import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import DatasetSelector from './DatasetSelector';
import DatasetSearchInterface from './DatasetSearchInterface';
import ResultsHeader from './ResultsHeader';
import TradeDataTable from './TradeDataTable';
import DataVisualization from './DataVisualization';
import GeographicMapPanel from './GeographicMapPanel';
import EmptyState from './EmptyState';
import useTradeQuery from '../hooks/useTradeQuery';
import useDatasetConfig from '../hooks/useDatasetConfig';
import useDatasetApi from '../hooks/useDatasetApi';
import { downloadCSV as exportCSV } from '../utils/csvExport';

const TradeDataPlatform = () => {
  const [queries, setQueries] = useState([]);
  const [activeQueryId, setActiveQueryId] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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

  // API hooks for CSV download
  const { config } = useDatasetConfig(activeQuery?.dataset);
  const api = useDatasetApi(config);

  // Auto-collapse on narrow screens (disabled - keep sidebar expanded by default)
  useEffect(() => {
    const handleResize = () => {
      // Commenting out auto-collapse behavior
      // if (window.innerWidth < 1024) { // lg breakpoint
      //   setSidebarCollapsed(true);
      // } else {
      //   setSidebarCollapsed(false);
      // }
    };

    // Set initial state - keep sidebar expanded
    // handleResize();

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
      const from = query.fromCountries.map(c => typeof c === 'string' ? c : c.country_name).join(', ') || 'Any';
      const to = query.toCountries.map(c => typeof c === 'string' ? c : c.country_name).join(', ') || 'Any';
      
      // Use appropriate preposition based on trade direction
      const preposition = direction.toLowerCase() === 'exports' ? 'to' : 'from';
      return `${direction} of ${products || 'products'} from ${from} ${preposition} ${to}`;
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

  // Enhanced CSV download function that fetches all data
  const downloadCSV = async () => {
    if (!activeQuery || !config || !api) {
      console.warn('No active query available for CSV export');
      return;
    }

    const dataset = activeQuery.dataset || 'baci';
    
    try {
      let queryParams;
      let result;
      const largePageSize = 5000; // Large page size to get all data

      if (dataset === 'baci') {
        // BACI query parameters
        const tradeType = activeQuery.tradeType.toLowerCase().replace('trade: ', '');
        const productCodes = activeQuery.products.map(p => p[config.product.codeField]).join(',');
        
        // Map countries to codes, handling special cases
        const fromCountry = activeQuery.fromCountries.map(c => {
          if (typeof c === 'string') {
            // Handle string values like "everywhere" or "world"
            if (c.toLowerCase() === 'everywhere') return 'everywhere';
            if (c.toLowerCase() === 'world') return 'world';
            // Fallback to name->code lookup for legacy data
            return api.getCountryCodeByName(c);
          }
          // Extract code from country object
          return c.code || c.country_code || 'everywhere';
        }).join(',');
        
        const toCountry = activeQuery.toCountries.map(c => {
          if (typeof c === 'string') {
            // Handle string values like "everywhere" or "world"
            if (c.toLowerCase() === 'everywhere') return 'everywhere';
            if (c.toLowerCase() === 'world') return 'world';
            // Fallback to name->code lookup for legacy data
            return api.getCountryCodeByName(c);
          }
          // Extract code from country object
          return c.code || c.country_code || 'everywhere';
        }).join(',');

        queryParams = {
          tradeType,
          productCodes,
          fromCountry,
          toCountry,
          yearFrom: activeQuery.startYear,
          yearTo: activeQuery.endYear
        };

        result = await api.executeTradeQuery(queryParams, 1, largePageSize);
      } else if (dataset === 'prodcom') {
        // PRODCOM query parameters
        const productCodes = activeQuery.products.map(p => p[config.product.codeField]).join(',');
        
        queryParams = {
          productCodes,
          yearFrom: activeQuery.startYear,
          yearTo: activeQuery.endYear,
          measure: activeQuery.measureType
        };

        result = await api.executeProdcomQuery(queryParams, 1, largePageSize);
      } else {
        throw new Error(`Unsupported dataset: ${dataset}`);
      }
      
      // Use the fetched data for CSV export
      if (result.data && result.data.length > 0) {
        exportCSV(result.data, dataset);
      } else {
        console.warn('No data available for CSV export');
      }
    } catch (error) {
      console.error('Failed to fetch data for CSV export:', error);
    }
  };

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
          handleNewQuery={() => {}} // Disabled in new approach
          handleLoadQuery={handleLoadQuery}
          handleDeleteQuery={handleDeleteQuery}
          getQueryDisplayName={getQueryDisplayName}
          selectedProducts={[]} // Not used in new approach
        />
        {/* Main Content */}
        <div className="flex-1 p-4 md:p-8 overflow-auto min-w-0" style={{ width: '100%' }}>
          <div className="max-w-7xl mx-auto" style={{ width: '100%' }}>
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
              <div className="space-y-6" style={{ width: '100%' }}>
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
                <DataVisualization
                  data={tradeData}
                  dataset={activeQuery?.dataset || 'baci'}
                  query={activeQuery}
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