import React, { useState, useEffect, useCallback } from 'react';
import DashboardPage from './components/DashboardPage';
import LeadFlowPage from './components/LeadFlowPage'; 
import SidePanel from './src/components/SidePanel'; 
import FilteredLeadsPage from './components/FilteredLeadsPage'; 
import UsersPage from './components/UsersPage'; 
import UserDetailPage from './components/UserDetailPage';
import { LeadStage, LeadUpdatePayload, UserProfile, Lead, UserRole, NewLeadData, ActivityLog, Page } from './src/types';
import { 
  fetchLeads as fetchLeadsService, 
  fetchUserProfiles as fetchUserProfilesService,
  fetchBasicUserProfiles as fetchBasicUserProfilesService, 
  fetchActivityLogsForUser
} from './services/dataService'; 
import { useAuth } from './auth/AuthContext'; 
import LoginPage from './components/LoginPage'; 
import LoadingSpinner from './components/shared/LoadingSpinner'; 
import ErrorDisplay from './components/shared/ErrorDisplay'; 

export type CoreLeadDataUpdate = Partial<Pick<Lead, 'name' | 'brandName' | 'email' | 'contactNumber' | 'website' | 'typeOfBusiness'>>;

const App: React.FC = () => {
  const { user, profile, signOut: authSignOut, loggedOut } = useAuth(); 

  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [dashboardStageFilter, setDashboardStageFilter] = useState<LeadStage | null>(null);
  const [filteredLeadStage, setFilteredLeadStage] = useState<LeadStage | null>(null); 
  const [filteredLeadTag, setFilteredLeadTag] = useState<string | null>(null); // Added state for tag filtering
  
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

  const refreshLeads = useCallback(async () => {
    if (user && profile) {
      setIsLoadingLeads(true);
      setLeadsError(null);
      try {
        const fetchedLeads = await fetchLeadsService(user.id, profile.role);
        setLeads(fetchedLeads);
      } catch (err) {
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
    }
  }, [user, profile]); 

  useEffect(() => {
    let isMounted = true; 
    if (user && profile) { 
      refreshLeads();
    } else if (!user && !loggedOut) { 
      if (isMounted) { 
           setLeads([]);
           setIsLoadingLeads(false);
           setLeadsError(null);
      }
    }
    return () => { isMounted = false; };
  }, [user, profile, loggedOut, refreshLeads]); 

  useEffect(() => {
    let isMounted = true;
    if (user && profile?.role === UserRole.SUPERUSER) {
      const loadUserProfiles = async () => {
        setIsLoadingUserProfiles(true);
        setUserProfilesError(null);
        try {
          const fetchedProfiles = await fetchUserProfilesService();
          if (isMounted) setUserProfiles(fetchedProfiles);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Error loading user profiles.";
          if (isMounted) setUserProfilesError(message);
        } finally {
          if (isMounted) setIsLoadingUserProfiles(false);
        }
      };
      loadUserProfiles();
    } else {
      setUserProfiles([]);
    }
    return () => { isMounted = false; };
  }, [user, profile]);

  useEffect(() => {
    let isMounted = true;
    if (user && profile?.role === UserRole.SUPERUSER) {
      const loadBasicUsers = async () => {
        setIsLoadingBasicUsers(true);
        try {
          const fetchedBasicUsers = await fetchBasicUserProfilesService();
          if (isMounted) setBasicUserProfilesList(fetchedBasicUsers);
        } catch (err) {
          console.error("App: Error fetching basic user profiles for assignment:", err);
        } finally {
          if (isMounted) setIsLoadingBasicUsers(false);
        }
      };
      loadBasicUsers();
    } else {
      setBasicUserProfilesList([]); 
    }
    return () => { isMounted = false; };
  }, [user, profile]);

  useEffect(() => {
    let isMounted = true;
    if (currentPage === 'userDetail' && selectedUserForDetailPage && profile?.role === UserRole.SUPERUSER) {
      const loadActivityLogs = async () => {
        setIsLoadingActivityLogs(true);
        setActivityLogsError(null);
        try {
          const logs = await fetchActivityLogsForUser(selectedUserForDetailPage.id);
          if (isMounted) setCurrentUserActivityLogs(logs);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Error loading activity logs.";
          if (isMounted) setActivityLogsError(message);
        } finally {
          if (isMounted) setIsLoadingActivityLogs(false);
        }
      };
      loadActivityLogs();
    }
    return () => { isMounted = false; };
  }, [currentPage, selectedUserForDetailPage, profile?.role]);

  const navigateToLeadFlow = useCallback(() => {
    setCurrentPage('leadFlow');
    setDashboardStageFilter(null); 
    setFilteredLeadStage(null);
    setFilteredLeadTag(null); // Clear tag filter
    setSelectedUserForDetailPage(null);
  }, []);

  const navigateToDashboard = useCallback((stage?: LeadStage) => {
    setCurrentPage('dashboard');
    setDashboardStageFilter(stage || null);
    setFilteredLeadStage(null);
    setFilteredLeadTag(null); // Clear tag filter
    setSelectedUserForDetailPage(null);
  }, []);

  // Updated navigateToFilteredLeadsPage function
  const navigateToFilteredLeadsPage = useCallback((filterValue: LeadStage | string) => {
    setCurrentPage('filteredLeads');
    console.log('[App.tsx navigateToFilteredLeadsPage] Received filterValue:', filterValue, 'Type:', typeof filterValue);

    // Ensure LeadStage is imported from './src/types' at the top of App.tsx
    // This check assumes LeadStage is available in this scope.
    const isActualStage = Object.values(LeadStage).includes(filterValue as LeadStage);
    console.log('[App.tsx navigateToFilteredLeadsPage] Is an actual LeadStage enum value?', isActualStage);

    if (isActualStage) {
      console.log('[App.tsx navigateToFilteredLeadsPage] Setting as STAGE filter:', filterValue);
      setFilteredLeadStage(filterValue as LeadStage);
      setFilteredLeadTag(null);
    } else if (typeof filterValue === 'string') { 
      // This condition now correctly identifies strings that are NOT LeadStage enum values
      console.log('[App.tsx navigateToFilteredLeadsPage] Setting as TAG filter:', filterValue);
      setFilteredLeadStage(null);
      setFilteredLeadTag(filterValue);
    } else {
      // This case should ideally not be reached if filterValue type is LeadStage | string
      console.warn("[App.tsx navigateToFilteredLeadsPage] Unexpected filterValue type. Clearing filters.", filterValue);
      setFilteredLeadStage(null);
      setFilteredLeadTag(null);
    }

    setDashboardStageFilter(null);
    setSelectedUserForDetailPage(null);
  }, []);

  const navigateToUsersPage = useCallback(() => {
    if (profile?.role === UserRole.SUPERUSER) {
      setCurrentPage('users');
      setDashboardStageFilter(null);
      setFilteredLeadStage(null);
      setFilteredLeadTag(null);
      setSelectedUserForDetailPage(null);
    } else {
      navigateToDashboard(); 
    }
  }, [profile?.role, navigateToDashboard]);

  const navigateToUserDetailPage = useCallback((userToView: UserProfile) => {
    if (profile?.role === UserRole.SUPERUSER) {
      setSelectedUserForDetailPage(userToView);
      setCurrentPage('userDetail');
      setDashboardStageFilter(null);
      setFilteredLeadStage(null);
      setFilteredLeadTag(null);
    }
  }, [profile?.role]);
  
  const handleUpdateLeadDetailsInApp = useCallback((leadId: string, updates: LeadUpdatePayload) => {
    setLeads(prevLeads =>
      prevLeads.map(l => {
        if (l.id === leadId) {
          const updatedLead = { ...l, ...updates };
          if (updates.paymentDetails === null) { 
             updatedLead.paymentDetails = undefined;
          }
          return updatedLead;
        }
        return l;
      })
    );
  }, []);

  const handleUpdateCoreLeadDetailsInApp = useCallback((leadId: string, updates: CoreLeadDataUpdate) => {
    setLeads(prevLeads => 
      prevLeads.map(l => (l.id === leadId ? { ...l, ...updates } : l))
    );
  }, []);

  const handleDeleteLeadInApp = useCallback((leadId: string) => {
    setLeads(prevLeads => prevLeads.filter(l => l.id !== leadId));
  }, []);

  const handleAddNewLeadToState = useCallback((newLead: Lead) => {
    setLeads(prevLeads => {
      if (profile?.role === UserRole.BASIC_USER) {
        if (newLead.assignedToUserId === user?.id) {
          return [newLead, ...prevLeads];
        }
        return prevLeads;
      } else { 
        return [newLead, ...prevLeads]; 
      }
    });
  }, [profile?.role, user?.id]);

  const handleAssignLeadInApp = useCallback((leadId: string, assignedToUserId: string | null, assignedToUserFullName?: string | null) => {
    setLeads(prevLeads => {
      const updatedLeads = prevLeads.map(l =>
        l.id === leadId 
        ? { ...l, assignedToUserId: assignedToUserId, assignedToUserFullName: assignedToUserFullName } 
        : l
      );
      if (profile?.role === UserRole.BASIC_USER && user?.id) {
        if (assignedToUserId !== user.id && prevLeads.some(l => l.id === leadId && l.assignedToUserId === user.id)) {
          return updatedLeads.filter(l => l.id !== leadId || l.assignedToUserId === user.id);
        }
      }
      return updatedLeads;
    });
  }, [profile?.role, user?.id]);
  
  const handleSignOut = useCallback(async () => {
    await authSignOut();
  }, [authSignOut]);

  try {
    if (loggedOut) { 
      return <LoginPage />;
    }

    if (!profile) {
      console.error("[App.tsx] Rendering: User exists, authLoading is false, BUT NO PROFILE.");
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-gray-100 dark:bg-zinc-900">
          <ErrorDisplay
            title="Profile Load Failed"
            message="We couldn't load your user profile. This is likely due to a network timeout when connecting to the database, or a configuration issue. Please check your browser's developer console for detailed error messages."
          />
          <div className="mt-6 space-y-3 sm:space-y-0 sm:flex sm:space-x-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            >
              Refresh Page
            </button>
            <button
              onClick={handleSignOut}
              className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium text-red-600 hover:text-red-700 bg-red-100 hover:bg-red-200 rounded-lg dark:text-red-300 dark:bg-red-700/50 dark:hover:bg-red-600/50 focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400"
            >
              Sign Out & Retry Login
            </button>
          </div>
           <p className="mt-8 text-xs text-gray-500 dark:text-zinc-400">
            If timeouts persist, please investigate your Supabase 'profiles' table RLS policies and database performance.
          </p>
        </div>
      );
    }

    return (
      <div className="flex min-h-screen bg-white dark:bg-zinc-950"> 
        <SidePanel 
          currentPage={currentPage} 
          onNavigateToDashboard={navigateToDashboard} 
          onNavigateToLeadFlow={navigateToLeadFlow}
          onNavigateToUsersPage={navigateToUsersPage} 
          userEmail={user.email} 
          userRole={profile.role} 
          onSignOut={handleSignOut} 
        />
        <main className="flex-1 overflow-x-auto"> 
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
            />
          )}
          {/* Updated FilteredLeadsPage rendering */}
          {currentPage === 'filteredLeads' && (filteredLeadStage || filteredLeadTag) && (
            <FilteredLeadsPage
              stage={filteredLeadStage} 
              tag={filteredLeadTag}     
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
           {(currentPage === 'users' || currentPage === 'userDetail') && profile.role !== UserRole.SUPERUSER && (
            <div className="p-6 md:p-10">
              <ErrorDisplay title="Access Denied" message="You do not have permission to view this page." />
            </div>
          )}
        </main>
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
