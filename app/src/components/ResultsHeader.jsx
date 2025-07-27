const ResultsHeader = ({ query, getQueryDisplayName, downloadCSV, tradeData }) => (
  <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-xl font-semibold mb-2">
          Analysis Results: {query?.name}
        </h3>
        <p className="text-gray-400">
          {getQueryDisplayName(query)} ({query?.startYear} - {query?.endYear})
        </p>
      </div>
      <button
        onClick={downloadCSV}
        disabled={tradeData.length === 0}
        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Download CSV
      </button>
    </div>
  </div>
);

export default ResultsHeader;
