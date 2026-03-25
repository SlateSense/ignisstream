"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'comment_like';
  actor_id: string;
  recipient_id: string;
  post_id?: string;
  comment_id?: string;
  created_at: string;
  read: boolean;
  actor: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
  };
  post?: {
    id: string;
    caption?: string;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  loadNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export default function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();

  // Set up real-time subscription only (don't auto-load notifications)
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Set up real-time subscription for new notifications
    const supabase = createClient();
    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `recipient_id=eq.${user.id}`
        }, 
        (payload) => {
          handleNewNotification(payload.new as any);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          id,
          type,
          actor_id,
          recipient_id,
          post_id,
          comment_id,
          created_at,
          read,
          actor:profiles!actor_id(id, username, display_name, avatar_url),
          post:posts(id, caption)
        `)
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const processedNotifications = (data || []).map(notification => ({
        ...notification,
        actor: Array.isArray(notification.actor) ? notification.actor[0] : notification.actor,
        post: Array.isArray(notification.post) ? notification.post[0] : notification.post,
      }));

      setNotifications(processedNotifications);
      setUnreadCount(processedNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleNewNotification = async (newNotification: any) => {
    try {
      const supabase = createClient();
      
      // Fetch the complete notification with relations
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          id,
          type,
          actor_id,
          recipient_id,
          post_id,
          comment_id,
          created_at,
          read,
          actor:profiles!actor_id(id, username, display_name, avatar_url),
          post:posts(id, caption)
        `)
        .eq('id', newNotification.id)
        .single();

      if (error) throw error;

      const processedNotification = {
        ...data,
        actor: Array.isArray(data.actor) ? data.actor[0] : data.actor,
        post: Array.isArray(data.post) ? data.post[0] : data.post,
      };

      // Add to notifications list
      setNotifications(prev => [processedNotification, ...prev.slice(0, 49)]);
      setUnreadCount(prev => prev + 1);

      // Show toast notification
      const notificationText = getNotificationText(processedNotification);
      toast({
        title: "New notification",
        description: notificationText,
      });
    } catch (error) {
      console.error('Error handling new notification:', error);
    }
  };

  const getNotificationText = (notification: Notification): string => {
    const actorName = notification.actor.display_name;
    
    switch (notification.type) {
      case 'like':
        return `${actorName} liked your post`;
      case 'comment':
        return `${actorName} commented on your post`;
      case 'follow':
        return `${actorName} started following you`;
      case 'comment_like':
        return `${actorName} liked your comment`;
      default:
        return `${actorName} interacted with your content`;
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)
        .eq('recipient_id', user?.id);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('recipient_id', user?.id)
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)
        .eq('recipient_id', user?.id);

      if (error) throw error;

      const deletedNotification = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadNotifications, // Expose this so components can load when needed
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
