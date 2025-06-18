
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TimeSeriesDataItem } from '../../types';
import { LIGHT_CHART_COLORS, DARK_CHART_COLORS } from '../../constants';
import { useTheme } from '../../context/ThemeContext';

interface LeadsOverTimeChartProps {
  data: TimeSeriesDataItem[];
}

const CustomTooltip: React.FC<any> = ({ active, payload, label, chartColors }) => {
  if (active && payload && payload.length) {
    return (
      <div 
        className="backdrop-blur-md p-3 rounded-md shadow-lg"
        style={{ backgroundColor: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}` }}
      >
        <p className="text-xs mb-1" style={{color: chartColors.secondaryText}}>{`Date: ${new Date(label).toLocaleDateString('en-CA')}`}</p>
        <p className="text-sm font-semibold" style={{ color: chartColors.blue }}>{`Leads: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

const LeadsOverTimeChart: React.FC<LeadsOverTimeChartProps> = React.memo(({ data }) => {
  const { theme } = useTheme();
  const chartColors = theme === 'dark' ? DARK_CHART_COLORS : LIGHT_CHART_COLORS;

  return (
    <div className="h-72 sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridLines} strokeOpacity={0.5} />
          <XAxis 
            dataKey="date" 
            stroke={chartColors.mutedText} 
            tickFormatter={(tick) => new Date(tick).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            tick={{ fontSize: 10, fill: chartColors.secondaryText }} // Reduced font size
            padding={{ left: 10, right: 10 }}
            axisLine={{ stroke: chartColors.gridLines }}
            tickLine={{ stroke: chartColors.gridLines, strokeOpacity: 0.5 }}
          />
          <YAxis 
            stroke={chartColors.mutedText} 
            allowDecimals={false} 
            tick={{ fontSize: 10, fill: chartColors.secondaryText }} // Reduced font size
            axisLine={{ stroke: chartColors.gridLines }}
            tickLine={{ stroke: chartColors.gridLines, strokeOpacity: 0.5 }}
          />
          <Tooltip 
            content={<CustomTooltip chartColors={chartColors} />} 
            cursor={{ fill: theme === 'dark' ? 'rgba(10, 132, 255, 0.1)' : 'rgba(0, 122, 255, 0.05)' }}
            wrapperStyle={{ outline: 'none' }}
          />
          <Legend 
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} // Reduced font size
              formatter={(value) => <span style={{ color: chartColors.secondaryText }}>{value}</span>}
          />
          <Line 
              type="monotone" 
              dataKey="count" 
              name="Lead Influx" 
              stroke={chartColors.blue} 
              strokeWidth={2} // Slightly reduced stroke width
              dot={{ r: 3, fill: chartColors.blue, stroke: chartColors.lightGrayFill, strokeWidth: 1 }} // Reduced dot size
              activeDot={{ r: 6, fill: chartColors.blue, stroke: chartColors.lightGrayFill, strokeWidth: 1,  }} // Reduced active dot size
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});

export default LeadsOverTimeChart;
