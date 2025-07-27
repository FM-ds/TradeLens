import { ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Tooltip } from 'recharts';

const MarketShareChart = ({ topTradingPartnersData, selectedYear, setSelectedYear }) => (
  <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
    <div className="flex items-center justify-between mb-4">
      <h4 className="text-lg font-semibold">Market Share by Country</h4>
      <select
        value={selectedYear}
        onChange={(e) => setSelectedYear(e.target.value)}
        className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="2024">2024</option>
        <option value="2023">2023</option>
        <option value="2022">2022</option>
        <option value="2021">2021</option>
        <option value="2020">2020</option>
      </select>
    </div>
    <ResponsiveContainer width="100%" height={300}>
      <RechartsPieChart>
        <Pie
          data={topTradingPartnersData}
          cx="50%"
          cy="50%"
          outerRadius={100}
          dataKey="value"
          label={({name, value}) => `${name}: ${value}%`}
        >
          {topTradingPartnersData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
      </RechartsPieChart>
    </ResponsiveContainer>
  </div>
);

export default MarketShareChart;
