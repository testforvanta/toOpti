import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartDataItem } from '../../types';
import { LIGHT_CHART_COLORS, DARK_CHART_COLORS } from '../../constants';
import { useTheme } from '../../context/ThemeContext';

interface BusinessTypePieChartProps {
  data: ChartDataItem[];
}

const CustomTooltip: React.FC<any> = ({ active, payload, chartColors }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload; 
    return (
      <div 
        className="backdrop-blur-md p-3 rounded-md shadow-lg"
        style={{ backgroundColor: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}` }}
      >
        <p className="text-sm font-semibold" style={{ color: payload[0].payload.fill }}>{data.name}</p>
        <p className="text-xs" style={{color: chartColors.secondaryText}}>{`Count: ${data.value} (${(data.percent * 100).toFixed(1)}%)`}</p>
      </div>
    );
  }
  return null;
};

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name, fill }: any, chartColors: typeof LIGHT_CHART_COLORS | typeof DARK_CHART_COLORS) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent * 100 < 8) return null; 

  return (
    <text x={x} y={y} fill={chartColors.primaryText} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-[10px] font-medium opacity-80">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const BusinessTypePieChart: React.FC<BusinessTypePieChartProps> = React.memo(({ data }) => {
  const { theme } = useTheme();
  const chartColors = theme === 'dark' ? DARK_CHART_COLORS : LIGHT_CHART_COLORS;
  
  const PIE_SLICE_COLORS = [chartColors.blue, chartColors.teal, chartColors.green, chartColors.orange, chartColors.purple, chartColors.pink];


  if (!data || data.length === 0) {
    return <p className="text-gray-500 dark:text-slate-400 text-center py-10">No data available for classification.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={(props) => renderCustomizedLabel(props, chartColors)}
          outerRadius={100} 
          innerRadius={55}  
          fill="#8884d8"
          dataKey="value"
          nameKey="name"
          paddingAngle={2}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={PIE_SLICE_COLORS[index % PIE_SLICE_COLORS.length]} stroke={chartColors.lightGrayFill} strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip 
            content={<CustomTooltip chartColors={chartColors} />} 
            cursor={{ fill: theme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)'}}
            wrapperStyle={{ outline: 'none' }}
        />
        <Legend 
            iconSize={10} 
            wrapperStyle={{ fontSize: '12px', marginTop: '15px' }} 
            formatter={(value, entry) => <span style={{ color: entry.color }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
});

export default BusinessTypePieChart;
