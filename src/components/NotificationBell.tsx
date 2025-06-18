import React from 'react';
import { useNotifications } from '../context/NotificationContext';

interface NotificationBellProps {
  onClick: () => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ onClick }) => {
  const { unreadCount } = useNotifications();
  return (
    <button onClick={onClick} className="relative p-2 rounded-full hover:bg-blue-100 dark:hover:bg-zinc-800 focus:outline-none">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-blue-600 dark:text-blue-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a2.25 2.25 0 01-5.714 0M21 19.5v-6.75A7.5 7.5 0 006.798 4.868 2.25 2.25 0 004.5 7.5v5.25c0 .414-.336.75-.75.75s-.75-.336-.75-.75V7.5a4.5 4.5 0 019 0v5.25c0 .414-.336.75-.75.75s-.75-.336-.75-.75V7.5a2.25 2.25 0 00-2.25-2.25A7.5 7.5 0 0021 12.75v6.75z" />
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
