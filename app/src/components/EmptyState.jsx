import { Search } from 'lucide-react';

const EmptyState = () => (
  <div className="text-center py-16">
    <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
      <Search className="w-8 h-8 text-gray-500" />
    </div>
    <h3 className="text-xl font-semibold text-gray-400 mb-2">Create your first query</h3>
    <p className="text-gray-500">Search for products and create queries to analyse trade data.</p>
  </div>
);

export default EmptyState;
