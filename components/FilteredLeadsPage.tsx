import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Lead, LeadStage, GlobalMessageConfig, LeadUpdatePayload, UserProfile, UserRole } from '../src/types'; 
import { updateLeadDetails as updateLeadDetailsService, deleteLeadById as deleteLeadService, updateCoreLeadDetails as updateCoreLeadDetailsService, assignLeadToUser as assignLeadToUserService } from '../services/dataService';
import LeadsTable from './LeadsTable';
import LeadDetailModal from './LeadDetailModal';
import LoadingSpinner from './shared/LoadingSpinner'; 
import ErrorDisplay from './shared/ErrorDisplay';   
import GlobalMessageDisplay from './shared/GlobalMessageDisplay'; 
import GlassContainer from './shared/GlassContainer'; 
import { useTheme } from '../context/ThemeContext';
import { CoreLeadDataUpdate } from '../App'; 


// Icons
const VideoCameraIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9A2.25 2.25 0 0013.5 5.25h-9a2.25 2.25 0 00-2.25 2.25v9A2.25 2.25 0 004.5 18.75z" />
  </svg>
);

const CloseIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const GoogleMeetIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className || "w-4 h-4"}>
    <path fillRule="evenodd" clipRule="evenodd" d="M12 3C12.5523 3 13 3.44772 13 4V4.68131L18.4542 1.85417C19.007 1.57775 19.6667 1.92355 19.6667 2.53289V9.01111H20.5C21.0523 9.01111 21.5 9.45883 21.5 10.0111V13.0111C21.5 13.5634 21.0523 14.0111 20.5 14.0111H19.6667V20.4894C19.6667 21.0987 19.007 21.4445 18.4542 21.1681L13 18.341V19.0222C13 19.5745 12.5523 20.0222 12 20.0222C11.4477 20.0222 11 19.5745 11 19.0222V18.341L5.54583 21.1681C4.99301 21.4445 4.33333 21.0987 4.33333 20.4894V14.0111H3.5C2.94772 14.0111 2.5 13.5634 2.5 13.0111V10.0111C2.5 9.45883 2.94772 9.01111 3.5 9.01111H4.33333V2.53289C4.33333 1.92355 4.99301 1.57775 5.54583 1.85417L11 4.68131V4C11 3.44772 11.4477 3 12 3ZM17.6667 18.1681L13 15.8321V7.19016L17.6667 4.85417V18.1681ZM6.33333 4.85417L11 7.19016V15.8321L6.33333 18.1681V4.85417Z" />
  </svg>
);

