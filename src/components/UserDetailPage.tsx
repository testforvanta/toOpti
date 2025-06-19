import React, { useState, useEffect } from 'react';
import { UserProfile, ActivityLog, ActivityLogActionType, ChartDataItem, UserRole } from '../types';
import LoadingSpinner from './shared/LoadingSpinner';
import ErrorDisplay from './shared/ErrorDisplay';
import UserProductivityPieChart from './charts/UserProductivityPieChart';
// Import the renamed function
import { fetchUserLeadStageCountsForMonthEnd } from '../../services/dataService';
import GlassContainer from './shared/GlassContainer';
import { useTheme } from '../context/ThemeContext';

interface UserDetailPageProps {
  selectedUser: UserProfile | null;
  logs: ActivityLog[];
  isLoadingLogs: boolean;
  logsError: string | null;
  onNavigateBack: () => void;
}

// Helper to get current month in "YYYY-MM" format
const getCurrentYearMonth = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
};

// Helper to format "YYYY-MM" to "Month YYYY"
const formatYearMonthForDisplay = (yearMonth: string): string => {
  if (!yearMonth || !yearMonth.includes('-')) return "Invalid Date";
  const [year, monthNum] = yearMonth.split('-');
  const date = new Date(parseInt(year), parseInt(monthNum) - 1);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
};

const formatTimestamp = (isoTimestamp: string): string => {
  if (!isoTimestamp) return 'N/A';
  try {
    return new Date(isoTimestamp).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
    });
  } catch (e) {
    return 'Invalid Date';
  }
};

