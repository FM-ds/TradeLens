/**
 * Universal CSV export utility for different dataset types
 */

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
 * Generate CSV content from data array - dynamically determines structure
 * @param {Array} data - Array of data objects
 * @param {string} dataset - Dataset type (for filename purposes)
 * @returns {string} - CSV content string
 */
export const generateCSVContent = (data, dataset = 'baci') => {
  if (!data || data.length === 0) return '';
  
  // Get headers from the first row of actual data
  const sampleRow = data[0];
  const headers = Object.keys(sampleRow);
  
  // Create human-readable header labels
  const headerLabels = headers.map(key => {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  });
  
  const csvContent = [
    headerLabels.join(','),
    ...data.map(row => 
      headers.map(field => getFieldValue(row, field)).join(',')
    )
  ].join('\n');
  
  return csvContent;
};

/**
 * Download CSV file from data array
 * @param {Array} data - Array of data objects
 * @param {string} dataset - Dataset type (for filename purposes)
 * @param {string} customFilename - Optional custom filename (without extension)
 */
export const downloadCSV = (data, dataset = 'baci', customFilename = null) => {
  if (!data || data.length === 0) {
    console.warn('No data available for CSV export');
    return;
  }
  
  const csvContent = generateCSVContent(data, dataset);
  
  // Create filename based on dataset or custom name
  const baseFilename = customFilename || `${dataset}-data`;
  
  // Create and download the file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${baseFilename}-${Date.now()}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};

/**
 * Add a new dataset configuration (legacy function - kept for compatibility)
 * @param {string} datasetId - Dataset identifier
 * @param {Object} config - Dataset configuration object
 */
export const addDatasetConfig = (datasetId, config) => {
  console.warn('addDatasetConfig is deprecated - CSV export now works dynamically with any data structure');
};

/**
 * Get available dataset configurations (legacy function - kept for compatibility)
 * @returns {Object} - Empty object as configs are now dynamic
 */
export const getDatasetConfigs = () => {
  console.warn('getDatasetConfigs is deprecated - CSV export now works dynamically with any data structure');
  return {};
};

export default downloadCSV;
