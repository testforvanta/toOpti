import React, { useState, useEffect, useRef } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { NotificationType, NotificationAction, Notification } from '../types';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (notification: Notification, action: NotificationAction, reason?: string) => void;
  currentUserId: string;
  onViewLead?: (leadId: string) => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose, onAction, currentUserId, onViewLead }) => {
  const { notifications, markAsRead, clearAllNotifications } = useNotifications();
  const [dismissingIds, setDismissingIds] = useState<string[]>([]);
  const [clearedIds, setClearedIds] = useState<string[]>([]);
  const [newlyAddedIds, setNewlyAddedIds] = useState<string[]>([]);
  const prevIdsRef = useRef<string[]>([]);

  // Detect new notifications for animation
  useEffect(() => {
    const prevIds = prevIdsRef.current;
    const currentIds = notifications.map(n => n.id);
    const newIds = currentIds.filter(id => !prevIds.includes(id));
    if (newIds.length > 0) {
      setNewlyAddedIds(ids => [...ids, ...newIds]);
      setTimeout(() => {
        setNewlyAddedIds(ids => ids.filter(id => !newIds.includes(id)));
      }, 500); // match animation duration
    }
    prevIdsRef.current = currentIds;
  }, [notifications]);

  // Use clearAllNotifications for the Clear All button
  const handleClearAll = () => {
    const ids = notifications.map(n => n.id);
    setDismissingIds(ids);
    setTimeout(() => {
      setClearedIds(ids); // Remove from DOM after animation
      clearAllNotifications();
      setDismissingIds([]);
    }, 400); // 400ms matches the CSS transition
  };

  return (
    <aside className={`fixed top-0 right-0 h-full w-80 bg-white dark:bg-zinc-900 shadow-lg z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      aria-label="Notifications"
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-700">
        <h2 className="text-lg font-bold text-blue-600 dark:text-blue-400">Notifications</h2>
        <div className="flex gap-2 items-center">
          <button
            onClick={handleClearAll}
            className="text-xs px-2 py-1 bg-gray-200 dark:bg-zinc-700 rounded hover:bg-gray-300 dark:hover:bg-zinc-600 text-gray-700 dark:text-zinc-200"
          >
            Clear All
          </button>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 dark:hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <div className="overflow-y-auto h-[calc(100%-56px)] p-4 space-y-4">
        {notifications.length === 0 && (
          <div className="text-gray-500 dark:text-zinc-400 text-center mt-8">No notifications.</div>
        )}
        {notifications.filter(n => !clearedIds.includes(n.id)).map((n) => (
          <div
            key={n.id}
            className={`rounded-lg p-4 shadow border transition-all duration-500 ease-in-out
              ${n.read ? 'bg-gray-100 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700' : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-700'}
              ${dismissingIds.includes(n.id) ? 'transform translate-x-[120%] opacity-0 pointer-events-none' : ''}
              ${newlyAddedIds.includes(n.id) ? 'animate-slidein' : ''}`}
            style={{ willChange: 'transform, opacity' }}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-blue-700 dark:text-blue-300">{n.type.replace(/_/g, ' ').toUpperCase()}</span>
              <span className="text-xs text-gray-400">{new Date(n.created_at).toLocaleString()}</span>
              {!n.read && (
                <button
                  className="ml-2 text-xs px-2 py-1 bg-gray-200 dark:bg-zinc-700 rounded hover:bg-gray-300 dark:hover:bg-zinc-600 text-gray-700 dark:text-zinc-200"
                  onClick={() => markAsRead(n.id)}
                  title="Mark as read"
                >
                  Mark as Read
                </button>
              )}
            </div>
            <div className="text-gray-800 dark:text-zinc-200 mb-2 whitespace-pre-line">{n.message}</div>
            {/* Action buttons for delete requests (only for superuser, only if unread) */}
            {n.type === NotificationType.LEAD_DELETE_REQUEST && n.recipient_id === currentUserId && !n.read && (
              <div className="flex gap-2 mt-2">
                <button
                  className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 text-sm"
                  onClick={e => { e.stopPropagation(); onAction(n, NotificationAction.CONFIRM); }}
                >
                  Confirm
                </button>
                <button
                  className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 text-sm"
                  onClick={e => { e.stopPropagation(); onAction(n, NotificationAction.REJECT); }}
                >
                  Reject
                </button>
                <button
                  className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm"
                  onClick={e => { e.stopPropagation(); n.data?.leadId && onViewLead && onViewLead(n.data.leadId); }}
                >
                  View Lead
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
};

export default NotificationPanel;