const formatFullMeetingDateTime = (date?: Date): string => {
    if (!date) return "No date scheduled";
    return date.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
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

interface FilteredLeadsPageProps {
  stage?: LeadStage | null; // Make optional and allow null
  tag?: string | null;    // Add new tag prop
  leads: Lead[]; 
  isLoading: boolean;
  error: string | null;
  onUpdateLeadDetailsInApp: (leadId: string, updates: LeadUpdatePayload) => void;
  onNavigateBack: () => void;
  userProfile: UserProfile | null; 
  actorUserProfile: UserProfile | null; // New: To identify who is performing the action
  onDeleteLeadInApp: (leadId: string) => void; 
  onUpdateCoreLeadDetailsInApp: (leadId: string, updates: CoreLeadDataUpdate) => void; 
  onAssignLeadInApp: (leadId: string, assignedToUserId: string | null, assignedToUserFullName?: string | null) => void; 
  basicUserProfilesList: UserProfile[]; 
  isLoadingBasicUsers: boolean; 
}

const FilteredLeadsPage: React.FC<FilteredLeadsPageProps> = ({
  stage,
  tag, // Add tag
  leads, 
  isLoading,
  error,
  onUpdateLeadDetailsInApp,
  onNavigateBack,
  userProfile,
  actorUserProfile, // Destructure new prop
  onDeleteLeadInApp,
  onUpdateCoreLeadDetailsInApp,
  onAssignLeadInApp,
  basicUserProfilesList,
  isLoadingBasicUsers,
}) => {
  console.log('[FilteredLeadsPage] Received props: stage:', stage, 'tag:', tag);
  const { theme } = useTheme();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isLeadDetailModalOpen, setIsLeadDetailModalOpen] = useState<boolean>(false);
  const [globalUpdateMessage, setGlobalUpdateMessage] = useState<GlobalMessageConfig | null>(null);
  
  const [meetingPopoverState, setMeetingPopoverState] = useState<{ lead: Lead, anchorEl: HTMLElement } | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const isSuperUser = userProfile?.role === UserRole.SUPERUSER;

  const filteredLeadsToDisplay = useMemo(() => {
    let filtered: Lead[];
    if (tag && tag === "Meeting Scheduled") {
      filtered = leads.filter(lead => lead.tags?.includes("Meeting Scheduled"));
      // Optional: Add sorting for meeting dates if needed here, similar to old MEETING_SCHEDULED stage logic
      filtered.sort((a, b) => {
          const aDate = a.meetingDate;
          const bDate = b.meetingDate;
          if (!aDate && !bDate) return 0;
          if (!aDate) return 1;
          if (!bDate) return -1;
          // Simple sort by date, most recent first for example, or adapt existing complex sort
          return bDate.getTime() - aDate.getTime(); 
      });
    } else if (stage) {
      filtered = leads.filter(lead => lead.stage === stage);
      // Remove the specific sorting logic for `stage === LeadStage.MEETING_SCHEDULED`
      // as that stage no longer exists.
    } else {
      filtered = []; // Should not happen if App.tsx logic is correct
    }
    console.log('[FilteredLeadsPage] Leads received for filtering (props.leads.length):', leads.length);
    console.log('[FilteredLeadsPage] Filtering with actual values: stage:', stage, 'tag:', tag);
    // 'filtered' is the variable holding the array after filtering logic
    console.log('[FilteredLeadsPage] Number of leads after filtering (filtered.length):', filtered.length); 
    return filtered;
  }, [leads, stage, tag]);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (meetingPopoverState?.anchorEl && popoverRef.current && 
          !popoverRef.current.contains(event.target as Node) &&
          !meetingPopoverState.anchorEl.contains(event.target as Node)
      ) {
        setMeetingPopoverState(null);
      }
    };

    if (meetingPopoverState) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [meetingPopoverState]);

  const handleOpenLeadDetailModal = (lead: Lead) => {
    setSelectedLead(lead);
    setIsLeadDetailModalOpen(true);
    setGlobalUpdateMessage(null);
  };

  const handleCloseLeadDetailModal = () => {
    setSelectedLead(null);
    setIsLeadDetailModalOpen(false);
  };

  const handleUpdateLeadDetailsForModal = async (leadId: string, updates: LeadUpdatePayload) => {
    setGlobalUpdateMessage(null);
    const originalLead = leads.find(l => l.id === leadId);
    const originalLeadName = originalLead?.name || 'Lead';
     if (!actorUserProfile?.id) {
        setGlobalUpdateMessage({type: 'error', message: "Cannot update: Actor user profile not found."});
        return;
    }
    try {
      await updateLeadDetailsService(leadId, updates, actorUserProfile.id, originalLead);
      onUpdateLeadDetailsInApp(leadId, updates); 
      let successMessage = `Details for "${originalLeadName}" updated.`;
      if (updates.stage === LeadStage.CLOSED && updates.paymentDetails) {
        successMessage = `Lead "${originalLeadName}" closed with payment details.`;
      } else if (updates.stage && updates.meetLink) {
        successMessage = `Stage for "${originalLeadName}" updated to ${updates.stage} and meeting link added.`;
      } else if (updates.stage) {
        successMessage = `Stage for "${originalLeadName}" updated to ${updates.stage}.`;
      } else if (updates.meetLink) {
        successMessage = `Meeting link for "${originalLeadName}" updated.`;
      }
      setGlobalUpdateMessage({type: 'success', message: successMessage});
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred."
      setGlobalUpdateMessage({type: 'error', message: `Failed to update details for "${originalLeadName}": ${errorMessage}`});
      throw err; 
    }
  };

  const handleUpdateCoreLeadDetailsForModal = async (leadId: string, updates: CoreLeadDataUpdate) => {
    setGlobalUpdateMessage(null);
    const originalLead = leads.find(l => l.id === leadId);
    const originalLeadName = originalLead?.name || 'Lead';
    if (!actorUserProfile?.id) {
        setGlobalUpdateMessage({type: 'error', message: "Cannot update: Actor user profile not found."});
        return;
    }
    try {
        await updateCoreLeadDetailsService(leadId, updates, actorUserProfile.id, originalLead);
        onUpdateCoreLeadDetailsInApp(leadId, updates);
        setGlobalUpdateMessage({ type: 'success', message: `Core details for "${updates.name || originalLeadName}" updated.` });
        if (selectedLead && selectedLead.id === leadId) {
            setSelectedLead(prev => prev ? {...prev, ...updates} : null);
        }
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
        setGlobalUpdateMessage({ type: 'error', message: `Failed to update core details for "${originalLeadName}": ${errorMessage}` });
        throw err;
    }
  };

  const handleDeleteLeadForModal = async (leadId: string) => {
    setGlobalUpdateMessage(null);
    const leadToDelete = leads.find(l => l.id === leadId);
    const leadName = leadToDelete?.name || 'Lead';
    if (!actorUserProfile?.id) {
        setGlobalUpdateMessage({type: 'error', message: "Cannot delete: Actor user profile not found."});
        return;
    }
    try {
        await deleteLeadService(leadId, actorUserProfile.id, leadToDelete?.name, leadToDelete?.assignedToUserId);
        onDeleteLeadInApp(leadId);
        setGlobalUpdateMessage({ type: 'success', message: `Lead "${leadName}" deleted successfully.` });
        handleCloseLeadDetailModal(); 
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
        setGlobalUpdateMessage({ type: 'error', message: `Failed to delete lead "${leadName}": ${errorMessage}` });
        throw err;
    }
  };

   const handleAssignLeadForModal = async (leadId: string, targetUserId: string | null) => {
    setGlobalUpdateMessage(null);
    const leadToAssign = leads.find(l => l.id === leadId);
    const leadName = leadToAssign?.name || 'Lead';
    const targetUser = basicUserProfilesList.find(u => u.id === targetUserId);
    const targetUserName = targetUser?.full_name || targetUser?.email || 'Unassigned';
     if (!actorUserProfile?.id) {
        setGlobalUpdateMessage({type: 'error', message: "Cannot assign: Actor user profile not found."});
        return;
    }
    try {
      await assignLeadToUserService(leadId, targetUserId, actorUserProfile.id, leadToAssign?.assignedToUserId, targetUserName);
      onAssignLeadInApp(leadId, targetUserId, targetUserName);
      setGlobalUpdateMessage({ type: 'success', message: `Lead "${leadName}" ${targetUserId ? `assigned to ${targetUserName}` : 'unassigned'}.` });
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead(prev => prev ? {...prev, assignedToUserId: targetUserId, assignedToUserFullName: targetUserName } : null);
      }
    } catch (err) {
      console.error("FilteredLeadsPage: Failed to assign lead", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setGlobalUpdateMessage({ type: 'error', message: `Failed to assign lead "${leadName}": ${errorMessage}` });
      throw err;
    }
  };

  const handleMeetingIconClickInTable = (lead: Lead, anchorEl: HTMLElement) => {
    if (meetingPopoverState?.lead.id === lead.id && meetingPopoverState?.anchorEl === anchorEl) {
      setMeetingPopoverState(null); 
    } else {
      setMeetingPopoverState({ lead, anchorEl });
    }
  };
  
  const calculatePopoverPosition = (anchor: HTMLElement | null): React.CSSProperties => {
    if (!anchor) {
      return { display: 'none', position: 'absolute', top: '-9999px', left: '-9999px' };
    }
    const anchorRect = anchor.getBoundingClientRect();
    const verticalGap = 2; 
    const popoverHeight = popoverRef.current ? popoverRef.current.offsetHeight : 0;
    const popoverWidth = popoverRef.current ? popoverRef.current.offsetWidth : 0;
    const top = anchorRect.top + window.scrollY - popoverHeight - verticalGap;
    const left = anchorRect.left + window.scrollX + (anchorRect.width / 2) - (popoverWidth / 2);
    return {
        position: 'absolute',
        top: `${top}px`,
        left: `${left}px`,
        minWidth: '250px', 
        maxWidth: '300px', 
        zIndex: 50, 
    };
  };

  let popoverBorderClass = "border-gray-200/80 dark:border-zinc-700/80";
  let meetingUrgencyText = "";
  let meetingUrgencyClass = "";
  let meetingTimeText = "";

  if (meetingPopoverState?.lead.meetingDate) {
    const meetingDate = meetingPopoverState.lead.meetingDate;
    meetingTimeText = meetingDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    if (isDateToday(meetingDate)) {
      popoverBorderClass = "border-green-400/80 dark:border-green-500/80";
      meetingUrgencyText = "Today";
      meetingUrgencyClass = "text-green-600 dark:text-green-400 font-bold";
    } else if (isDateTomorrow(meetingDate)) {
      popoverBorderClass = "border-yellow-500/80 dark:border-yellow-400/80";
      meetingUrgencyText = "Tomorrow";
      meetingUrgencyClass = "text-yellow-600 dark:text-yellow-400 font-bold";
    } else {
        meetingTimeText = formatFullMeetingDateTime(meetingDate); 
        meetingUrgencyClass = "text-blue-600 dark:text-blue-400 font-medium"; 
    }
  }


  if (isLoading) return <LoadingSpinner message={`Loading ${tag ? 'tagged' : stage} Leads...`} />;
  if (error && !filteredLeadsToDisplay.length) return <div className="p-6 md:p-10"><ErrorDisplay message={error} title="Filtered Leads Data Error:" /></div>;
  
  return (
    <div className="p-4 md:p-8 max-w-screen-2xl mx-auto space-y-8 relative"> 
      <GlobalMessageDisplay messageConfig={globalUpdateMessage} onClose={() => setGlobalUpdateMessage(null)} />
      <header className="flex flex-col sm:flex-row justify-between items-center pb-6 border-b border-gray-300/50 dark:border-zinc-800/60">
        <div className="flex items-center">
            <h1 className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400">
                Leads: <span className="text-orange-500 dark:text-orange-400">
                    {tag === "MEETING_SCHEDULED_TAG" ? "Meeting Scheduled (Tag)" : stage}
                </span> {tag ? "" : "Stage"}
            </h1>
        </div>
        <button
          onClick={onNavigateBack}
          className="mt-4 sm:mt-0 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-offset-zinc-950"
          aria-label="Go back to Lead Flow"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block mr-1.5 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Lead Flow
        </button>
      </header>
      {tag === "MEETING_SCHEDULED_TAG" && (
         <p className="text-gray-500 dark:text-zinc-400 -mt-4">
            Leads tagged with "Meeting Scheduled"{isSuperUser ? "" : " (assigned to you)"}.
            Sorted by meeting date. Click <VideoCameraIcon className="inline w-4 h-4 text-indigo-500 dark:text-indigo-400" /> for details.
         </p>
      )}


      {error && filteredLeadsToDisplay.length > 0 && <ErrorDisplay message={error} title="Filtered Leads Data Warning:" />}

      <GlassContainer>
        {filteredLeadsToDisplay.length > 0 ? (
          <LeadsTable
            leads={filteredLeadsToDisplay}
            onRowClick={handleOpenLeadDetailModal}
            onMeetingIconClick={tag === "MEETING_SCHEDULED_TAG" ? handleMeetingIconClickInTable : undefined}
            currentUserProfile={userProfile}
          />
        ) : (
          <p className="text-gray-500 dark:text-zinc-400 text-center py-10 text-lg">
            No leads found 
            {tag === "MEETING_SCHEDULED_TAG" ? " with the 'Meeting Scheduled' tag" : `in the ${stage} stage`}
            {isSuperUser ? "." : " assigned to you."}
          </p>
        )}
      </GlassContainer>

      {meetingPopoverState && meetingPopoverState.lead.meetingDate && (
        <div
          ref={popoverRef}
          style={calculatePopoverPosition(meetingPopoverState.anchorEl)}
          className={`bg-white/80 backdrop-blur-lg dark:bg-zinc-900/80 dark:backdrop-blur-lg rounded-xl shadow-xl p-4 animate-slide-down-fade-in ${popoverBorderClass}`}
          role="dialog"
          aria-labelledby={`meeting-popover-title-${meetingPopoverState.lead.id}`}
        >
          <div className="flex justify-between items-center mb-2.5">
            <h4 id={`meeting-popover-title-${meetingPopoverState.lead.id}`} className="text-md font-semibold text-gray-800 dark:text-zinc-100">
              Meeting Details
            </h4>
            <button 
              onClick={() => setMeetingPopoverState(null)} 
              className="p-1 text-gray-500 hover:text-gray-800 dark:text-zinc-400 dark:hover:text-zinc-100 rounded-full hover:bg-gray-200/70 dark:hover:bg-zinc-700/70 transition-colors focus:outline-none focus:ring-1 focus:ring-offset-0 dark:focus:ring-offset-zinc-900 focus:ring-blue-500 dark:focus:ring-blue-400"
              aria-label="Close meeting details"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="text-sm space-y-3"> 
             <p><strong className="text-gray-600 dark:text-zinc-300">Lead:</strong> <span className="text-gray-800 dark:text-zinc-100">{meetingPopoverState.lead.name}</span></p>
             <div className="flex items-center">
                <strong className="text-gray-600 dark:text-zinc-300 mr-1">Scheduled:</strong>
                {meetingUrgencyText && (
                  <>
                    <span className={`${meetingUrgencyClass} mr-1`}>{meetingUrgencyText}</span>
                    <span className="text-gray-700 dark:text-zinc-200">at {meetingTimeText}</span>
                  </>
                )}
                {!meetingUrgencyText && (
                  <span className={meetingUrgencyClass}>{meetingTimeText}</span>
                )}
              </div>
              {meetingPopoverState.lead.meetLink && (
                <div className="pt-1">
                  <a 
                    href={meetingPopoverState.lead.meetLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-4 py-2 text-xs font-medium rounded-lg shadow-sm transition-colors duration-150 ease-in-out
                               bg-green-500 hover:bg-green-600 text-white 
                               dark:bg-green-500 dark:hover:bg-green-400 
                               focus:outline-none focus:ring-2 focus:ring-green-500/70 dark:focus:ring-green-400/70 focus:ring-offset-1 dark:focus:ring-offset-zinc-900"
                    onClick={(e) => e.stopPropagation()} 
                  >
                    <GoogleMeetIcon className="w-4 h-4 mr-2" />
                    Join Meet
                  </a>
                </div>
              )}
          </div>
        </div>
      )}

      <footer className="text-center py-8 text-gray-400 dark:text-zinc-500 border-t border-gray-300/50 dark:border-zinc-800/60 mt-8">
        Filtered Lead View &copy; {new Date().getFullYear()}. Data via Supabase.
      </footer>

      <LeadDetailModal
        lead={selectedLead}
        isOpen={isLeadDetailModalOpen}
        onClose={handleCloseLeadDetailModal}
        onUpdateLeadDetails={handleUpdateLeadDetailsForModal}
        userProfile={userProfile}
        actorUserProfile={actorUserProfile} // Pass actor profile
        onDeleteLead={handleDeleteLeadForModal}
        onUpdateCoreLeadDetails={handleUpdateCoreLeadDetailsForModal}
        onAssignLead={handleAssignLeadForModal} 
        basicUsers={basicUserProfilesList} 
        isLoadingBasicUsers={isLoadingBasicUsers}
      />
    </div>
  );
};

export default FilteredLeadsPage;
