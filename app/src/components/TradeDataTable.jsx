const TradeDataTable = ({
  tradeData,
  tradeDataLoading,
  tradeDataTotal,
  startIndex,
  endIndex,
  totalPages,
  currentPage,
  goToPage,
  rowsPerPage,
  dataset = 'baci' // Add dataset prop to determine table structure
}) => {
  // Determine table structure based on dataset
  const isProdcom = dataset === 'prodcom';
  
  // Define headers and column count based on dataset
  const getHeaders = () => {
    if (isProdcom) {
      return [
        { label: 'Code', align: 'left' },
        { label: 'Description', align: 'left' },
        { label: 'Type', align: 'left' },
        { label: 'Year', align: 'left' },
        { label: 'Measure', align: 'left' },
        { label: 'Value', align: 'right' },
        { label: 'Unit', align: 'left' },
        { label: 'Flag', align: 'left' }
      ];
    } else if (dataset === 'baci' && tradeData.length > 0) {
      // Dynamic BACI headers based on the actual data structure
      const sampleRow = tradeData[0];
      const columnKeys = Object.keys(sampleRow);
      
      // Create headers from the actual data keys with proper formatting
      return columnKeys.map(key => {
        const label = key
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        // Right-align numeric columns
        const isNumeric = ['value', 'quantity', 'product_code', 'exporter_id', 'importer_id', 'year'].includes(key);
        
        return {
          label,
          key,
          align: isNumeric ? 'right' : 'left'
        };
      });
    } else {
      // Fallback BACI headers (old structure)
      return [
        { label: 'Code', align: 'left' },
        { label: 'Product', align: 'left' },
        { label: 'Year', align: 'left' },
        { label: 'Partner', align: 'left' },
        { label: 'Flow', align: 'left' },
        { label: 'Value (USD)', align: 'right' },
        { label: 'Quantity', align: 'right' }
      ];
    }
  };

  const headers = getHeaders();
  const colCount = headers.length;
  const dataTitle = isProdcom ? 'PRODCOM Data' : 'Trade Data';

  return (
  <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
    <h4 className="text-lg font-semibold mb-4">{dataTitle} ({tradeDataTotal} records)</h4>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-600">
            {headers.map((header, idx) => (
              <th key={idx} className={`py-2 px-3 font-medium text-gray-300 ${header.align === 'right' ? 'text-right' : 'text-left'}`}>
                {header.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tradeDataLoading ? (
            <tr>
              <td colSpan={colCount} className="py-8 text-center text-gray-400">Loading...</td>
            </tr>
          ) : tradeData.length === 0 ? (
            <tr>
              <td colSpan={colCount} className="py-8 text-center text-gray-400">No data found</td>
            </tr>
          ) : (
            tradeData.map((row, idx) => (
              <tr key={row.id || idx} className="border-b border-gray-700 hover:bg-gray-750">
                {isProdcom ? (
                  // PRODCOM row structure (legacy)
                  <>
                    <td className="py-2 px-3 text-purple-400 font-mono text-xs">{row.code}</td>
                    <td className="py-2 px-3 text-white max-w-xs truncate text-sm" title={row.description}>{row.description}</td>
                    <td className="py-2 px-3 text-gray-300 text-xs">{row.type || 'N/A'}</td>
                    <td className="py-2 px-3 text-gray-300">{row.year}</td>
                    <td className="py-2 px-3 text-gray-300 text-xs">{row.measure}</td>
                    <td className="py-2 px-3 text-right text-green-400 font-mono text-sm">
                      {row.measure === 'Value' ? `£${(row.value / 1000).toFixed(0)}k` : 
                       row.measure === 'Volume' ? `${(row.value / 1000).toFixed(0)}k` :
                       `£${row.value.toFixed(2)}`}
                    </td>
                    <td className="py-2 px-3 text-gray-300 text-xs">
                      {/* Remove 'k' suffix from PRODCOM units */}
                      {row.unit?.replace(/k$/, '') || ''}
                    </td>
                    <td className="py-2 px-3 text-gray-400 text-xs">{row.flag || ''}</td>
                  </>
                ) : (
                  // Dynamic BACI row structure - render all columns
                  headers.map((header, cellIdx) => {
                    const key = header.key || header.label.toLowerCase().replace(/ /g, '_');
                    const value = row[key];
                    
                    // Format values based on column type
                    const formatValue = (val, columnKey) => {
                      if (val === null || val === undefined) return '';
                      
                      if (columnKey === 'value') {
                        return `$${(val / 1000).toFixed(0)}k`;
                      } else if (columnKey === 'quantity') {
                        return `${val.toFixed(0)} ${row.unit || 'kg'}`;
                      } else if (columnKey === 'product_code') {
                        return val;
                      } else {
                        return String(val);
                      }
                    };
                    
                    // Determine cell styling based on content
                    const getCellStyle = (columnKey) => {
                      if (columnKey === 'product_code') {
                        return 'text-blue-400 font-mono text-xs';
                      } else if (columnKey === 'value') {
                        return 'text-green-400 font-mono text-sm';
                      } else if (columnKey === 'quantity') {
                        return 'text-gray-300 font-mono text-xs';
                      } else if (columnKey === 'product') {
                        return 'text-white max-w-xs truncate text-sm';
                      } else if (columnKey.includes('name')) {
                        return 'text-white text-sm';
                      } else {
                        return 'text-gray-300';
                      }
                    };
                    
                    return (
                      <td 
                        key={cellIdx} 
                        className={`py-2 px-3 ${getCellStyle(key)} ${header.align === 'right' ? 'text-right' : 'text-left'}`}
                        title={key === 'product' ? value : undefined}
                      >
                        {formatValue(value, key)}
                      </td>
                    );
                  })
                )}
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
          <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Previous</button>
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
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => goToPage(pageNum)}
                  className={`px-3 py-1 rounded text-sm transition-colors ${currentPage === pageNum ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Next</button>
        </div>
      </div>
    )}
  </div>
  );
};

export default TradeDataTable;
