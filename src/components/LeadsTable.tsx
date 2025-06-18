import React, { useState, useMemo } from 'react';
import { Lead, EmailType, LeadStage, UserProfile, UserRole } from '../types'; 
// import { useTheme } from '../../context/ThemeContext'; // Removed as theme variable was unused
import WhatsAppIcon from './shared/WhatsAppIcon'; 
import { sanitizePhoneNumberForWhatsApp } from '../../utils/phoneNumberUtils';

const VideoCameraIconMini = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-4 h-4"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9A2.25 2.25 0 0013.5 5.25h-9a2.25 2.25 0 00-2.25 2.25v9A2.25 2.25 0 004.5 18.75z" />
  </svg>
);

interface LeadsTableProps {
  leads: Lead[];
  onRowClick: (lead: Lead) => void; 
  onMeetingIconClick?: (lead: Lead, targetElement: HTMLElement) => void; 
  currentUserProfile: UserProfile | null;
  dateFilterBar?: React.ReactNode; // Add this prop
}

const formatDate = (date?: Date): string => {
  if (!date) return 'N/A';
  // Ensure `date` is a Date object before calling toLocaleDateString
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return 'Invalid Date';
  return d.toLocaleDateString('en-US', { year: '2-digit', month: 'short', day: 'numeric' });
};

const isDateToday = (date: Date): boolean => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
};

const isDateTomorrow = (date: Date): boolean => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return date.getDate() === tomorrow.getDate() &&
         date.getMonth() === tomorrow.getMonth() &&
         date.getFullYear() === tomorrow.getFullYear(); 
};


