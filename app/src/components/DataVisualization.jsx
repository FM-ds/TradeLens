import { useState, useMemo } from 'react';
import { VegaLite } from 'react-vega';
import { 
  CHART_TYPES, 
  getChartConfig, 
  createChartSpecWithAPI, 
  formatValue 
} from '../config/chartConfig';
import useDatasetConfig from '../hooks/useDatasetConfig';
import useDatasetApi from '../hooks/useDatasetApi';

const DataVisualization = ({ 
  data = [], 
  dataset = 'baci', 
  query = null,
  apiUrl = null
}) => {
  const chartConfig = getChartConfig(dataset);
  const { config } = useDatasetConfig(dataset);
  const api = useDatasetApi(config);
  
  // For BACI, adjust groupBy options based on trade direction
  const getAvailableGroupByFields = () => {
    if (dataset === 'baci' && query?.tradeType) {
      const baseFields = [...chartConfig.groupByFields];
      
      // Since API returns codes, we'll show codes for now
      // TODO: Later can add lookup functionality to show names
      return baseFields;
    }
    return chartConfig.groupByFields;
  };

  const availableGroupByFields = getAvailableGroupByFields();
  
  // Chart controls state
  const [selectedChartType, setSelectedChartType] = useState(CHART_TYPES.LINE);
  const [selectedMetric, setSelectedMetric] = useState(chartConfig.defaultMetric);
  const [selectedGroupBy, setSelectedGroupBy] = useState(chartConfig.defaultGroupBy);

  // Build API URL for direct data fetching
  const chartApiUrl = useMemo(() => {
    console.log('DataVisualization: Received apiUrl:', apiUrl);
    if (!apiUrl) return null;
    
    // Use the stored working API URL and just add a large page size for comprehensive data
    const url = new URL(apiUrl);
    url.searchParams.set('page', '1');
    url.searchParams.set('page_size', '1000');
    
    const finalUrl = url.toString();
    console.log('DataVisualization: Using stored API URL:', finalUrl);
    return finalUrl;
  }, [apiUrl]);

  // Create Vega-Lite specification with API data source
  const vegaSpec = useMemo(() => {
    if (!chartApiUrl) {
      console.log('DataVisualization: No API URL available');
      return null;
    }

    console.log('DataVisualization: Using API URL:', chartApiUrl);
    console.log('DataVisualization: Selected metric:', selectedMetric);
    console.log('DataVisualization: Selected groupBy:', selectedGroupBy);
    
    const spec = createChartSpecWithAPI(selectedChartType, chartApiUrl, chartConfig, selectedMetric, selectedGroupBy, availableGroupByFields);
    console.log('DataVisualization: Generated Vega spec:', spec);
    
    return spec;
  }, [chartApiUrl, selectedChartType, chartConfig, selectedMetric, selectedGroupBy, availableGroupByFields]);

  // Get metric info for display
  const metricInfo = chartConfig.availableMetrics.find(m => m.value === selectedMetric);
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
              {chartConfig.availableMetrics.map((metric) => (
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