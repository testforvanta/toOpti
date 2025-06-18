import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: string;
  description?: string;
  icon?: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = React.memo(({ title, value, trend, description, icon }) => {
  return (
    <div className="bg-white/20 backdrop-blur-2xl rounded-3xl shadow-glass-neumorphic border border-white/30 
                   dark:bg-zinc-900/70 dark:border-zinc-800/60 dark:shadow-dark-glass-neumorphic
                   p-6 transition-all duration-300 ease-in-out hover:shadow-soft-dreamy dark:hover:shadow-dark-soft-dreamy">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">{title}</h3>
        {icon && <div className="text-blue-500 dark:text-blue-400">{icon}</div>}
      </div>
      <p className="text-3xl lg:text-4xl font-bold text-gray-800 dark:text-zinc-100">{value}</p>
      {trend && <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">{trend}</p>}
      {description && <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">{description}</p>}
    </div>
  );
});

export default MetricCard;