const LeadsTable: React.FC<LeadsTableProps> = ({ leads, onRowClick, onMeetingIconClick, currentUserProfile, dateFilterBar }) => {
  // const { theme } = useTheme(); // Removed as theme was unused
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Lead | 'assignedToUserFullName' | null; direction: 'ascending' | 'descending' }>({ key: 'submissionDate', direction: 'descending' }); // Default sort by submissionDate

  const isSuperUser = currentUserProfile?.role === UserRole.SUPERUSER;

  const filteredLeads = useMemo(() => {
    let searchableLeads = [...leads];
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      searchableLeads = searchableLeads.filter(lead =>
        Object.values(lead).some(value =>
          String(value).toLowerCase().includes(lowerSearchTerm)
        ) || (lead.assignedToUserFullName && String(lead.assignedToUserFullName).toLowerCase().includes(lowerSearchTerm))
      );
    }
    return searchableLeads;
  }, [leads, searchTerm]);

  const sortedLeads = useMemo(() => {
    let sortableLeads = [...filteredLeads];
    if (sortConfig.key !== null) { 
      sortableLeads.sort((a, b) => {
        const valA = sortConfig.key === 'assignedToUserFullName' ? a.assignedToUserFullName : a[sortConfig.key as keyof Lead];
        const valB = sortConfig.key === 'assignedToUserFullName' ? b.assignedToUserFullName : b[sortConfig.key as keyof Lead];

        if (valA === undefined || valA === null) return sortConfig.direction === 'ascending' ? 1 : -1; // Nulls/undefined last for ascending
        if (valB === undefined || valB === null) return sortConfig.direction === 'ascending' ? -1 : 1; // Nulls/undefined last for ascending
        
        if (valA instanceof Date && valB instanceof Date) {
            return (valA.getTime() - valB.getTime()) * (sortConfig.direction === 'ascending' ? 1 : -1);
        }

        if (typeof valA === 'string' && typeof valB === 'string') {
          return valA.localeCompare(valB) * (sortConfig.direction === 'ascending' ? 1 : -1);
        }
        
        if (typeof valA === 'number' && typeof valB === 'number') {
            return (valA - valB) * (sortConfig.direction === 'ascending' ? 1 : -1);
        }
        // Fallback for other types, though typically covered by above
        if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableLeads;
  }, [filteredLeads, sortConfig]);

  const requestSort = (key: keyof Lead | 'assignedToUserFullName') => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: keyof Lead | 'assignedToUserFullName') => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'ascending' ? '▲' : '▼';
    }
    return <span className="opacity-30">◆</span>; // Simpler non-active indicator
  };
  
  const baseHeaders: { key: keyof Lead | 'assignedToUserFullName'; label: string; sortable: boolean }[] = [
    { key: 'name', label: 'Lead Info', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'contactNumber', label: 'Contact', sortable: true },
    { key: 'stage', label: 'Stage', sortable: true }, 
  ];

  const superUserHeaders: { key: keyof Lead | 'assignedToUserFullName'; label: string; sortable: boolean }[] = [
    ...baseHeaders,
    { key: 'assignedToUserFullName', label: 'Assigned To', sortable: true },
    { key: 'typeOfBusiness', label: 'Type', sortable: true },
    { key: 'website', label: 'Website', sortable: true },
    { key: 'submissionDate', label: 'Submitted', sortable: true },
    { key: 'emailType', label: 'Email Type', sortable: true },
  ];
  
  const basicUserHeaders: { key: keyof Lead | 'assignedToUserFullName'; label: string; sortable: boolean }[] = [
    ...baseHeaders,
    { key: 'submissionDate', label: 'Submitted', sortable: true },
  ];

  const headers = isSuperUser ? superUserHeaders : basicUserHeaders;


  const getEmailTypePillStyle = (emailType: EmailType) => {
    switch (emailType) {
      case EmailType.AI_PERSONALIZED:
        return `bg-sky-100 text-sky-700 border border-sky-300 dark:bg-sky-800/50 dark:text-sky-200 dark:border-sky-700`;
      case EmailType.STANDARD:
        return `bg-purple-100 text-purple-700 border border-purple-300 dark:bg-purple-800/50 dark:text-purple-200 dark:border-purple-700`;
      default: 
        return `bg-gray-100 text-gray-600 border border-gray-300 dark:bg-zinc-700/50 dark:text-zinc-300 dark:border-zinc-600`;
    }
  }

  const getLeadStagePillStyle = (stage: LeadStage) => { 
    switch (stage) {
      case LeadStage.COLD: 
        return `bg-blue-100 text-blue-700 border border-blue-300 dark:bg-blue-800/50 dark:text-blue-200 dark:border-blue-700`;
      case LeadStage.WARM: 
        return `bg-amber-100 text-amber-700 border border-amber-300 dark:bg-amber-700/50 dark:text-amber-200 dark:border-amber-600`;
      case LeadStage.HOT: 
        return `bg-orange-100 text-orange-700 border border-orange-300 dark:bg-orange-700/50 dark:text-orange-200 dark:border-orange-600`;
      case LeadStage.CLOSED: 
        return `bg-green-100 text-green-700 border border-green-300 dark:bg-green-800/50 dark:text-green-200 dark:border-green-700`;
      case LeadStage.FROZEN_LOST: 
        return `bg-red-100 text-red-700 border border-red-300 dark:bg-red-800/50 dark:text-red-200 dark:border-red-700`;
      case LeadStage.JUNK:
        return `bg-gray-100 text-gray-700 border border-gray-300 dark:bg-zinc-700/50 dark:text-zinc-200 dark:border-zinc-600`;
      default:
        return `bg-gray-100 text-gray-600 border border-gray-300 dark:bg-zinc-700/50 dark:text-zinc-300 dark:border-zinc-600`;
    }
  };

  const getMeetingIconStyle = (meetingDate?: Date): string => {
    const base = "dark:hover:bg-zinc-700";
    if (!meetingDate) return `text-indigo-500 hover:bg-indigo-100 hover:text-indigo-700 dark:text-indigo-400 ${base} dark:hover:text-indigo-300`;
    if (isDateToday(meetingDate)) return `text-green-500 hover:bg-green-100 hover:text-green-700 dark:text-green-400 ${base} dark:hover:text-green-300`;
    if (isDateTomorrow(meetingDate)) return `text-yellow-500 hover:bg-yellow-100 hover:text-yellow-700 dark:text-yellow-400 ${base} dark:hover:text-yellow-300`;
    return `text-indigo-500 hover:bg-indigo-100 hover:text-indigo-700 dark:text-indigo-400 ${base} dark:hover:text-indigo-300`;
  };

  const handleWhatsAppClick = (e: React.MouseEvent, phoneNumber?: string) => {
    e.stopPropagation(); 
    if (phoneNumber) {
      const sanitizedNumber = sanitizePhoneNumberForWhatsApp(phoneNumber);
      if (sanitizedNumber) {
        window.open(`https://wa.me/${sanitizedNumber}`, '_blank', 'noopener,noreferrer');
      } else {
        alert("Invalid phone number for WhatsApp."); // Consider a less intrusive notification
      }
    }
  };


  return (
    <div className="overflow-x-auto">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <input
          type="text"
          placeholder="Search leads..."
          className="w-full md:w-2/5 p-3 rounded-lg bg-gray-50 text-gray-700 border border-gray-300 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700 dark:placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 placeholder-gray-400 transition-all duration-300 ease-in-out shadow-sm focus:shadow-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Search leads"
        />
        <div className="w-full md:w-auto">
          {dateFilterBar}
        </div>
      </div>
      {sortedLeads.length === 0 && !searchTerm && <p className="text-gray-500 dark:text-zinc-400 text-center py-4">No leads found {isSuperUser ? "." : "assigned to you."}</p>}
      {sortedLeads.length === 0 && searchTerm && <p className="text-gray-500 dark:text-zinc-400 text-center py-4">No leads found for: <span className="text-blue-600 dark:text-blue-400 font-medium">{searchTerm}</span></p>}
      {sortedLeads.length > 0 && (
        <div className="rounded-lg overflow-x-auto border border-gray-200/80 dark:border-zinc-800/70">
          <table className="min-w-full divide-y divide-gray-200/80 dark:divide-zinc-800/70">
            <thead className="bg-gray-50/70 backdrop-blur-sm dark:bg-zinc-900/80 hidden sm:table-header-group">
              <tr>
                {headers.map((header) => (
                  <th
                    key={header.key as string}
                    scope="col"
                    className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100/70 dark:hover:bg-zinc-800/70 transition-colors"
                    onClick={() => header.sortable && requestSort(header.key as keyof Lead | 'assignedToUserFullName')}
                    aria-sort={sortConfig.key === header.key ? (sortConfig.direction === 'ascending' ? 'descending' : 'ascending') : 'none'}
                  >
                    <span className="flex items-center">
                      {header.label}
                      <span className="ml-1.5 text-blue-500 dark:text-blue-400">{header.sortable && getSortIndicator(header.key as keyof Lead | 'assignedToUserFullName')}</span>
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/80 dark:divide-zinc-800/70 bg-white dark:bg-zinc-900/60">
              {sortedLeads.map((lead) => (
                <tr 
                  key={lead.id} 
                  className="hover:bg-blue-50/70 dark:hover:bg-zinc-800/60 transition-colors duration-150 ease-in-out cursor-pointer sm:table-row flex flex-col sm:flex-row mb-4 sm:mb-0 rounded-lg sm:rounded-none shadow-sm sm:shadow-none border sm:border-0 border-gray-200 dark:border-zinc-800"
                  onClick={() => onRowClick(lead)}
                  aria-label={`View details for ${lead.name}`}
                  tabIndex={0} 
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onRowClick(lead);}} 
                >
                  {/* Mobile stacked view */}
                  <td className="block sm:table-cell px-4 py-3 sm:px-5 sm:py-4 whitespace-normal text-sm">
                    <div className="font-medium text-gray-800 dark:text-zinc-100">{lead.name}</div>
                    <div className="text-xs text-gray-500 dark:text-zinc-400">{lead.brandName}</div>
                    <div className="sm:hidden mt-2 text-xs text-gray-400 dark:text-zinc-500">
                      <span className="font-semibold">Email:</span> <a href={`mailto:${lead.email}`} className="text-blue-600 hover:text-blue-500 hover:underline dark:text-blue-400 dark:hover:text-blue-300 transition-colors" onClick={(e) => e.stopPropagation()}>{lead.email}</a>
                    </div>
                    <div className="sm:hidden text-xs text-gray-400 dark:text-zinc-500">
                      <span className="font-semibold">Contact:</span> {lead.contactNumber || <span className="italic">N/A</span>}
                    </div>
                  </td>
                  {/* Desktop columns */}
                  <td className="hidden sm:table-cell px-5 py-4 whitespace-nowrap text-sm">
                    <a href={`mailto:${lead.email}`} className="text-blue-600 hover:text-blue-500 hover:underline dark:text-blue-400 dark:hover:text-blue-300 transition-colors" onClick={(e) => e.stopPropagation()}>{lead.email}</a>
                  </td>
                  <td className="hidden sm:table-cell px-5 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-zinc-300">
                    <div className="flex items-center">
                        <span>{lead.contactNumber || <span className="text-gray-400 dark:text-zinc-500 italic">N/A</span>}</span>
                        {lead.contactNumber && (
                          <button
                            onClick={(e) => handleWhatsAppClick(e, lead.contactNumber)}
                            className="ml-2 p-1 rounded-full border border-green-500 bg-white text-green-600 hover:bg-green-50 dark:bg-zinc-900 dark:border-green-400 dark:text-green-400 dark:hover:bg-green-950 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                            aria-label={`Chat with ${lead.name} on WhatsApp`}
                            title="Open WhatsApp chat"
                            style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <WhatsAppIcon className="w-5 h-5" style={{ color: '#25D366' }} />
                          </button>
                        )}
                    </div>
                  </td>
                  <td className="px-4 py-3 sm:px-5 sm:py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getLeadStagePillStyle(lead.stage)}`}> 
                        {lead.stage} 
                      </span>
                      {lead.meetingDate && onMeetingIconClick && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); 
                            onMeetingIconClick(lead, e.currentTarget);
                          }}
                          className={`ml-2 p-1 rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-offset-0 dark:focus:ring-offset-zinc-900 ${getMeetingIconStyle(lead.meetingDate).replace(/hover:bg-(\w+)-(\d+)/, 'focus:ring-$1-500 dark:focus:ring-$1-400')}`}
                          aria-label={`View meeting details for ${lead.name}`}
                        >
                          <VideoCameraIconMini className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                  {/* Superuser extra columns only on desktop */}
                  {isSuperUser && (
                    <>
                      <td className="hidden sm:table-cell px-5 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-zinc-300">
                        {lead.assignedToUserFullName || <span className="italic text-gray-400 dark:text-zinc-500">Unassigned</span>}
                      </td>
                      <td className="hidden sm:table-cell px-5 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-zinc-300">{lead.typeOfBusiness}</td>
                      <td className="hidden sm:table-cell px-5 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-zinc-300">
                        {lead.website ? <a href={lead.website.startsWith('http') ? lead.website : `http://${lead.website}`} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-500 hover:underline dark:text-purple-400 dark:hover:text-purple-300 transition-colors" onClick={(e) => e.stopPropagation()}>{lead.website}</a> : <span className="text-gray-400 dark:text-zinc-500 italic">Not provided</span>}
                      </td>
                    </>
                  )}
                  <td className="px-4 py-3 sm:px-5 sm:py-4 whitespace-nowrap text-sm text-gray-600 dark:text-zinc-300">{formatDate(lead.submissionDate)}</td>
                  {isSuperUser && (
                    <td className="hidden sm:table-cell px-5 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getEmailTypePillStyle(lead.emailType)}`}>
                        {lead.emailType}
                        </span>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LeadsTable;
