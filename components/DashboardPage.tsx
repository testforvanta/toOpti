import React, { useState, useEffect, useMemo } from 'react';
import { Lead, BusinessType, EmailType, TimeSeriesDataItem, ChartDataItem, LeadStage, GlobalMessageConfig, LeadUpdatePayload, UserProfile, UserRole, NewLeadData } from '../src/types'; 
import { updateLeadDetails as updateLeadDetailsService, addLead as addLeadService, deleteLeadById as deleteLeadService, updateCoreLeadDetails as updateCoreLeadDetailsService, assignLeadToUser as assignLeadToUserService } from '../services/dataService'; 
import MetricCard from './MetricCard';
import LeadsTable from './LeadsTable';
import LeadDetailModal from './LeadDetailModal'; 
import AddLeadModal from './AddLeadModal';
import LeadsOverTimeChart from './charts/LeadsOverTimeChart';
import BusinessTypePieChart from './charts/BusinessTypePieChart';
import LeadStagesBarChart from './charts/LeadStagesBarChart'; 
import LoadingSpinner from './shared/LoadingSpinner'; 
import ErrorDisplay from './shared/ErrorDisplay';   
import GlobalMessageDisplay from './shared/GlobalMessageDisplay'; 
import GlassContainer from './shared/GlassContainer'; 
import { CoreLeadDataUpdate } from '../App'; 
// import { LeadFilters } from '../types'; // REMOVED LeadFilters


interface DashboardPageProps {
  initialStageFilter: LeadStage | null; // ADDED BACK
  leads: Lead[]; 
  isLoading: boolean; 
  error: string | null; 
  onUpdateLeadDetailsInApp: (leadId: string, updates: LeadUpdatePayload) => void; 
  clearInitialStageFilter: () => void; // ADDED BACK
  userProfile: UserProfile | null; 
  actorUserProfile: UserProfile | null;
  onDeleteLeadInApp: (leadId: string) => void; 
  onUpdateCoreLeadDetailsInApp: (leadId: string, updates: CoreLeadDataUpdate) => void; 
  onAssignLeadInApp: (leadId: string, assignedToUserId: string | null, assignedToUserFullName?: string | null) => void; 
  basicUserProfilesList: UserProfile[]; 
  isLoadingBasicUsers: boolean; 
  // onApplyFilters?: (filters: LeadFilters) => void; // REMOVED
}

