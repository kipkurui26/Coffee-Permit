import React from "react";
import {
  BarChart,
  Bar,
  Rectangle,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const TopPerformersChart = ({
  data = [],
  valueKey = 'value',
  nameKey = 'name',
  barColor = '#8884d8',
  title = '',
  xAxisLabel = '',
  yAxisLabel = ''
}) => {
  // Ensure all values are integers
  const processedData = Array.isArray(data)
    ? data.map(item => ({
        ...item,
        [valueKey]: parseInt(item[valueKey], 10) || 0,
        [nameKey]: item[nameKey],
      }))
    : [];

  // Responsive left margin for BarChart
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const chartMargin = {
    top: 5,
    right: 20,
    left: isMobile ? 4 : 20,
    bottom: 40,
  };
  return (
    <div style={{ width: "100%" }} className="overflow-x-auto p-2 sm:p-4 pl-0 w-full min-w-0">
      {title && <h3 className="mb-2 font-semibold text-base sm:text-lg text-center">{title}</h3>}
      <ResponsiveContainer width="100%" height={Math.max(60 * processedData.length, 200)}>
        <BarChart
          layout="vertical"
          data={processedData}
          margin={chartMargin}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            allowDecimals={false}
            label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -8 } : undefined}
          />
          <YAxis
            dataKey={nameKey}
            type="category"
            width={80}
            label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
          />
          <Tooltip />
          <Bar
            dataKey={valueKey}
            fill={barColor}
            activeBar={<Rectangle fill="pink" stroke="blue" />}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TopPerformersChart;
