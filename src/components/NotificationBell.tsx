import React from 'react';
import { useNotifications } from '../context/NotificationContext';

interface NotificationBellProps {
  onClick: () => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ onClick }) => {
  const { unreadCount } = useNotifications();
  return (
    <button onClick={onClick} className="relative p-2 rounded-full hover:bg-blue-100 dark:hover:bg-zinc-800 focus:outline-none">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-blue-600 dark:text-blue-400"> {/* Changed fill, removed strokeWidth */}
        <path fillRule="evenodd" d="M12 6.75a5.25 5.25 0 015.25 5.25v.75A2.251 2.251 0 0019.5 15v.75a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 15.75V15a2.251 2.251 0 002.25-2.25v-.75A5.25 5.25 0 0112 6.75zM12.75 18a.75.75 0 00-1.5 0v.068A2.252 2.252 0 0012 20.25a2.252 2.252 0 00.75-2.182V18z" clipRule="evenodd" />
      </svg>
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full transform translate-x-1/2 -translate-y-1/2">
          {unreadCount}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;
