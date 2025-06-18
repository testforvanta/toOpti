import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { UserRole, Page } from '../types'; // Import UserRole and Page

// Page type is now imported from types.ts

interface SidePanelProps {
  currentPage: Page;
  onNavigateToDashboard: () => void;
  onNavigateToLeadFlow: () => void;
  onNavigateToUsersPage: () => void; // New prop for Users page navigation
  userEmail?: string;
  userRole?: UserRole;
  onSignOut?: () => Promise<void>;
}

const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
  </svg>
);

const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
  </svg>
);

const DashboardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
);

const LeadFlowIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
);

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-3">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372m-10.75 L5.25 19.5c0 .378.04.746.115 1.106M17.25 10.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 19.5a9 9 0 1015 0H4.5z" />
  </svg>
);


const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-3">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
  </svg>
);

const BackArrowIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

const SidePanel: React.FC<SidePanelProps> = React.memo(({ 
    currentPage, 
    onNavigateToDashboard, 
    onNavigateToLeadFlow,
    onNavigateToUsersPage,
    userEmail,
    userRole,
    onSignOut 
}) => {
  const { theme, toggleTheme } = useTheme();

  const navButtonBaseClasses = "w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-1 dark:focus:ring-offset-zinc-950";
  const activeClasses = "bg-blue-600 text-white shadow-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600";
  const inactiveClasses = "text-gray-700 hover:bg-gray-200/60 hover:text-gray-900 dark:text-zinc-300 dark:hover:bg-zinc-700/70 dark:hover:text-zinc-100";
  
  const themeButtonClasses = "w-full flex items-center justify-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-1 dark:focus:ring-offset-zinc-950 text-gray-700 hover:bg-gray-200/60 hover:text-gray-900 dark:text-yellow-400 dark:hover:bg-zinc-700/70 dark:hover:text-yellow-300";
  const logoutButtonClasses = "w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:ring-offset-1 dark:focus:ring-offset-zinc-950 text-red-600 hover:bg-red-100/60 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-700/30 dark:hover:text-red-300";

  return (
    <aside className="w-60 h-screen sticky top-0 bg-white/50 dark:bg-zinc-900/60 backdrop-blur-lg shadow-lg p-4 flex flex-col border-r border-gray-200/60 dark:border-zinc-800/70">
      {/* Back arrow for settings page */}
      {currentPage === 'settings' && (
        <button
          onClick={onNavigateToDashboard}
          className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-4 focus:outline-none"
          aria-label="Back to Dashboard"
        >
          <BackArrowIcon />
          <span className="ml-2 font-medium">Back to Dashboard</span>
        </button>
      )}
      <div className="mb-8 mt-2 text-center">
        <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400 flex items-center justify-center">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 mr-2">
             <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
           </svg>
             Clarity Lead CRM
        </h1>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">Workflow Analytics</p>
      </div>
      
      <nav className="flex-grow space-y-3">
        <button
          onClick={onNavigateToDashboard}
          className={`${navButtonBaseClasses} ${currentPage === 'dashboard' ? activeClasses : inactiveClasses}`}
          aria-current={currentPage === 'dashboard' ? 'page' : undefined}
        >
          <DashboardIcon />
          Dashboard
        </button>
        <button
          onClick={onNavigateToLeadFlow}
          className={`${navButtonBaseClasses} ${currentPage === 'leadFlow' || currentPage === 'filteredLeads' ? activeClasses : inactiveClasses}`}
          aria-current={currentPage === 'leadFlow' || currentPage === 'filteredLeads' ? 'page' : undefined}
        >
          <LeadFlowIcon />
          Lead Flow
        </button>
        {userRole === UserRole.SUPERUSER && (
          <button
            onClick={onNavigateToUsersPage}
            className={`${navButtonBaseClasses} ${currentPage === 'users' || currentPage === 'userDetail' ? activeClasses : inactiveClasses}`}
            aria-current={currentPage === 'users' || currentPage === 'userDetail' ? 'page' : undefined}
          >
            <UsersIcon />
            Users
          </button>
        )}
      </nav>
      
      <div className="mt-auto pt-4 border-t border-gray-200/60 dark:border-zinc-700/60 space-y-2">
        {userEmail && (
          <div className="px-2 py-2 text-center text-xs text-gray-600 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700 rounded-md bg-gray-50 dark:bg-zinc-800">
            <p className="font-medium truncate" title={userEmail}>{userEmail}</p>
            {userRole && <p className="capitalize text-blue-600 dark:text-blue-400 font-semibold">{userRole.replace('_', ' ')}</p>}
          </div>
        )}
        {/* Settings button for SuperUser only */}
        {userRole === UserRole.SUPERUSER && (
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                const event = new CustomEvent('navigateToSettings');
                window.dispatchEvent(event);
              }
            }}
            className={navButtonBaseClasses + ' bg-gray-100 dark:bg-zinc-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-700/30 mb-2'}
            aria-label="Settings"
            style={{ marginBottom: '0.5rem' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Settings
          </button>
        )}
        {onSignOut && (
          <button
            onClick={onSignOut}
            className={logoutButtonClasses}
            aria-label="Sign out"
          >
            <LogoutIcon />
            Logout
          </button>
        )}
        <button
          onClick={toggleTheme}
          className={themeButtonClasses}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <MoonIcon /> : <SunIcon />}
          <span className="ml-2">{theme === 'light' ? 'Dark' : 'Light'} Mode</span>
        </button>
      </div>
    </aside>
  );
});

export default SidePanel;