const DashboardPage: React.FC<DashboardPageProps> = ({ 
    initialStageFilter, // ADDED BACK
    leads, 
    isLoading, 
    error, 
    onUpdateLeadDetailsInApp,
    clearInitialStageFilter, // ADDED BACK
    userProfile,
    actorUserProfile,
    onDeleteLeadInApp,
    onUpdateCoreLeadDetailsInApp,
    onAssignLeadInApp,
    basicUserProfilesList,
    isLoadingBasicUsers,
    // onApplyFilters, // REMOVED
}) => {
  // Defensive type guard for LeadStage
  function isValidLeadStage(value: any): value is LeadStage {
    return typeof value === 'string' && Object.values(LeadStage).includes(value as LeadStage);
  }

  const [currentStageFilter, setCurrentStageFilter] = useState<LeadStage | null>(null); // REINSTATED
  
  useEffect(() => {
    // A helper function to check if a value is a valid LeadStage enum member
    function isValidLeadStageFn(value: any): value is LeadStage { // Renamed to avoid conflict with type
        return typeof value === 'string' && Object.values(LeadStage).includes(value as LeadStage);
    }
    setCurrentStageFilter(isValidLeadStageFn(initialStageFilter) ? initialStageFilter : null);
  }, [initialStageFilter]); // REINSTATED useEffect

  // const [filterState, setFilterState] = useState<LeadFilters>({}); // REMOVED

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isLeadDetailModalOpen, setIsLeadDetailModalOpen] = useState<boolean>(false);
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState<boolean>(false);
  const [globalUpdateMessage, setGlobalUpdateMessage] = useState<GlobalMessageConfig | null>(null); 

  // const [filterDate, setFilterDate] = useState<string>(''); // REMOVED
  // const [searchTerm, setSearchTerm] = useState<string>(''); // REMOVED

  const isSuperUser = userProfile?.role === UserRole.SUPERUSER;

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
      // Update selectedLead state directly with the new updates
      // This ensures the modal gets the freshest data immediately.
      setSelectedLead(prevSelectedLead => 
        prevSelectedLead && prevSelectedLead.id === leadId 
          ? { ...prevSelectedLead, ...updates } 
          : null
      );
    } catch (err) {
      console.error("DashboardPage: Failed to update lead details", err);
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
      console.error("DashboardPage: Failed to assign lead", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setGlobalUpdateMessage({ type: 'error', message: `Failed to assign lead "${leadName}": ${errorMessage}` });
      throw err;
    }
  };
  
  const handleOpenAddLeadModal = () => {
    setIsAddLeadModalOpen(true);
    setGlobalUpdateMessage(null);
  };

  const handleCloseAddLeadModal = () => {
    setIsAddLeadModalOpen(false);
  };

  const handleSaveNewLead = async (newLeadData: NewLeadData) => {
    if (!userProfile) { // userProfile is the one adding, actorUserProfile is also userProfile here
        setGlobalUpdateMessage({ type: 'error', message: `User profile not available. Cannot add lead.` });
        return;
    }
    setGlobalUpdateMessage(null); // Clear previous messages
    try {
      // Call the service that sends data to the N8N webhook
      await addLeadService(newLeadData, userProfile.id, userProfile.role);
      
      // Inform the user about the process and upcoming reload
      setGlobalUpdateMessage({ 
        type: 'info', 
        message: `Lead "${newLeadData.name}" submission sent. The page will reload shortly to reflect the new lead...` 
      });
      handleCloseAddLeadModal(); // Close the modal

      // Introduce a delay (e.g., 3.5 seconds) before forcing a page reload
      setTimeout(() => {
        window.location.reload();
      }, 3500); // 3.5 seconds delay, adjust if needed

    } catch (err) {
      // Handle errors from addLeadService (e.g., N8N webhook call failure)
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred while submitting the lead.";
      setGlobalUpdateMessage({ type: 'error', message: `Failed to submit lead: ${errorMessage}` });
      // Do not re-throw here if we want the modal to close and messages to show.
    }
  };

  const handleClearFilter = () => { // REINSTATED
    setCurrentStageFilter(null);
    clearInitialStageFilter(); 
  };

  // REMOVED: handleFilterInputChange, handleDateInputChange, handleApplyDashboardFilters, handleClearDashboardFilters

  const metrics = useMemo(() => {
    const totalLeads = leads.length;
    const totalEmailsSent = leads.filter(lead => lead.emailSent).length;
    const emailsResponded = leads.filter(lead => lead.emailResponse).length;
    const emailsRespondedPercentage = totalEmailsSent > 0 ? (emailsResponded / totalEmailsSent) * 100 : 0;
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const leadsLast30Days = leads.filter(lead => lead.submissionDate && lead.submissionDate >= thirtyDaysAgo).length;

    return {
      totalLeads,
      totalEmailsSent,
      emailsResponded,
      emailsRespondedPercentage,
      leadsLast30Days,
    };
  }, [leads]);

  const businessTypeData: ChartDataItem[] = useMemo(() => {
    const counts = leads.reduce((acc, lead) => {
      acc[lead.typeOfBusiness] = (acc[lead.typeOfBusiness] || 0) + 1;
      return acc;
    }, {} as Record<BusinessType, number>);
    return Object.entries(counts).map(([name, value]) => ({ name: name as BusinessType, value }));
  }, [leads]);

  const leadStageData: ChartDataItem[] = useMemo(() => {
    const counts = leads.reduce((acc, lead) => {
      acc[lead.stage] = (acc[lead.stage] || 0) + 1;
      return acc;
    }, {} as Record<LeadStage, number>);
    return Object.values(LeadStage).map(stageEnumValue => ({
      name: stageEnumValue,
      value: counts[stageEnumValue] || 0,
    }));
  }, [leads]);

  const leadsOverTimeData: TimeSeriesDataItem[] = useMemo(() => {
    const countsByDate: Record<string, number> = {};
    leads.forEach(lead => {
      if (lead.submissionDate && lead.submissionDate.toISOString) {
        const dateStr = lead.submissionDate.toISOString().split('T')[0];
        countsByDate[dateStr] = (countsByDate[dateStr] || 0) + 1;
      }
    });
    return Object.entries(countsByDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [leads]);
  
  const leadsForTable = useMemo(() => {
    let processedLeads = [...leads];
    if (currentStageFilter) {
      processedLeads = processedLeads.filter(lead => lead.stage === currentStageFilter);
    }
    return processedLeads.slice(0, 200);
  }, [leads, currentStageFilter]);

  const tableTitle = useMemo(() => {
    if (currentStageFilter) {
      return `Lead Manifest: ${currentStageFilter} Stage`;
    }
    const userSpecificTitle = isSuperUser ? "(Last 200 System-wide)" : "(Your Last 200 Assigned)";
    return `Lead Manifest ${userSpecificTitle}`;
  }, [currentStageFilter, isSuperUser]);

  if (isLoading) return <LoadingSpinner message="Loading Dashboard Data..." />;
  // Reverted error condition to include currentStageFilter check
  if (error && !leads.length && !currentStageFilter) return <div className="p-6 md:p-10"><ErrorDisplay message={error} title="Dashboard Data Error:"/></div>;
  if (error && currentStageFilter && !leads.some(l => l.stage === currentStageFilter)) return <div className="p-6 md:p-10"><ErrorDisplay message={error} title="Dashboard Data Error:"/></div>;


  return (
    <div className="p-4 md:p-8 max-w-screen-2xl mx-auto space-y-8">
      <header className="pb-6 border-b border-gray-300/50 dark:border-zinc-800/60 flex flex-col sm:flex-row justify-between items-start">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 mr-3 text-blue-600 dark:text-blue-400">
               <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
            </svg>
            Clarity Dashboard
          </h1>
          <p className="text-gray-500 dark:text-zinc-400 mt-2">
            {isSuperUser ? "Lead Generation & Outreach Analytics (via Supabase)." : "Your Assigned Leads Overview."}
          </p>
        </div>
        <div className="flex flex-col items-end space-y-3 mt-4 sm:mt-0">
            {userProfile && (
              <button
                  onClick={handleOpenAddLeadModal}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:bg-green-500 dark:hover:bg-green-600 dark:focus:ring-offset-zinc-950"
                  aria-label="Add new lead"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 inline-block mr-1.5 -mt-0.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add New Lead
              </button>
            )}
            <div className="text-xs text-gray-400 dark:text-zinc-500">
              Last Update: <span className="text-green-500 dark:text-green-400 font-medium">{new Date().toLocaleTimeString()}</span>
            </div>
        </div>
      </header>
      
      {error && leads.length > 0 && <ErrorDisplay message={error} title="Dashboard Data Warning:" />}
      <GlobalMessageDisplay messageConfig={globalUpdateMessage} onClose={() => setGlobalUpdateMessage(null)} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        <MetricCard title="Total Leads" value={metrics.totalLeads.toLocaleString()} trend={isSuperUser ? `${metrics.leadsLast30Days} last 30 days` : undefined} description={!isSuperUser ? "Leads assigned to you" : "System-wide leads"}/>
        <MetricCard title="Emails Sent" value={metrics.totalEmailsSent.toLocaleString()} />
        <MetricCard 
          title="Emails Responded" 
          value={metrics.emailsResponded.toLocaleString()} 
          description={metrics.totalEmailsSent > 0 ? `${metrics.emailsRespondedPercentage.toFixed(1)}% of sent` : 'No emails sent'}
        />
        <MetricCard title="AI Personalized Emails" value={leads.filter(l => l.emailType === EmailType.AI_PERSONALIZED).length.toLocaleString()} description="Targeted Outreach" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassContainer className="lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-zinc-200 mb-4">Lead Influx Trajectory</h2>
          {leadsOverTimeData.length > 1 ? <LeadsOverTimeChart data={leadsOverTimeData} /> : <p className="text-gray-500 dark:text-zinc-400 text-center py-10">Insufficient temporal data for trajectory analysis.</p>}
        </GlassContainer>
        <GlassContainer>
          <h2 className="text-xl font-semibold text-gray-700 dark:text-zinc-200 mb-4">Lead Source Classification</h2>
          {businessTypeData.length > 0 ? <BusinessTypePieChart data={businessTypeData} /> : <p className="text-gray-500 dark:text-zinc-400 text-center py-10">No lead source data available.</p>}
        </GlassContainer>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
         <GlassContainer>
          <h2 className="text-xl font-semibold text-gray-700 dark:text-zinc-200 mb-4">Lead Stage Distribution</h2>
          {leadStageData.some(item => item.value > 0) ? <LeadStagesBarChart data={leadStageData} /> : <p className="text-gray-500 dark:text-zinc-400 text-center py-10">No lead stage data available.</p>}
        </GlassContainer>
      </div>

      <GlassContainer>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-zinc-200">{tableTitle}</h2>
            {currentStageFilter && ( // REINSTATED "Clear Filter" button logic
                <button
                    onClick={handleClearFilter}
                    className="px-4 py-2 text-xs font-medium text-blue-600 bg-blue-100/70 hover:bg-blue-200/70 rounded-lg transition-colors duration-150 shadow-sm border border-blue-200/80 dark:text-blue-300 dark:bg-zinc-700/40 dark:hover:bg-zinc-600/50 dark:border-zinc-600/60"
                    aria-label="Clear stage filter and show all recent leads"
                >
                   Clear Filter / Show Recent
                </button>
            )}
        </div>

        {/* Filter UI JSX block REMOVED */}

        <div> {/* This div was previously: <div className="max-h-[600px] overflow-y-auto"> */}
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto"> {/* New div for scrolling */}
            <LeadsTable 
                leads={leadsForTable} 
                onRowClick={handleOpenLeadDetailModal} 
                currentUserProfile={userProfile}
              // startDateFilter and endDateFilter props are now removed
            />
          </div>
        </div>
      </GlassContainer>

      <footer className="text-center py-8 text-gray-400 dark:text-zinc-500 border-t border-gray-300/50 dark:border-zinc-800/60 mt-8">
        Dashboard by The Buy Tech &copy; {new Date().getFullYear()}. Frosted Glass Edition. Data via Supabase.
      </footer>

      <LeadDetailModal
        key={selectedLead ? `${selectedLead.id}-${isLeadDetailModalOpen}` : 'no-lead'}
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
      {userProfile && ( 
        <AddLeadModal
            isOpen={isAddLeadModalOpen}
            onClose={handleCloseAddLeadModal}
            onAddLead={handleSaveNewLead}
            userProfile={userProfile} 
            basicUserProfilesList={basicUserProfilesList} 
            isLoadingBasicUsers={isLoadingBasicUsers}
        />
      )}
    </div>
  );
};

export default DashboardPage;
