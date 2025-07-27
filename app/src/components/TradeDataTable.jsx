const TradeDataTable = ({
  tradeData,
  tradeDataLoading,
  tradeDataTotal,
  startIndex,
  endIndex,
  totalPages,
  currentPage,
  goToPage,
  rowsPerPage
}) => (
  <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
    <h4 className="text-lg font-semibold mb-4">Trade Data ({tradeDataTotal} records)</h4>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-600">
            <th className="text-left py-2 px-3 font-medium text-gray-300">Code</th>
            <th className="text-left py-2 px-3 font-medium text-gray-300">Product</th>
            <th className="text-left py-2 px-3 font-medium text-gray-300">Year</th>
            <th className="text-left py-2 px-3 font-medium text-gray-300">Partner</th>
            <th className="text-left py-2 px-3 font-medium text-gray-300">Flow</th>
            <th className="text-right py-2 px-3 font-medium text-gray-300">Value (USD)</th>
            <th className="text-right py-2 px-3 font-medium text-gray-300">Quantity</th>
          </tr>
        </thead>
        <tbody>
          {tradeDataLoading ? (
            <tr>
              <td colSpan={7} className="py-8 text-center text-gray-400">Loading...</td>
            </tr>
          ) : tradeData.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-8 text-center text-gray-400">No data found</td>
            </tr>
          ) : (
            tradeData.map((row, idx) => (
              <tr key={row.id || idx} className="border-b border-gray-700 hover:bg-gray-750">
                <td className="py-2 px-3 text-blue-400 font-mono text-xs">{row.product_code}</td>
                <td className="py-2 px-3 text-white max-w-xs truncate text-sm" title={row.product}>{row.product}</td>
                <td className="py-2 px-3 text-gray-300">{row.year}</td>
                <td className="py-2 px-3 text-gray-300">{row.partner}</td>
                <td className="py-2 px-3 text-gray-300 text-xs">{row.trade_flow}</td>
                <td className="py-2 px-3 text-right text-green-400 font-mono text-sm">${(row.value / 1000).toFixed(0)}k</td>
                <td className="py-2 px-3 text-right text-gray-300 font-mono text-xs">{(row.quantity / 1000).toFixed(0)}k {row.unit}</td>
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

export default TradeDataTable;
