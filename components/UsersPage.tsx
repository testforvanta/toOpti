import React, { useMemo, useState } from 'react';
import { UserProfile, UserRole } from '../src/types';
import LoadingSpinner from './shared/LoadingSpinner';
import ErrorDisplay from './shared/ErrorDisplay';
import GlassContainer from './shared/GlassContainer';
import { useTheme } from '../context/ThemeContext';

interface UsersPageProps {
  profiles: UserProfile[];
  isLoading: boolean;
  error: string | null;
  onNavigateToUserDetail: (user: UserProfile) => void; // New prop
}

const UsersPage: React.FC<UsersPageProps> = ({ profiles, isLoading, error, onNavigateToUserDetail }) => {
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProfiles = useMemo(() => {
    if (!searchTerm) {
      return profiles;
    }
    return profiles.filter(profile =>
      (profile.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      profile.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (profile.designation?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );
  }, [profiles, searchTerm]);

  const formatRole = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPERUSER:
        return 'Superuser';
      case UserRole.BASIC_USER:
        return 'Basic User';
      default:
        const roleString = role as string;
        return roleString.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
  };

  const getRolePillStyle = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPERUSER:
        return 'bg-red-100 text-red-700 border border-red-300 dark:bg-red-800/50 dark:text-red-200 dark:border-red-700';
      case UserRole.BASIC_USER:
        return 'bg-sky-100 text-sky-700 border border-sky-300 dark:bg-sky-800/50 dark:text-sky-200 dark:border-sky-700';
      default:
        return 'bg-gray-100 text-gray-600 border border-gray-300 dark:bg-zinc-700/50 dark:text-zinc-300 dark:border-zinc-600';
    }
  };


  if (isLoading) {
    return <LoadingSpinner message="Loading User Profiles..." />;
  }

  if (error && !profiles.length) {
    return <div className="p-6 md:p-10"><ErrorDisplay message={error} title="User Profiles Data Error:" /></div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-screen-2xl mx-auto space-y-8">
      <header className="pb-6 border-b border-gray-300/50 dark:border-zinc-800/60">
        <h1 className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 md:h-9 md:w-9 mr-3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372m-10.75 L5.25 19.5c0 .378.04.746.115 1.106M17.25 10.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 19.5a9 9 0 1015 0H4.5z" />
          </svg>
          User Management
        </h1>
        <p className="text-gray-500 dark:text-zinc-400 mt-2">View and manage user profiles. Click on a user to view details and activity logs.</p>
      </header>

      {error && profiles.length > 0 && <ErrorDisplay message={error} title="User Profiles Data Warning:" />}

      <GlassContainer>
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search users by name, email, role, or designation..."
            className="w-full md:w-2/3 p-3 rounded-lg bg-gray-50 text-gray-700 border border-gray-300 
                       dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700 dark:placeholder-zinc-500
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 placeholder-gray-400
                       transition-all duration-300 ease-in-out shadow-sm focus:shadow-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search users"
          />
        </div>

        {filteredProfiles.length === 0 && !searchTerm && (
          <p className="text-gray-500 dark:text-zinc-400 text-center py-10">No user profiles found.</p>
        )}
        {filteredProfiles.length === 0 && searchTerm && (
          <p className="text-gray-500 dark:text-zinc-400 text-center py-10">
            No users found matching: <span className="font-semibold text-blue-600 dark:text-blue-400">{searchTerm}</span>
          </p>
        )}

        {filteredProfiles.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-gray-200/80 dark:border-zinc-800/70">
            <table className="min-w-full divide-y divide-gray-200/80 dark:divide-zinc-800/70">
              <thead className="bg-gray-50/70 backdrop-blur-sm dark:bg-zinc-900/80">
                <tr>
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Email</th>
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Role</th>
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Designation</th>
                  <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/80 dark:divide-zinc-800/70 bg-white dark:bg-zinc-900/60">
                {filteredProfiles.map((profile) => (
                  <tr 
                    key={profile.id} 
                    className="hover:bg-blue-50/70 dark:hover:bg-zinc-800/60 transition-colors duration-150 ease-in-out cursor-pointer"
                    onClick={() => onNavigateToUserDetail(profile)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onNavigateToUserDetail(profile);}}
                    tabIndex={0}
                    aria-label={`View details for ${profile.full_name || profile.email}`}
                  >
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-zinc-100">{profile.full_name || <span className="italic text-gray-400 dark:text-zinc-500">No Name Set</span>}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-zinc-300">{profile.email}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRolePillStyle(profile.role)}`}>
                        {formatRole(profile.role)}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-zinc-300">{profile.designation || <span className="italic text-gray-400 dark:text-zinc-500">N/A</span>}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-zinc-300">
                      {profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassContainer>

      <footer className="text-center py-8 text-gray-400 dark:text-zinc-500 border-t border-gray-300/50 dark:border-zinc-800/60 mt-8">
        User Management Panel &copy; {new Date().getFullYear()}.
      </footer>
    </div>
  );
};

export default UsersPage;
