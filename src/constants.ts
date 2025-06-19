// Chart colors (Apple-inspired Light Theme)
export const LIGHT_CHART_COLORS = {
  blue: '#007AFF',       
  teal: '#5AC8FA',       
  green: '#34C759',      
  orange: '#FF9500',     
  red: '#FF3B30',        
  purple: '#AF52DE',     
  pink: '#FF2D55',       
  yellow: '#FFCC00',     
  
  primaryText: '#1D1D1F', 
  secondaryText: '#6E6E73',
  mutedText: '#8A8A8E',    
  
  gridLines: '#D1D1D6',  
  
  tooltipBg: 'rgba(255, 255, 255, 0.85)', 
  tooltipBorder: 'rgba(200, 200, 200, 0.7)', 
  
  lightGrayFill: '#F5F5F7', 
  mediumGrayFill: '#E5E5EA',
};

// Chart colors for Dark Theme
export const DARK_CHART_COLORS = {
  blue: '#0A84FF',       // Brighter blue for dark mode
  teal: '#64D2FF',       
  green: '#30D158',      
  orange: '#FF9F0A',     
  red: '#FF453A',        
  purple: '#BF5AF2',     
  pink: '#FF375F',       
  yellow: '#FFD60A',     
  
  primaryText: '#F2F2F7', // Near white for primary text
  secondaryText: '#AEAEB2',// Lighter gray for secondary text
  mutedText: '#8E8E93',    
  
  gridLines: '#52525B',  // zinc-600, for grid lines (contrast with dark bg)
  
  tooltipBg: 'rgba(28, 28, 30, 0.85)', // Dark, semi-transparent for tooltips
  tooltipBorder: 'rgba(80, 80, 80, 0.7)', 
  
  lightGrayFill: '#1C1C1E', // Dark background fill
  mediumGrayFill: '#2C2C2E',
};


// Colors for Lead Stage Distribution Chart (Light Mode)
export const LIGHT_LEAD_STAGE_CHART_COLORS: Record<string, string> = {
  'Cold': '#60A5FA',                // blue-400
  'Warm': '#F59E0B',                // amber-500
  'Hot': '#F97316',                 // orange-500
  'Closed': '#22C55E',              // green-500
  'Frozen - Lost': '#7DD3FC',       // sky-300
  'Junk': '#9CA3AF',                // gray-400
};

// Colors for Lead Stage Distribution Chart (Dark Mode)
export const DARK_LEAD_STAGE_CHART_COLORS: Record<string, string> = {
  'Cold': '#3B82F6',                // blue-500 (brighter)
  'Warm': '#FBBF24',                // amber-400 (brighter)
  'Hot': '#FB923C',                 // orange-400 (brighter)
  'Closed': '#4ADE80',              // green-400 (brighter)
  'Frozen - Lost': '#38BDF8',       // sky-400 (brighter)
  'Junk': '#6B7280',                // gray-500
};
