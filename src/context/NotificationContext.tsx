import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Notification, NotificationType } from '../types';
import { fetchNotificationsForUser, markNotificationAsRead, createNotification, updateNotification, deleteAllNotificationsForUser } from '../../services/dataService';
import { useAuth } from '../../auth/AuthContext';
import { supabase } from '../../services/supabaseClient';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  refreshNotifications: () => void;
  markAsRead: (id: string) => void;
  sendNotification: (notification: Omit<Notification, 'id' | 'created_at' | 'read'>) => Promise<void>;
  updateNotification: (id: string, updates: Partial<Notification>) => Promise<void>;
  markAllAsRead: () => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshNotifications = useCallback(() => {
    if (!user?.id) return;
    setLoading(true);
    fetchNotificationsForUser(user.id)
      .then(setNotifications)
      .finally(() => setLoading(false));
  }, [user?.id]);

  useEffect(() => {
    refreshNotifications();
    // Optionally, poll for new notifications every 30s
    const interval = setInterval(refreshNotifications, 30000);

    // --- Supabase real-time subscription for notifications ---
    let channel: any = null;
    if (user?.id) {
      channel = (supabase as any).channel
        ? supabase.channel('notifications')
        : supabase
            .from(`notifications:recipient_id=eq.${user.id}`)
            .on('*', payload => {
              refreshNotifications();
            })
            .subscribe();
    }
    return () => {
      clearInterval(interval);
      if (channel && channel.unsubscribe) channel.unsubscribe();
    };
  }, [refreshNotifications, user?.id]);

  const markAsRead = (id: string) => {
    markNotificationAsRead(id).then(refreshNotifications);
  };

  const sendNotification = async (notification: Omit<Notification, 'id' | 'created_at' | 'read'>) => {
    await createNotification(notification);
    refreshNotifications();
  };

  const updateNotificationFn = async (id: string, updates: Partial<Notification>) => {
    await updateNotification(id, updates);
    refreshNotifications();
  };

  const markAllAsRead = () => {
    if (!user?.id) return;
    // Mark all unread notifications as read in bulk
    Promise.all(
      notifications.filter(n => !n.read).map(n => markNotificationAsRead(n.id))
    ).then(refreshNotifications);
  };

  const clearAllNotifications = async () => {
    if (!user?.id) return;
    await deleteAllNotificationsForUser(user.id);
    refreshNotifications();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, refreshNotifications, markAsRead, sendNotification, updateNotification: updateNotificationFn, markAllAsRead, clearAllNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
};
