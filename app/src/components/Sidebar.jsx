import { BarChart3, Search } from 'lucide-react';

const Sidebar = ({
  sidebarCollapsed,
  setSidebarCollapsed,
  queries,
  activeQueryId,
  handleNewQuery,
  handleLoadQuery,
  handleDeleteQuery,
  getQueryDisplayName,
  selectedProducts
}) => (
  <div className={`${sidebarCollapsed ? 'w-16' : 'w-72'} bg-gray-800 border-r border-gray-700 transition-all duration-300 flex flex-col flex-shrink-0`}>
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        {!sidebarCollapsed && (
          <h1 className="text-lg font-bold text-white flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
            TradeLens
            <span className="ml-2 px-2 py-1 text-xs font-medium bg-orange-600 text-white rounded-full">Beta</span>
          </h1>
        )}
        {sidebarCollapsed && (
          <div className="flex justify-center w-full">
            <BarChart3 className="w-6 h-6 text-blue-400" />
          </div>
        )}
        {/* Sidebar Toggle */}
        {!sidebarCollapsed ? (
          <button onClick={() => setSidebarCollapsed(true)} className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition-colors flex-shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        ) : (
          <button onClick={() => setSidebarCollapsed(false)} className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
      {/* New Query Button */}
      <button
        onClick={handleNewQuery}
        disabled={selectedProducts.length === 0}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 px-4 py-3"
        title={sidebarCollapsed ? "New Query" : ""}
      >
        <Search className="w-4 h-4 flex-shrink-0" />
        {!sidebarCollapsed && <span className="text-sm">New Query</span>}
      </button>
    </div>
    {/* Saved Queries */}
    <div className="flex-1 overflow-y-auto px-4 pb-6">
      {!sidebarCollapsed && (
        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">
          Saved Queries ({queries.length})
        </h3>
      )}
      {queries.length === 0 ? (
        !sidebarCollapsed && (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <BarChart3 className="w-6 h-6 text-gray-500" />
            </div>
            <p className="text-gray-500 text-sm">No queries yet</p>
            <p className="text-gray-600 text-xs mt-1">Create your first query to get started</p>
          </div>
        )
      ) : (
        <div className="space-y-2">
          {queries.map((query) => (
            <div
              key={query.id}
              className={`p-3 rounded-lg border transition-colors cursor-pointer group relative ${activeQueryId === query.id ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'}`}
              onClick={() => handleLoadQuery(query)}
              title={sidebarCollapsed ? getQueryDisplayName(query) : ""}
            >
              {sidebarCollapsed ? (
                <div className="flex items-center justify-center">
                  <div className={`w-3 h-3 rounded-full ${activeQueryId === query.id ? 'bg-white' : 'bg-gray-400'}`}></div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{query.name}</div>
                    <div className="text-xs opacity-75 mt-1 line-clamp-2 leading-tight">{getQueryDisplayName(query)}</div>
                    <div className="text-xs opacity-60 mt-2">{query.createdAt.toLocaleDateString()}</div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteQuery(query.id); }}
                    className="text-gray-400 hover:text-red-400 ml-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

export default Sidebar;
