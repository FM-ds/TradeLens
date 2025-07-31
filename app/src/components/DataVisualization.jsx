import { useState, useMemo } from 'react';
import { VegaLite } from 'react-vega';
import { 
  CHART_TYPES, 
  getChartConfig, 
  createChartSpecWithAPI, 
  formatValue 
} from '../config/chartConfig';
import useDatasetApi from '../hooks/useDatasetApi';

const DataVisualization = ({ 
  data = [], 
  dataset = 'baci', 
  query = null 
}) => {
  const config = getChartConfig(dataset);
  const api = useDatasetApi(config);
  
  // For BACI, adjust groupBy options based on trade direction
  const getAvailableGroupByFields = () => {
    if (dataset === 'baci' && query?.tradeType) {
      const baseFields = [...config.groupByFields];
      
      // Since API returns codes, we'll show codes for now
      // TODO: Later can add lookup functionality to show names
      return baseFields;
    }
    return config.groupByFields;
  };

  const availableGroupByFields = getAvailableGroupByFields();
  
  // Chart controls state
  const [selectedChartType, setSelectedChartType] = useState(CHART_TYPES.LINE);
  const [selectedMetric, setSelectedMetric] = useState(config.defaultMetric);
  const [selectedGroupBy, setSelectedGroupBy] = useState(config.defaultGroupBy);

  // Build API URL for direct data fetching
  const apiUrl = useMemo(() => {
    if (!query || !api) return null;

    const baseUrl = 'http://127.0.0.1:8000/api';
    
    if (dataset === 'baci') {
      const tradeType = query.tradeType.toLowerCase().replace('trade: ', '');
      const productCodes = query.products.map(p => p.code || p.product_code).join(',');
      
      // Handle country codes/names properly - convert names to codes for API
      let fromCountry = 'everywhere';
      let toCountry = 'everywhere';
      
      if (query.fromCountries && query.fromCountries.length > 0) {
        const countryCodes = query.fromCountries.map(c => {
          if (typeof c === 'string') {
            // Handle string values like "everywhere" or "world"
            if (c.toLowerCase() === 'everywhere') return 'everywhere';
            if (c.toLowerCase() === 'world') return 'world';
            // Fallback to name->code lookup for legacy data
            return api.getCountryCodeByName(c);
          }
          // Extract code from country object
          return c.code || c.country_code || 'everywhere';
        });
        fromCountry = countryCodes.join(',');
      }
      
      if (query.toCountries && query.toCountries.length > 0) {
        const countryCodes = query.toCountries.map(c => {
          if (typeof c === 'string') {
            // Handle string values like "everywhere" or "world"
            if (c.toLowerCase() === 'everywhere') return 'everywhere';
            if (c.toLowerCase() === 'world') return 'world';
            // Fallback to name->code lookup for legacy data
            return api.getCountryCodeByName(c);
          }
          // Extract code from country object
          return c.code || c.country_code || 'everywhere';
        });
        toCountry = countryCodes.join(',');
      }
      
      const params = new URLSearchParams({
        trade_type: tradeType,
        product_codes: productCodes,
        from_country: fromCountry,
        to_country: toCountry,
        year_from: query.startYear,
        year_to: query.endYear,
        page: 1,
        page_size: 1000 // Large page size to get comprehensive data
      });
      
      const url = `${baseUrl}/trade-query?${params.toString()}`;
      console.log('DataVisualization: Built API URL:', url);
      console.log('DataVisualization: Original countries:', { from: query.fromCountries, to: query.toCountries });
      console.log('DataVisualization: Mapped to codes:', { from: fromCountry, to: toCountry });
      return url;
    } else if (dataset === 'prodcom') {
      const productCodes = query.products.map(p => p.code || p.product_code).join(',');
      
      const params = new URLSearchParams({
        product_codes: productCodes,
        year_from: query.startYear,
        year_to: query.endYear,
        measure: query.measureType || 'Value',
        page: 1,
        page_size: 1000
      });
      
      const url = `${baseUrl}/prodcom-query?${params.toString()}`;
      console.log('DataVisualization: Built API URL:', url);
      return url;
    }
    
    return null;
  }, [query, dataset, api]);

  // Create Vega-Lite specification with API data source
  const vegaSpec = useMemo(() => {
    if (!apiUrl) {
      console.log('DataVisualization: No API URL available');
      return null;
    }

    console.log('DataVisualization: Using API URL:', apiUrl);
    console.log('DataVisualization: Selected metric:', selectedMetric);
    console.log('DataVisualization: Selected groupBy:', selectedGroupBy);
    
    const spec = createChartSpecWithAPI(selectedChartType, apiUrl, config, selectedMetric, selectedGroupBy, availableGroupByFields);
    console.log('DataVisualization: Generated Vega spec:', spec);
    
    return spec;
  }, [apiUrl, selectedChartType, config, selectedMetric, selectedGroupBy, availableGroupByFields]);  // Get metric info for display
  const metricInfo = config.availableMetrics.find(m => m.value === selectedMetric);
  const groupByInfo = availableGroupByFields.find(g => g.value === selectedGroupBy);

  if (!query) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h4 className="text-lg font-semibold mb-4">Data Visualization</h4>
        <div className="text-center py-8 text-gray-400">
          No query available for visualization
        </div>
      </div>
    );
  }

  if (!vegaSpec) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h4 className="text-lg font-semibold mb-4">Data Visualization</h4>
        <div className="text-center py-8 text-gray-400">
          Loading chart data...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700" style={{ width: '100%' }}>
      {/* Header with controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
        <div>
          <h4 className="text-lg font-semibold mb-1">Data Visualization</h4>
          <p className="text-sm text-gray-400">
            {metricInfo?.label} by {groupByInfo?.label} over time
          </p>
        </div>
        
        {/* Chart Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Chart Type Selector */}
          <div className="flex flex-col">
            <label className="text-xs text-gray-400 mb-1">Chart Type</label>
            <select
              value={selectedChartType}
              onChange={(e) => setSelectedChartType(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={CHART_TYPES.LINE}>Line Chart</option>
              <option value={CHART_TYPES.BAR}>Bar Chart</option>
              <option value={CHART_TYPES.AREA}>Area Chart</option>
            </select>
          </div>

          {/* Metric Selector */}
          <div className="flex flex-col">
            <label className="text-xs text-gray-400 mb-1">Y-Axis Metric</label>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {config.availableMetrics.map((metric) => (
                <option key={metric.value} value={metric.value}>
                  {metric.label}
                </option>
              ))}
            </select>
          </div>

          {/* Group By Selector */}
          <div className="flex flex-col">
            <label className="text-xs text-gray-400 mb-1">Group By</label>
            <select
              value={selectedGroupBy}
              onChange={(e) => setSelectedGroupBy(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableGroupByFields.map((field) => (
                <option key={field.value} value={field.value}>
                  {field.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Chart */}
      {vegaSpec && (
        <div className="w-full">
          <VegaLite
            spec={vegaSpec}
            actions={true}
            theme="dark"
            renderer="canvas"
          />
        </div>
      )}
    </div>
  );
};

export default DataVisualization;
