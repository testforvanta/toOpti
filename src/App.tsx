import React, { useState, useEffect, useCallback } from 'react';
import DashboardPage from './components/DashboardPage';
import LeadFlowPage from './components/LeadFlowPage';
import SidePanel from './components/SidePanel'; 
import FilteredLeadsPage from './components/FilteredLeadsPage';
import UsersPage from './components/UsersPage';
import UserDetailPage from './components/UserDetailPage';
import SettingsPage from './components/SettingsPage';
import { LeadStage, LeadUpdatePayload, UserProfile, Lead, UserRole, NewLeadData, ActivityLog, Page } from './types';
import { 
  fetchLeads as fetchLeadsService, 
  fetchUserProfiles as fetchUserProfilesService,
  fetchBasicUserProfiles as fetchBasicUserProfilesService, 
  fetchActivityLogsForUser,
  deleteLeadById
} from '../services/dataService'; 
import { useAuth } from './auth/AuthContext';
import { fetchUserProfile } from '../services/fetchUserProfile';
import LoginPage from './components/LoginPage';
import LoadingSpinner from './components/shared/LoadingSpinner';
import ErrorDisplay from './components/shared/ErrorDisplay';
import NotificationBell from './components/NotificationBell';
import NotificationPanel from './components/NotificationPanel';
import MobileNotificationDropdown from './components/MobileNotificationDropdown';
import { useNotifications } from './context/NotificationContext';
import { NotificationType, NotificationAction } from './types';
import LeadDetailModal from './components/LeadDetailModal';

export type CoreLeadDataUpdate = Partial<Pick<Lead, 'name' | 'brandName' | 'email' | 'contactNumber' | 'website' | 'typeOfBusiness'>>;


