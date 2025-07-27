import { Globe } from 'lucide-react';

const GeographicMapPanel = () => (
  <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
    <h4 className="text-lg font-semibold mb-4">Geographic Distribution</h4>
    <div className="h-80 bg-gray-700 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <Globe className="w-16 h-16 text-gray-500 mx-auto mb-4" />
        <p className="text-gray-400 text-lg">Interactive Map</p>
        <p className="text-gray-500 text-sm">Coming soon - geographic visualization of trade flows</p>
      </div>
    </div>
  </div>
);

export default GeographicMapPanel;
