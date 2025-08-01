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
  const isBaci = dataset === 'baci';
  const isProdcom = dataset === 'prodcom';
  
  // Generate headers dynamically based on actual data
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
    } else if (isBaci && tradeData.length > 0) {
      // Generate headers dynamically from the first data row
      const sampleRow = tradeData[0];
      const dynamicHeaders = [];
      
      // Define preferred order and formatting for known fields
      const fieldConfig = {
        product_code: { label: 'Product Code', align: 'left' },
        product: { label: 'Product', align: 'left' },
        year: { label: 'Year', align: 'left' },
        exporter_name: { label: 'Exporter', align: 'left' },
        exporter_id: { label: 'Exporter ID', align: 'left' },
        importer_name: { label: 'Importer', align: 'left' },
        importer_id: { label: 'Importer ID', align: 'left' },
        trade_flow: { label: 'Flow', align: 'left' },
        value: { label: 'Value (USD)', align: 'right' },
        quantity: { label: 'Quantity', align: 'right' },
        unit: { label: 'Unit', align: 'left' }
      };
      
      // Add headers for fields that exist in the data
      Object.keys(sampleRow).forEach(field => {
        if (fieldConfig[field]) {
          dynamicHeaders.push({
            field,
            label: fieldConfig[field].label,
            align: fieldConfig[field].align
          });
        } else {
          // For unknown fields, create a default header
          dynamicHeaders.push({
            field,
            label: field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            align: 'left'
          });
        }
      });
      
      return dynamicHeaders;
    } else {
      // Fallback BACI headers
      return [
        { field: 'product_code', label: 'Code', align: 'left' },
        { field: 'product', label: 'Product', align: 'left' },
        { field: 'year', label: 'Year', align: 'left' },
        { field: 'exporter_name', label: 'Exporter', align: 'left' },
        { field: 'importer_name', label: 'Importer', align: 'left' },
        { field: 'value', label: 'Value (USD)', align: 'right' },
        { field: 'quantity', label: 'Quantity', align: 'right' }
      ];
    }
  };
    } else {
      // BACI headers
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
                  // PRODCOM row structure
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
                  // BACI row structure  
                  <>
                    <td className="py-2 px-3 text-blue-400 font-mono text-xs">{row.product_code}</td>
                    <td className="py-2 px-3 text-white max-w-xs truncate text-sm" title={row.product}>{row.product}</td>
                    <td className="py-2 px-3 text-gray-300">{row.year}</td>
                    <td className="py-2 px-3 text-gray-300">{row.partner}</td>
                    <td className="py-2 px-3 text-gray-300 text-xs">{row.trade_flow}</td>
                    <td className="py-2 px-3 text-right text-green-400 font-mono text-sm">${(row.value / 1000).toFixed(0)}k</td>
                    <td className="py-2 px-3 text-right text-gray-300 font-mono text-xs">
                      {/* BACI quantities are already in metric tons, show with proper unit */}
                      {(row.quantity).toFixed(0)} {row.unit}
                    </td>
                  </>
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
