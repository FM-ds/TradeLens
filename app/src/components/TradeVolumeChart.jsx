import { ResponsiveContainer, LineChart as RechartsLineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';

const TradeVolumeChart = ({ tradeVolumeData }) => (
  <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
    <h4 className="text-lg font-semibold mb-4">Trade Volume Over Time</h4>
    <ResponsiveContainer width="100%" height={300}>
      <RechartsLineChart data={tradeVolumeData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey="month" stroke="#9ca3af" />
        <YAxis stroke="#9ca3af" />
        <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
        <Line type="monotone" dataKey="exports" stroke="#3b82f6" strokeWidth={2} name="Exports" />
        <Line type="monotone" dataKey="imports" stroke="#ef4444" strokeWidth={2} name="Imports" />
      </RechartsLineChart>
    </ResponsiveContainer>
  </div>
);

export default TradeVolumeChart;
