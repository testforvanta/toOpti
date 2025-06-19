import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { ChartDataItem, LeadStage } from '../../types';
import { LIGHT_CHART_COLORS, DARK_CHART_COLORS, LIGHT_LEAD_STAGE_CHART_COLORS, DARK_LEAD_STAGE_CHART_COLORS } from '../../constants';
import { useTheme } from '../../context/ThemeContext';

interface LeadStagesBarChartProps {
  data: ChartDataItem[]; 
}

const CustomTooltip: React.FC<any> = ({ active, payload, label, chartColors, leadStageColors }) => {
  if (active && payload && payload.length) {
    const stageName = label as LeadStage;
    const barColor = leadStageColors[stageName] || chartColors.mutedText;
    return (
      <div 
        className="backdrop-blur-md p-3 rounded-md shadow-lg"
        style={{ backgroundColor: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}` }}
      >
        <p className="text-xs mb-1" style={{color: chartColors.secondaryText}}>{`Stage: ${stageName}`}</p>
        <p className="text-sm font-semibold" style={{ color: barColor }}>{`Count: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

const LeadStagesBarChart: React.FC<LeadStagesBarChartProps> = React.memo(({ data }) => {
   const { theme } = useTheme();
   const chartColors = theme === 'dark' ? DARK_CHART_COLORS : LIGHT_CHART_COLORS;
   const leadStageColors = theme === 'dark' ? DARK_LEAD_STAGE_CHART_COLORS : LIGHT_LEAD_STAGE_CHART_COLORS;

   if (!data || data.length === 0) {
    return <p className="text-gray-500 dark:text-slate-400 text-center py-10">No lead stage data available.</p>;
  }
  
  const chartData = data.filter(item => item.value > 0);
   if (chartData.length === 0) {
    return <p className="text-gray-500 dark:text-slate-400 text-center py-10">No leads in active stages.</p>;
  }


  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 30, bottom: 5 }} barCategoryGap="25%">
        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridLines} strokeOpacity={0.4} horizontal={true} vertical={false}/>
        <XAxis 
            type="number" 
            stroke={chartColors.mutedText} 
            allowDecimals={false} 
            tick={{ fontSize: 11, fill: chartColors.secondaryText }}
            axisLine={{ stroke: chartColors.gridLines }}
            tickLine={{ stroke: chartColors.gridLines, strokeOpacity: 0.5 }}
        />
        <YAxis 
          type="category" 
          dataKey="name" 
          stroke={chartColors.mutedText} 
          width={110} 
          tick={{ fontSize: 11, fill: chartColors.secondaryText }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip 
            content={<CustomTooltip chartColors={chartColors} leadStageColors={leadStageColors} />} 
            cursor={{ fill: theme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)'}}
            wrapperStyle={{ outline: 'none' }}
        />
        <Bar dataKey="value" name="Lead Count" radius={[0, 4, 4, 0]}> 
            {chartData.map((entry, index) => (
                 <Cell key={`cell-${index}`} fill={leadStageColors[entry.name as LeadStage] || chartColors.mutedText} />
            ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
});

export default LeadStagesBarChart;
