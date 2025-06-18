import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { UserRole, Page } from '../src/types'; // Import UserRole and Page

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
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-3">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m10-7.13a4 4 0 11-8 0 4 4 0 018 0zm6 10v2a2 2 0 01-2 2h-6a2 2 0 01-2-2v-2m6 0a6 6 0 00-12 0v2a2 2 0 002 2h6a2 2 0 002-2v-2" />
  </svg>
);


const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-3">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navButtonBaseClasses = "w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-1 dark:focus:ring-offset-zinc-950";
  const activeClasses = "bg-blue-600 text-white shadow-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600";
  const inactiveClasses = "text-gray-700 hover:bg-gray-200/60 hover:text-gray-900 dark:text-zinc-300 dark:hover:bg-zinc-700/70 dark:hover:text-zinc-100";
  
  const themeButtonClasses = "w-full flex items-center justify-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-1 dark:focus:ring-offset-zinc-950 text-gray-700 hover:bg-gray-200/60 hover:text-gray-900 dark:text-yellow-400 dark:hover:bg-zinc-700/70 dark:hover:text-yellow-300";
  const logoutButtonClasses = "w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:ring-offset-1 dark:focus:ring-offset-zinc-950 text-red-600 hover:bg-red-100/60 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-700/30 dark:hover:text-red-300";

  const HamburgerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  );

  const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  return (
    <>
      {/* Hamburger Menu Button - visible only on small screens */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white/70 dark:bg-zinc-800/70 backdrop-blur-sm rounded-md text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
        aria-expanded={isMobileMenuOpen}
      >
        {isMobileMenuOpen ? <CloseIcon /> : <HamburgerIcon />}
      </button>

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        ></div>
      )}

      {/* Side Panel */}
      <aside 
        className={`
          fixed top-0 left-0 h-screen z-40 
          bg-white/60 dark:bg-zinc-900/70 backdrop-blur-lg shadow-xl 
          p-4 flex flex-col border-r border-gray-200/60 dark:border-zinc-800/70
          transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0 w-72 sm:w-80' : '-translate-x-full w-72 sm:w-80'}
          md:sticky md:translate-x-0 md:w-60 md:shadow-lg
        `}
      >
        {/* Close button inside panel for mobile */}
        <div className="md:hidden flex justify-end mb-2">
            <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-gray-600 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200"
                aria-label="Close menu"
            >
                <CloseIcon />
            </button>
        </div>
        
        <div className="mb-8 mt-0 md:mt-2 text-center"> {/* Adjusted mt-0 for mobile, md:mt-2 for desktop */}
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
          onClick={() => { onNavigateToDashboard(); if (window.innerWidth < 768) setIsMobileMenuOpen(false); }}
          className={`${navButtonBaseClasses} ${currentPage === 'dashboard' ? activeClasses : inactiveClasses}`}
          aria-current={currentPage === 'dashboard' ? 'page' : undefined}
        >
          <DashboardIcon />
          Dashboard
        </button>
        <button
          onClick={() => { onNavigateToLeadFlow(); if (window.innerWidth < 768) setIsMobileMenuOpen(false); }}
          className={`${navButtonBaseClasses} ${currentPage === 'leadFlow' || currentPage === 'filteredLeads' ? activeClasses : inactiveClasses}`}
          aria-current={currentPage === 'leadFlow' || currentPage === 'filteredLeads' ? 'page' : undefined}
        >
          <LeadFlowIcon />
          Lead Flow
        </button>
        {userRole === UserRole.SUPERUSER && (
          <button
            onClick={() => { onNavigateToUsersPage(); if (window.innerWidth < 768) setIsMobileMenuOpen(false); }}
            className={`${navButtonBaseClasses} ${currentPage === 'users' || currentPage === 'userDetail' ? activeClasses : inactiveClasses}`}
            aria-current={currentPage === 'users' || currentPage === 'userDetail' ? 'page' : undefined}
          >
            <UsersIcon />
            Users
          </button>
        )}
      </nav>
      
      <div className="mt-auto pt-4 border-t border-gray-200/60 dark:border-zinc-700/60 space-y-2">
        {/* User Info, Sign Out, Theme Toggle */}
        {userEmail && (
          <div className="px-2 py-2 text-center text-xs text-gray-600 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700 rounded-md bg-gray-50 dark:bg-zinc-800">
            <p className="font-medium truncate" title={userEmail}>{userEmail}</p>
            {userRole && <p className="capitalize text-blue-600 dark:text-blue-400 font-semibold">{userRole.replace('_', ' ')}</p>}
          </div>
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
    </>
  );
});

export default SidePanel;
