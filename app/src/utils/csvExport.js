/**
 * Universal CSV export utility for different dataset types
 */

// Dataset configurations for CSV export
const datasetConfigs = {
  baci: {
    headers: ['Product Code', 'Product Name', 'Year', 'Partner', 'Trade Flow', 'Value (USD)', 'Quantity', 'Unit'],
    fields: ['product_code', 'product', 'year', 'partner', 'trade_flow', 'value', 'quantity', 'unit'],
    filename: 'trade-data'
  },
  prodcom: {
    headers: ['Code', 'Description', 'Type', 'Year', 'Measure', 'Value', 'Unit', 'Flag'],
    fields: ['code', 'description', 'type', 'year', 'measure', 'value', 'unit', 'flag'],
    filename: 'prodcom-data'
  }
  // Add more dataset configurations as needed
};

/**
 * Safely extract and escape field values for CSV
 * @param {Object} row - Data row object
 * @param {string} field - Field name to extract
 * @returns {string} - Escaped field value
 */
const getFieldValue = (row, field) => {
  const value = row[field];
  if (value === null || value === undefined) return '';
  
  // For string fields that might contain commas, quotes, or newlines, wrap in quotes and escape internal quotes
  if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  
  return String(value);
};

/**
 * Generate CSV content from data array
 * @param {Array} data - Array of data objects
 * @param {string} dataset - Dataset type (baci, prodcom, etc.)
 * @returns {string} - CSV content string
 */
export const generateCSVContent = (data, dataset = 'baci') => {
  if (!data || data.length === 0) return '';
  
  const config = datasetConfigs[dataset] || datasetConfigs.baci;
  
  const csvContent = [
    config.headers.join(','),
    ...data.map(row => 
      config.fields.map(field => getFieldValue(row, field)).join(',')
    )
  ].join('\n');
  
  return csvContent;
};

/**
 * Download CSV file from data array
 * @param {Array} data - Array of data objects
 * @param {string} dataset - Dataset type (baci, prodcom, etc.)
 * @param {string} customFilename - Optional custom filename (without extension)
 */
export const downloadCSV = (data, dataset = 'baci', customFilename = null) => {
  if (!data || data.length === 0) {
    console.warn('No data available for CSV export');
    return;
  }
  
  const config = datasetConfigs[dataset] || datasetConfigs.baci;
  const csvContent = generateCSVContent(data, dataset);
  
  // Create and download the file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${customFilename || config.filename}-${Date.now()}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};

/**
 * Add a new dataset configuration
 * @param {string} datasetId - Dataset identifier
 * @param {Object} config - Dataset configuration object
 */
export const addDatasetConfig = (datasetId, config) => {
  datasetConfigs[datasetId] = config;
};

/**
 * Get available dataset configurations
 * @returns {Object} - All available dataset configurations
 */
export const getDatasetConfigs = () => {
  return { ...datasetConfigs };
};

export default downloadCSV;
