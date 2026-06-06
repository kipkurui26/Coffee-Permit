import React from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from 'recharts';


const BarChartWidget = ({
  data = [],
  xAxisKey = '',
  yAxisKeys = [],
  colors = [],
  title = '',
  height = 350,
  barProps = {},
  xTickFormatter,
  ...props
}) => (
  <div className="bg-white rounded shadow p-2 sm:p-4 pl-0 w-full min-w-0 mb-4 overflow-x-auto">
    {title && <h3 className="font-semibold mb-2 text-base sm:text-lg">{title}</h3>}
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} {...props}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey={xAxisKey}
          tick={{ fontSize: 12 }}
          tickFormatter={xTickFormatter}
          interval="preserveStartEnd"
          minTickGap={20}
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend verticalAlign="top" height={36} />
        {yAxisKeys.map((key, idx) => (
          <Bar
            key={key}
            dataKey={key}
            fill={colors[idx % colors.length] || '#8884d8'}
            name={key}
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
            {...barProps}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export default BarChartWidget