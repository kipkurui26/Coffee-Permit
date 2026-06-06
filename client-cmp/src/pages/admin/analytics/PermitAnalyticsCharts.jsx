import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from 'recharts';
import axiosInstance from '../../../utils/AxiosInstance';

const statusColors = {
  cumulative_approved: '#4ade80', // green
  cumulative_rejected: '#f87171', // red
};

const statusLabels = {
  cumulative_approved: 'Approved',
  cumulative_rejected: 'Rejected',
};

const Spinner = () => (
  <div className="flex justify-center items-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-600"></div>
    <span className="ml-2 text-amber-700">Loading...</span>
  </div>
);

const PermitAnalyticsCharts = ({ selectedSociety, selectedFactory, dateRange, xTickFormatter }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCumulativeData = async () => {
      setLoading(true);
      try {
        const params = {
          society: selectedSociety || undefined,
          factory: selectedFactory || undefined,
          start_date: dateRange?.start || undefined,
          end_date: dateRange?.end || undefined,
        };
        Object.keys(params).forEach(key => {
          if (!params[key]) delete params[key];
        });
        const response = await axiosInstance.get('permits/permits/permits-cumulative-status/', { params });
        setData(response.data);
      } catch (err) {
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCumulativeData();
  }, [selectedSociety, selectedFactory, dateRange]);

  return (
    <div className="bg-white rounded-lg shadow p-2 sm:p-4 mb-8 overflow-x-auto">
      <h3 className="font-semibold mb-2 text-base sm:text-lg">Cumulative Approved & Rejected Permits Over Time</h3>
      {loading ? (
        <Spinner />
      ) : Array.isArray(data) && data.length > 0 ? (
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={xTickFormatter}
              label={{
                value: 'Timeline',
                position: 'insideBottom',
                offset: -25,
                style: { textAnchor: 'middle', fontWeight: 600, fill: '#374151' }
              }}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              type="number"
              label={{
                value: 'Total Permits',
                angle: -90,
                position: 'insideLeft',
                offset: 0,
                style: { textAnchor: 'middle', fontWeight: 600, fill: '#374151' }
              }}
              tick={{ fontSize: 12 }}
              allowDecimals={false}
            />
            <Tooltip />
            <Legend verticalAlign="top" height={36} />
            {['cumulative_approved', 'cumulative_rejected'].map((key) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                name={statusLabels[key]}
                stroke={statusColors[key]}
                fill={statusColors[key]}
                fillOpacity={0.3}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="text-gray-500 text-center py-8">No data available for current filters.</div>
      )}
    </div>
  );
};

export default PermitAnalyticsCharts;