const formatActionType = (actionType: ActivityLogActionType): string => {
    const words = actionType.toLowerCase().split('_');
    return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const getDisplayActor = (log: ActivityLog): string => {
  const name = log.actor_user_full_name?.trim();
  if (name) return name;

  const email = log.actor_user_email?.trim();
  if (email) return email;

  const userId = log.actor_user_id?.trim();
  if (userId) return `${userId.substring(0, 8)}... (ID)`;
  
  return 'System/Unknown';
};

// Helper function to recursively format details for multi-line display
const formatLogDetailsRecursive = (data: any, indentLevel: number): string => {
  const indent = '  '.repeat(indentLevel);
  const basePrefix = indentLevel > 0 ? indent + '- ' : indent; // Add '- ' for sub-items

  if (Array.isArray(data)) {
    if (data.length === 0) return basePrefix + 'N/A (empty list)';
    // For arrays, each item is on a new line, potentially with its own prefix if it's a sub-list item
    return data.map(item => {
      if (typeof item === 'object' && item !== null) {
        // If item is an object/array, it gets its own line and then its content is formatted
        return basePrefix.trimEnd() + '\n' + formatLogDetailsRecursive(item, indentLevel + (indentLevel > 0 ? 1 : 0)); // No double prefix for first level array item
      }
      return basePrefix + String(item);
    }).join('\n');
  }

  if (typeof data === 'object' && data !== null) {
    const entries = Object.entries(data);
    if (entries.length === 0) return basePrefix + 'N/A (empty object)';
    return entries.map(([key, value]) => {
      const formattedKey = key.replace(/([A-Z])([a-z])/g, ' $1$2').replace(/_/g, ' ').replace(/^./, str => str.toUpperCase());
      if (typeof value === 'object' && value !== null) {
        // Key on one line, then nested object/array indented on new lines
        return `${basePrefix}${formattedKey}:\n` + formatLogDetailsRecursive(value, indentLevel + 1);
      }
      return `${basePrefix}${formattedKey}: ${String(value)}`;
    }).join('\n');
  }

  // For primitive types at any level, just return them as string.
  // If at the root level (indentLevel === 0) and it's a primitive, it won't have a prefix.
  return (indentLevel === 0 ? '' : basePrefix) + String(data);
};

const formatLogDetails = (details: any): string => {
  if (details === null || details === undefined || (typeof details === 'string' && details.trim() === '')) {
    return 'N/A';
  }

  let parsedDetails = details;
  if (typeof details === 'string') {
    try {
      parsedDetails = JSON.parse(details);
    } catch (error) {
      // Not a JSON string, or empty string - return as is, it's a simple string detail.
      return details;
    }
  }
  // Now parsedDetails is an object/array or the original primitive if parsing failed or wasn't needed.
  // The recursive formatter will handle objects, arrays, and primitives correctly.
  return formatLogDetailsRecursive(parsedDetails, 0).trim(); // Trim initial/trailing newlines from recursive.
};


const ActionIcon: React.FC<{ action: ActivityLogActionType }> = ({ action }) => {
  let iconPath = "";
  let colorClass = "text-gray-500 dark:text-zinc-400";

  switch (action) {
    case ActivityLogActionType.LOGIN:
      iconPath = "M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m-3 0l3-3m0 0l-3-3m3 3H9"; // Arrow Right On Rectangle
      colorClass = "text-green-500 dark:text-green-400";
      break;
    case ActivityLogActionType.LOGOUT:
      iconPath = "M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3H3"; // Arrow Left On Rectangle
      colorClass = "text-red-500 dark:text-red-400";
      break;
    case ActivityLogActionType.LEAD_STAGE_UPDATE:
      iconPath = "M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5"; // ArrowsUpDownIcon
      colorClass = "text-blue-500 dark:text-blue-400";
      break;
    case ActivityLogActionType.LEAD_DETAILS_UPDATE:
    case ActivityLogActionType.LEAD_PAYMENT_UPDATE:
    case ActivityLogActionType.MEETING_LINK_UPDATED:
      iconPath = "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"; // PencilSquareIcon
      colorClass = "text-yellow-500 dark:text-yellow-400";
      break;
    case ActivityLogActionType.LEAD_ASSIGNED:
    case ActivityLogActionType.LEAD_UNASSIGNED:
      iconPath = "M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-3.741-5.582M11.998 12l-.072.005a5.002 5.002 0 01-4.927 0l-.072-.005A5.002 5.002 0 002.25 17.25V18a3 3 0 003 3h13.5a3 3 0 003-3v-.75a5.002 5.002 0 00-4.752-5.25l-.072.005a5.001 5.001 0 01-4.927 0z"; // UserGroupIcon or UserPlus/UserMinus
      colorClass = "text-purple-500 dark:text-purple-400";
      break;
    case ActivityLogActionType.LEAD_DELETED:
      iconPath = "M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c.342.052.682.107 1.022.166m0 0A48.11 48.11 0 0112 5.69c2.97 0 5.743-.83 8.243-2.275m0 0c.342.052.682.107 1.022.166"; // TrashIcon
      colorClass = "text-red-500 dark:text-red-400";
      break;
    default:
      iconPath = "M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"; // InformationCircleIcon
  }

  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 mr-3 ${colorClass}`}>
      <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
    </svg>
  );
};


const UserDetailPage: React.FC<UserDetailPageProps> = ({
  selectedUser,
  logs,
  isLoadingLogs,
  logsError,
  onNavigateBack,
}) => {
  const { theme } = useTheme();
  const [productivityData, setProductivityData] = useState<ChartDataItem[] | null>(null);
  const [isProductivityLoading, setIsProductivityLoading] = useState<boolean>(false);
  const [productivityError, setProductivityError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentYearMonth());

  useEffect(() => {
    if (selectedUser && selectedUser.role === UserRole.BASIC_USER) {
      setIsProductivityLoading(true);
      setProductivityError(null);
      // Use the renamed function here
      fetchUserLeadStageCountsForMonthEnd(selectedUser.id, selectedMonth) 
        .then(data => {
          setProductivityData(data);
          setIsProductivityLoading(false);
        })
        .catch(err => {
          setProductivityError(err.message || 'Failed to fetch productivity data.');
          setIsProductivityLoading(false);
          setProductivityData(null);
        });
    } else {
      setProductivityData(null); // Clear data if not a basic user or no user selected
    }
  }, [selectedUser, selectedMonth]);

  const handleMonthChange = (direction: 'previous' | 'next') => {
    const [yearStr, monthStr] = selectedMonth.split('-');
    let year = parseInt(yearStr);
    let month = parseInt(monthStr) - 1; // Date month is 0-indexed

    if (direction === 'previous') {
      month--;
      if (month < 0) {
        month = 11;
        year--;
      }
    } else {
      month++;
      if (month > 11) {
        month = 0;
        year++;
      }
    }
    const newSelectedMonth = `${year}-${(month + 1).toString().padStart(2, '0')}`;
    setSelectedMonth(newSelectedMonth);
  };
  
  const isNextMonthDisabled = () => {
    const currentAppMonth = getCurrentYearMonth();
    return selectedMonth >= currentAppMonth;
  };

  if (!selectedUser) {
    return (
      <div className="p-6 md:p-10">
        <ErrorDisplay title="No User Selected" message="Please go back to the users list and select a user to view details." />
        <button
          onClick={onNavigateBack}
          className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
        >
          Back to Users List
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-screen-2xl mx-auto space-y-8">
      <header className="pb-6 border-b border-gray-300/50 dark:border-zinc-800/60 flex justify-between items-center">
        <div>
            <h1 className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400">
                User Details: <span className="text-orange-500 dark:text-orange-400">{selectedUser.full_name || selectedUser.email}</span>
            </h1>
            <p className="text-gray-500 dark:text-zinc-400 mt-2">Profile information and activity log.</p>
        </div>
        <button
          onClick={onNavigateBack}
          className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-offset-zinc-950"
          aria-label="Go back to Users List"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block mr-1.5 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Users List
        </button>
      </header>

      <GlassContainer className="mb-8">
        <div className="flex flex-col md:flex-row justify-between gap-x-6 gap-y-6">
          {/* Left Side: Profile Info */}
          <div className="flex-grow md:max-w-md lg:max-w-lg xl:max-w-xl">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-zinc-200 mb-4">Profile Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div><strong className="text-gray-500 dark:text-zinc-400">Full Name:</strong> <span className="text-gray-800 dark:text-zinc-100">{selectedUser.full_name || 'N/A'}</span></div>
              <div><strong className="text-gray-500 dark:text-zinc-400">Email:</strong> <span className="text-gray-800 dark:text-zinc-100">{selectedUser.email}</span></div>
              <div><strong className="text-gray-500 dark:text-zinc-400">Role:</strong> <span className="text-gray-800 dark:text-zinc-100 capitalize">{selectedUser.role.replace('_', ' ')}</span></div>
              <div><strong className="text-gray-500 dark:text-zinc-400">Designation:</strong> <span className="text-gray-800 dark:text-zinc-100">{selectedUser.designation || 'N/A'}</span></div>
              <div><strong className="text-gray-500 dark:text-zinc-400">Joined:</strong> <span className="text-gray-800 dark:text-zinc-100">{selectedUser.created_at ? formatTimestamp(selectedUser.created_at) : 'N/A'}</span></div>
            </div>
          </div>

          {/* Right Side: Productivity Chart (Conditional) */}
          {selectedUser.role === UserRole.BASIC_USER && (
            <GlassContainer className="md:w-2/5 lg:w-1/3 xl:w-2/5 flex flex-col">
              <h2 className="text-xl font-semibold text-gray-700 dark:text-zinc-200 mb-4">Lead Stages at Month End</h2>
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => handleMonthChange('previous')}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-zinc-200 bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 rounded-md shadow-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:focus:ring-offset-zinc-900"
                >
                  &lt; Prev
                </button>
                <span className="text-sm font-semibold text-gray-800 dark:text-zinc-100">
                  {formatYearMonthForDisplay(selectedMonth)}
                </span>
                <button
                  onClick={() => handleMonthChange('next')}
                  disabled={isNextMonthDisabled()}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-zinc-200 bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 rounded-md shadow-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:focus:ring-offset-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next &gt;
                </button>
              </div>
              
              <div className="flex-grow flex items-center justify-center min-h-[200px] md:min-h-[300px]">
                {isProductivityLoading && <LoadingSpinner message="Loading lead stage data..." />}
                {productivityError && <ErrorDisplay title="Lead Stage Data Error" message={productivityError} />}
                {!isProductivityLoading && !productivityError && (!productivityData || productivityData.length === 0) && (
                  <p className="text-gray-500 dark:text-zinc-400 text-center py-10">No lead stage data available for this period.</p>
                )}
                {!isProductivityLoading && !productivityError && productivityData && productivityData.length > 0 && (
                  // This chart component might need a title prop or the title "Lead Stages at Month End" is handled by the h2 above
                  <UserProductivityPieChart data={productivityData} />
                )}
              </div>
            </GlassContainer>
          )}
        </div>
      </GlassContainer>

      <GlassContainer>
        <h2 className="text-xl font-semibold text-gray-700 dark:text-zinc-200 mb-4">Activity Log</h2>
        {isLoadingLogs && <LoadingSpinner message="Loading activity logs..." />}
        {logsError && <ErrorDisplay title="Activity Log Error" message={logsError} />}
        {!isLoadingLogs && !logsError && logs.length === 0 && (
          <p className="text-gray-500 dark:text-zinc-400 text-center py-6">No activity logs found for this user.</p>
        )}
        {!isLoadingLogs && !logsError && logs.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-gray-200/80 dark:border-zinc-800/70 max-h-[500px]">
            <table className="min-w-full divide-y divide-gray-200/80 dark:divide-zinc-800/70">
              <thead className="bg-gray-50/70 dark:bg-zinc-900/80 sticky top-0 backdrop-blur-sm z-10">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Timestamp</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Action</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Details</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Actor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/80 dark:divide-zinc-800/70 bg-white dark:bg-zinc-900/60">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/70 dark:hover:bg-zinc-800/60 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500 dark:text-zinc-400">{formatTimestamp(log.timestamp)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-700 dark:text-zinc-200 flex items-center">
                       <ActionIcon action={log.action_type} /> {formatActionType(log.action_type)}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-zinc-300">
                      {log.target_lead_name && (
                        <div className="mb-1">
                          Lead: <strong>{log.target_lead_name}</strong> 
                          {log.target_lead_id && ` (ID: ${log.target_lead_id.substring(0,8)}...)`}
                        </div>
                      )}
                      <div className="whitespace-pre-wrap" title={typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}>
                        {formatLogDetails(log.details)}
                      </div>
                      {(!log.details || (typeof log.details === 'string' && log.details.trim() === '')) && !log.target_lead_name && <span className="italic">No specific details.</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500 dark:text-zinc-400">
                        {getDisplayActor(log)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassContainer>
    </div>
  );
};

export default UserDetailPage;