const App: React.FC = () => {
  const { user, session, loading, login, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [dashboardStageFilter, setDashboardStageFilter] = useState<LeadStage | null>(null);
  const [filteredLeadStage, setFilteredLeadStage] = useState<LeadStage | null>(null); 
  const [filteredLeadsTag, setFilteredLeadsTag] = useState<string | null>(null);
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState<boolean>(true); 
  const [leadsError, setLeadsError] = useState<string | null>(null);

  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]); 
  const [isLoadingUserProfiles, setIsLoadingUserProfiles] = useState<boolean>(false);
  const [userProfilesError, setUserProfilesError] = useState<string | null>(null);

  const [basicUserProfilesList, setBasicUserProfilesList] = useState<UserProfile[]>([]); 
  const [isLoadingBasicUsers, setIsLoadingBasicUsers] = useState<boolean>(false);

  const [selectedUserForDetailPage, setSelectedUserForDetailPage] = useState<UserProfile | null>(null);
  const [currentUserActivityLogs, setCurrentUserActivityLogs] = useState<ActivityLog[]>([]);
  const [isLoadingActivityLogs, setIsLoadingActivityLogs] = useState<boolean>(false);
  const [activityLogsError, setActivityLogsError] = useState<string | null>(null);

  const { notifications, sendNotification, updateNotification, refreshNotifications } = useNotifications();
  const [isNotificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [pendingRejectNotification, setPendingRejectNotification] = useState(null);

  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const selectedLead = leads.find(l => l.id === selectedLeadId) || null;

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    if (user) {
      fetchUserProfile(user.id).then(setProfile);
    } else {
      setProfile(null);
    }
  }, [user]);

  useEffect(() => {
    if (user && profile) { 
      const loadLeads = async () => {
        setIsLoadingLeads(true);
        setLeadsError(null);
        try {
          const fetchedLeads = await fetchLeadsService(user.id, profile.role);
          setLeads(fetchedLeads);
        } catch (err) {
          // console.error("App: Raw error object from fetchLeadsService:", err); 
          let errorMessage: string;
          if (err instanceof Error) {
            if (err.message.includes("Supabase client is not configured.") || err.message.includes("YOUR_SUPABASE_URL_HERE")) {
              errorMessage = "CRITICAL: Supabase is not configured. Please update services/supabaseClient.ts.";
            } else if (err.message.toLowerCase().includes("failed to fetch")) {
              errorMessage = "App: Network connection issue. CRITICAL: CHECK SUPABASE CORS & RLS. Verify internet, Supabase status, URL/Key.";
            } else if (err.message.toLowerCase().includes("supabase") || err.message.toLowerCase().includes("rls")) {
              errorMessage = `App: Supabase access error (RLS or permissions). Message: ${err.message}`;
            } else {
              errorMessage = `App: An unexpected error occurred: ${err.message}`;
            }
          } else { 
            errorMessage = "App: An unknown error occurred while loading leads.";
          }
          setLeadsError(errorMessage);
        } finally {
          setIsLoadingLeads(false);
        }
      };
      loadLeads();
    } else { // Only clear if not loading and no user
      setLeads([]);
      setIsLoadingLeads(false);
      setLeadsError(null);
    }
  }, [user, profile]); 

   useEffect(() => {
    if (user && profile?.role === UserRole.SUPERUSER) {
      const loadUserProfiles = async () => {
        setIsLoadingUserProfiles(true);
        setUserProfilesError(null);
        try {
          const fetchedProfiles = await fetchUserProfilesService();
          setUserProfiles(fetchedProfiles);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Error loading user profiles.";
          setUserProfilesError(message);
        } finally {
          setIsLoadingUserProfiles(false);
        }
      };
      loadUserProfiles();
    } else {
      setUserProfiles([]);
    }
  }, [user, profile]);

  useEffect(() => {
    if (user && profile?.role === UserRole.SUPERUSER) {
      const loadBasicUsers = async () => {
        setIsLoadingBasicUsers(true);
        try {
          const fetchedBasicUsers = await fetchBasicUserProfilesService();
          setBasicUserProfilesList(fetchedBasicUsers);
        } catch (err) {
          console.error("App: Error fetching basic user profiles for assignment:", err);
        } finally {
          setIsLoadingBasicUsers(false);
        }
      };
      loadBasicUsers();
    } else {
      setBasicUserProfilesList([]); 
    }
  }, [user, profile]);

  useEffect(() => {
    if (currentPage === 'userDetail' && selectedUserForDetailPage && profile?.role === UserRole.SUPERUSER) {
      const loadActivityLogs = async () => {
        setIsLoadingActivityLogs(true);
        setActivityLogsError(null);
        try {
          const logs = await fetchActivityLogsForUser(selectedUserForDetailPage.id);
          setCurrentUserActivityLogs(logs);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Error loading activity logs.";
          setActivityLogsError(message);
        } finally {
          setIsLoadingActivityLogs(false);
        }
      };
      loadActivityLogs();
    }
  }, [currentPage, selectedUserForDetailPage, profile?.role]);


  const navigateToLeadFlow = useCallback(() => {
    setCurrentPage('leadFlow');
    setDashboardStageFilter(null); 
    setFilteredLeadStage(null);
    setSelectedUserForDetailPage(null);
  }, []);

  const navigateToDashboard = useCallback((stage?: LeadStage) => {
    setCurrentPage('dashboard');
    setDashboardStageFilter(stage || null);
    setFilteredLeadStage(null);
    setSelectedUserForDetailPage(null);
  }, []);

  const navigateToFilteredLeadsPage = useCallback((stageOrTag: LeadStage | string) => {
    setCurrentPage('filteredLeads');
    if (typeof stageOrTag === 'string' && stageOrTag === 'MEETING_SCHEDULED_TAG') {
      setFilteredLeadStage(null);
      setFilteredLeadsTag('Meeting Scheduled');
    } else {
      setFilteredLeadStage(stageOrTag as LeadStage);
      setFilteredLeadsTag(null);
    }
    setDashboardStageFilter(null); 
    setSelectedUserForDetailPage(null);
  }, []);

  const navigateToUsersPage = useCallback(() => {
    if (profile?.role === UserRole.SUPERUSER) {
      setCurrentPage('users');
      setDashboardStageFilter(null);
      setFilteredLeadStage(null);
      setSelectedUserForDetailPage(null);
    } else {
      navigateToDashboard(); // Basic users redirected to dashboard
    }
  }, [profile?.role, navigateToDashboard]);

  const navigateToUserDetailPage = useCallback((userToView: UserProfile) => {
    if (profile?.role === UserRole.SUPERUSER) {
      setSelectedUserForDetailPage(userToView);
      setCurrentPage('userDetail');
      setDashboardStageFilter(null);
      setFilteredLeadStage(null);
    }
  }, [profile?.role]);
  
  const handleUpdateLeadDetailsInApp = (leadId: string, updates: LeadUpdatePayload) => {
    setLeads(prevLeads =>
      prevLeads.map(l => {
        if (l.id === leadId) {
          const updatedLead = { ...l, ...updates };
          if (updates.paymentDetails === null) { // Explicitly clear paymentDetails if null
             updatedLead.paymentDetails = undefined;
          }
          return updatedLead;
        }
        return l;
      })
    );
  };

  const handleUpdateCoreLeadDetailsInApp = (leadId: string, updates: CoreLeadDataUpdate) => {
    setLeads(prevLeads => 
      prevLeads.map(l => (l.id === leadId ? { ...l, ...updates } : l))
    );
  };

  const handleDeleteLeadInApp = (leadId: string) => {
    setLeads(prevLeads => prevLeads.filter(l => l.id !== leadId));
  };

  const handleAddNewLeadToState = (newLead: Lead) => {
    if (profile?.role === UserRole.BASIC_USER) {
        if (newLead.assignedToUserId === user?.id) {
            setLeads(prevLeads => [newLead, ...prevLeads]);
        }
    } else { 
         setLeads(prevLeads => [newLead, ...prevLeads]); 
    }
  };

  const handleAssignLeadInApp = (leadId: string, assignedToUserId: string | null, assignedToUserFullName?: string | null) => {
    setLeads(prevLeads => 
      prevLeads.map(l => 
        l.id === leadId 
        ? { ...l, assignedToUserId: assignedToUserId, assignedToUserFullName: assignedToUserFullName } 
        : l
      )
    );
    if (profile?.role === UserRole.BASIC_USER && user?.id) {
        if (assignedToUserId !== user.id && leads.some(l => l.id === leadId && l.assignedToUserId === user.id)) {
            setLeads(prevLeads => prevLeads.filter(l => l.id !== leadId || l.assignedToUserId === user.id));
        }
    }
  };
  
  const handleSignOut = useCallback(async () => {
    await logout();
  }, [logout]);

  // Superuser notification action handler
  const handleNotificationAction = async (notification, action, reason) => {
    if (!profile || profile.role !== UserRole.SUPERUSER) return;
    if (notification.type !== NotificationType.LEAD_DELETE_REQUEST) return;
    const { leadId, leadName } = notification.data || {};
    const recipientId = notification.sender_id;
    if (action === NotificationAction.CONFIRM) {
      try {
        await deleteLeadById(leadId, profile.id, leadName, notification.data?.assignedToUserIdBeforeDelete);
        await updateNotification(notification.id, { read: true });
        await sendNotification({
          type: NotificationType.LEAD_DELETE_CONFIRMED,
          message: `Your request to delete lead "${leadName}" has been approved and the lead was deleted.`,
          recipient_id: recipientId,
          sender_id: profile.id,
          data: { leadId, leadName },
        });
        refreshNotifications();
        // Optionally refresh leads if needed
      } catch (err) {
        alert("Failed to confirm and delete lead: " + (err instanceof Error ? err.message : String(err)));
      }
    } else if (action === NotificationAction.REJECT) {
      setPendingRejectNotification(notification);
      setShowRejectionModal(true);
    }
  };

  // Handle rejection reason submit
  const handleRejectSubmit = async () => {
    if (!pendingRejectNotification) return;
    const { leadId, leadName } = pendingRejectNotification.data || {};
    const recipientId = pendingRejectNotification.sender_id;
    try {
      await updateNotification(pendingRejectNotification.id, { read: true });
      await sendNotification({
        type: NotificationType.LEAD_DELETE_REJECTED,
        message: `Your request to delete lead "${leadName}" was rejected.${rejectionReason ? '\nReason: ' + rejectionReason : ''}`,
        recipient_id: recipientId,
        sender_id: profile?.id || '',
        data: { leadId, leadName, reason: rejectionReason },
      });
      setShowRejectionModal(false);
      setRejectionReason('');
      setPendingRejectNotification(null);
      refreshNotifications();
    } catch (err) {
      alert("Failed to reject lead deletion: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  // Handler to open Lead Detail modal from notification
  const handleViewLeadFromNotification = (leadId: string) => {
    setSelectedLeadId(leadId);
  };

  // Async handler for updating lead details
  const handleUpdateLeadDetailsForModal = async (
    leadId: string,
    updates: LeadUpdatePayload,
    actorUserId: string,
    currentLeadData: Lead
  ) => {
    // You may want to call your update service here
    // For now, just update state
    setLeads(prevLeads => prevLeads.map(l => (l.id === leadId ? { ...l, ...updates } : l)));
  };

  // Async handler for deleting a lead
  const handleDeleteLeadForModal = async (
    leadId: string,
    actorUserId: string,
    leadName: string,
    currentAssignedUserId?: string | null
  ) => {
    // You may want to call your delete service here
    setLeads(prevLeads => prevLeads.filter(l => l.id !== leadId));
    setSelectedLeadId(null);
  };

  // Async handler for updating core lead details
  const handleUpdateCoreLeadDetailsForModal = async (
    leadId: string,
    updates: CoreLeadDataUpdate,
    actorUserId: string,
    currentLeadData: Lead
  ) => {
    setLeads(prevLeads => prevLeads.map(l => (l.id === leadId ? { ...l, ...updates } : l)));
  };

  // Async handler for assigning a lead
  const handleAssignLeadForModal = async (
    leadId: string,
    targetUserId: string | null,
    actorUserId: string,
    currentAssignedUserId?: string | null,
    assignedToFullName?: string | null
  ) => {
    setLeads(prevLeads =>
      prevLeads.map(l =>
        l.id === leadId
          ? { ...l, assignedToUserId: targetUserId, assignedToUserFullName: assignedToFullName }
          : l
      )
    );
  };
  
  useEffect(() => {
    // Listen for custom event from SidePanel
    const handleNavigateToSettings = () => {
      if (profile?.role === UserRole.SUPERUSER) {
        setCurrentPage('settings');
      }
    };
    window.addEventListener('navigateToSettings', handleNavigateToSettings);

    // Listen for custom event from SettingsPage side panel back arrow
    const handleNavigateToDashboard = () => {
      setCurrentPage('dashboard');
    };
    window.addEventListener('navigateToDashboard', handleNavigateToDashboard);

    return () => {
      window.removeEventListener('navigateToSettings', handleNavigateToSettings);
      window.removeEventListener('navigateToDashboard', handleNavigateToDashboard);
    };
  }, [profile]);

  try {
    if (loading) {
      return <LoadingSpinner message="Initializing Authentication..." />;
    }

    if (!user) {
      return <LoginPage onLogin={login} />;
    }

    if (!profile) {
      return <LoadingSpinner message="Loading user profile..." />;
    }

    // Main application content
    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-white dark:bg-zinc-950 relative">
      {/* Notification Bell and Panel (always top-right, both desktop and mobile) */}
      <div className="fixed top-4 right-4 z-50 flex flex-col items-end">
        {isMobile ? (
          <MobileNotificationDropdown />
        ) : (
          <NotificationBell onClick={() => setNotificationPanelOpen(true)} />
        )}
        <NotificationPanel
          isOpen={isNotificationPanelOpen}
          onClose={() => setNotificationPanelOpen(false)}
          onAction={updateNotification}
          currentUserId={user?.id || ''}
        />
      </div>
      {/* Only show SidePanel if not on settings page */}
      {currentPage !== 'settings' && (
        <SidePanel
          currentPage={currentPage}
          onNavigateToDashboard={navigateToDashboard}
          onNavigateToLeadFlow={navigateToLeadFlow}
          onNavigateToUsersPage={navigateToUsersPage}
          userEmail={user?.email}
          userRole={profile?.role}
          onSignOut={handleSignOut}
        />
      )}
      <main className="flex-1 min-w-0"> 
          {currentPage === 'dashboard' && (
            <DashboardPage
              initialStageFilter={dashboardStageFilter}
              leads={leads}
              isLoading={isLoadingLeads} 
              error={leadsError} 
              onUpdateLeadDetailsInApp={handleUpdateLeadDetailsInApp} 
              clearInitialStageFilter={() => setDashboardStageFilter(null)}
              userProfile={profile} 
              actorUserProfile={profile} 
              onDeleteLeadInApp={handleDeleteLeadInApp}
              onUpdateCoreLeadDetailsInApp={handleUpdateCoreLeadDetailsInApp}
              onAssignLeadInApp={handleAssignLeadInApp} 
              basicUserProfilesList={basicUserProfilesList} 
              isLoadingBasicUsers={isLoadingBasicUsers}
            />
          )}
          {currentPage === 'leadFlow' && (
            <LeadFlowPage 
                navigateToFilteredLeadsPage={navigateToFilteredLeadsPage} 
                leads={leads} 
                isLoading={isLoadingLeads} 
                error={leadsError} 
                userProfile={profile} 
                selectedLeadId={selectedLeadId}
                setSelectedLeadId={setSelectedLeadId}
            />
          )}
          {currentPage === 'filteredLeads' && (filteredLeadStage || filteredLeadsTag) && (
            <FilteredLeadsPage
              stage={filteredLeadStage}
              tag={filteredLeadsTag}
              leads={leads}
              isLoading={isLoadingLeads}
              error={leadsError}
              onUpdateLeadDetailsInApp={handleUpdateLeadDetailsInApp}
              onNavigateBack={navigateToLeadFlow}
              userProfile={profile} 
              actorUserProfile={profile} 
              onDeleteLeadInApp={handleDeleteLeadInApp}
              onUpdateCoreLeadDetailsInApp={handleUpdateCoreLeadDetailsInApp}
              onAssignLeadInApp={handleAssignLeadInApp} 
              basicUserProfilesList={basicUserProfilesList} 
              isLoadingBasicUsers={isLoadingBasicUsers}
            />
          )}
          {currentPage === 'users' && profile.role === UserRole.SUPERUSER && (
            <UsersPage
              profiles={userProfiles}
              isLoading={isLoadingUserProfiles}
              error={userProfilesError}
              onNavigateToUserDetail={navigateToUserDetailPage}
            />
          )}
          {currentPage === 'userDetail' && selectedUserForDetailPage && profile.role === UserRole.SUPERUSER && (
            <UserDetailPage
                selectedUser={selectedUserForDetailPage}
                logs={currentUserActivityLogs}
                isLoadingLogs={isLoadingActivityLogs}
                logsError={activityLogsError}
                onNavigateBack={navigateToUsersPage}
            />
          )}
          {currentPage === 'settings' && profile?.role === UserRole.SUPERUSER && (
            <SettingsPage userProfile={profile} />
          )}
           {(currentPage === 'users' || currentPage === 'userDetail') && profile.role !== UserRole.SUPERUSER && (
            <div className="p-6 md:p-10">
              <ErrorDisplay title="Access Denied" message="You do not have permission to view this page." />
            </div>
          )}
        </main>
        {selectedLead && (
          <LeadDetailModal
            lead={selectedLead}
            isOpen={!!selectedLead}
            onClose={() => setSelectedLeadId(null)}
            onUpdateLeadDetails={handleUpdateLeadDetailsForModal}
            userProfile={profile}
            actorUserProfile={profile}
            onDeleteLead={handleDeleteLeadForModal}
            onUpdateCoreLeadDetails={handleUpdateCoreLeadDetailsForModal}
            onAssignLead={handleAssignLeadForModal}
            basicUsers={basicUserProfilesList}
            isLoadingBasicUsers={isLoadingBasicUsers}
            userProfiles={userProfiles}
          />
        )}
      </div>
    );
  } catch (e) {
    console.error("[App.tsx] CRITICAL RENDER ERROR in App component:", e);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-red-50 text-red-700 dark:bg-red-950/70 dark:text-red-200">
        <h1 className="text-2xl font-bold mb-4">Application Error</h1>
        <p>A critical error occurred while trying to render the application.</p>
        <p>Please check the browser console for details. Try refreshing the page or signing out.</p>
        <pre className="mt-4 text-left text-xs bg-white dark:bg-zinc-800 p-3 border border-red-300 dark:border-red-700 rounded whitespace-pre-wrap w-full max-w-2xl overflow-auto">
          {e instanceof Error ? e.stack : String(e)}
        </pre>
         <div className="mt-6 space-y-3 sm:space-y-0 sm:flex sm:space-x-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            >
              Refresh Page
            </button>
            {user && ( 
              <button
                onClick={handleSignOut}
                className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium text-red-600 hover:text-red-700 bg-red-100 hover:bg-red-200 rounded-lg dark:text-red-300 dark:bg-red-700/50 dark:hover:bg-red-600/50 focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400"
              >
                Sign Out
              </button>
            )}
          </div>
      </div>
    );
  }
};

export default App;
