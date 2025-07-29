import { useState, useMemo } from 'react';
import { VegaLite } from 'react-vega';
import { 
  CHART_TYPES, 
  getChartConfig, 
  createChartSpec, 
  formatValue 
} from '../config/chartConfig';

const DataVisualization = ({ 
  data = [], 
  dataset = 'baci', 
  query = null 
}) => {
  const config = getChartConfig(dataset);
  
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

  // Process and transform data for charting
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      console.log('DataVisualization: No data provided');
      return [];
    }

    console.log('DataVisualization: Raw data sample:', data.slice(0, 3));
    console.log('DataVisualization: Dataset:', dataset);
    console.log('DataVisualization: Config:', config);
    console.log('DataVisualization: Available data columns:', Object.keys(data[0] || {}));

    const groupByField = availableGroupByFields.find(g => g.value === selectedGroupBy);
    if (!groupByField) {
      console.log('DataVisualization: No groupBy field found for:', selectedGroupBy);
      return [];
    }

    console.log('DataVisualization: Using groupBy field:', groupByField);
    console.log('DataVisualization: Selected metric:', selectedMetric);
    console.log('DataVisualization: Sample field values:', data.slice(0, 3).map(row => ({ 
      [groupByField.field]: row[groupByField.field],
      [selectedMetric]: row[selectedMetric],
      [config.dateField]: row[config.dateField],
      product_description: row.product_description,
      exporter_name: row.exporter_name,
      importer_name: row.importer_name
    })));

    // Group data by the selected grouping field and year
    const groupedData = data.reduce((acc, row) => {
      const year = row[config.dateField];
      const groupValue = row[groupByField.field] || `Unknown ${groupByField.label}`;
      const value = parseFloat(row[selectedMetric]) || 0;
      
      if (!year || isNaN(value)) return acc;

      const key = `${year}-${groupValue}`;
      if (!acc[key]) {
        acc[key] = {
          year: new Date(year, 0, 1), // Convert to date for temporal axis
          group: groupValue,
          value: 0,
          count: 0
        };
      }
      
      // Aggregate values (sum for totals)
      acc[key].value += value;
      acc[key].count += 1;
      
      return acc;
    }, {});

    // Convert to array and sort by year and group
    const result = Object.values(groupedData)
      .filter(d => d.value > 0) // Filter out zero values
      .sort((a, b) => {
        const yearDiff = a.year.getTime() - b.year.getTime();
        if (yearDiff !== 0) return yearDiff;
        return a.group.localeCompare(b.group);
      });

    console.log('DataVisualization: Processed chart data:', result.slice(0, 5));
    console.log('DataVisualization: Total data points:', result.length);
    
    return result;
  }, [data, selectedMetric, selectedGroupBy, availableGroupByFields]);

  // Create Vega-Lite specification
  const vegaSpec = useMemo(() => {
    if (chartData.length === 0) {
      console.log('DataVisualization: No chart data for spec creation');
      return null;
    }
    
    // Use the actual groupBy field info for spec creation
    const groupByField = availableGroupByFields.find(g => g.value === selectedGroupBy);
    const spec = createChartSpec(selectedChartType, chartData, { ...config, groupByFields: availableGroupByFields }, selectedMetric, selectedGroupBy);
    console.log('DataVisualization: Generated Vega spec:', spec);
    
    return spec;
  }, [chartData, selectedChartType, config, selectedMetric, selectedGroupBy, availableGroupByFields]);

  // Get metric info for display
  const metricInfo = config.availableMetrics.find(m => m.value === selectedMetric);
  const groupByInfo = availableGroupByFields.find(g => g.value === selectedGroupBy);

  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h4 className="text-lg font-semibold mb-4">Data Visualization</h4>
        <div className="text-center py-8 text-gray-400">
          No data available for visualization
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h4 className="text-lg font-semibold mb-4">Data Visualization</h4>
        <div className="text-center py-8 text-gray-400">
          No data points available for the selected metric and grouping
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

      {/* Data Summary - only show for non-line charts */}
      {selectedChartType !== CHART_TYPES.LINE && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-gray-400">Data Points</div>
              <div className="font-semibold text-white">{chartData.length}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">Series</div>
              <div className="font-semibold text-white">
                {new Set(chartData.map(d => d.group)).size}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">Year Range</div>
              <div className="font-semibold text-white">
                {Math.min(...chartData.map(d => d.year.getFullYear()))} - {Math.max(...chartData.map(d => d.year.getFullYear()))}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">Total Value</div>
              <div className="font-semibold text-white">
                {formatValue(
                  chartData.reduce((sum, d) => sum + d.value, 0),
                  metricInfo?.format || 'number'
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataVisualization;
