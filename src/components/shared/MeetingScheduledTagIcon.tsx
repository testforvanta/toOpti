import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface MeetingScheduledTagIconProps {
  className?: string;
}

const MeetingScheduledTagIcon: React.FC<MeetingScheduledTagIconProps> = ({ className }) => {
  const { theme } = useTheme();
  // Use a purplish shade for the tag, pill shape
  return (
    <span
      className={`px-3 py-1 inline-flex items-center text-xs font-semibold rounded-full border shadow-sm ${theme === 'dark' 
        ? 'bg-purple-800/60 text-purple-200 border-purple-700' 
        : 'bg-purple-100 text-purple-700 border-purple-300'} ${className}`}
      style={{ minWidth: '2.5em', justifyContent: 'center' }}
      aria-label="Meeting Scheduled Tag"
    >
      M
    </span>
  );
};

export default MeetingScheduledTagIcon;
