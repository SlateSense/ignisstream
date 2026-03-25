"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  conversation_id: string;
  created_at: string;
  read: boolean;
  sender: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
  };
}

interface Conversation {
  id: string;
  participants: string[];
  last_message_id?: string;
  created_at: string;
  updated_at: string;
  participant_profiles: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
  }[];
  last_message?: Message;
  unread_count: number;
}

interface MessageContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  setActiveConversation: (conversation: Conversation | null) => void;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  createConversation: (userId: string) => Promise<Conversation>;
  markAsRead: (conversationId: string) => Promise<void>;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const useMessages = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
};

interface MessageProviderProps {
  children: ReactNode;
}

export default function MessageProvider({ children }: MessageProviderProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversationState] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load conversations when user changes
  useEffect(() => {
    if (!user) {
      setConversations([]);
      setActiveConversationState(null);
      setMessages([]);
      return;
    }

    // Delay loading to avoid blocking initial render
    const timer = setTimeout(() => {
      loadConversations();
    }, 200);

    return () => clearTimeout(timer);
  }, [user]);

  // Set up real-time subscriptions for messages
  useEffect(() => {
    if (!user) return;

    const supabase = createClient();
    
    // Subscribe to new messages
    const messageSubscription = supabase
      .channel('messages')
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          handleNewMessage(payload.new as any);
        }
      )
      .subscribe();

    return () => {
      messageSubscription.unsubscribe();
    };
  }, [user, activeConversation]);

  const loadConversations = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const supabase = createClient();
      
      // Get conversations where user is a participant
      const { data: conversationData, error } = await supabase
        .from('conversations')
        .select(`
          id,
          participants,
          last_message_id,
          created_at,
          updated_at,
          messages!last_message_id(
            id,
            content,
            sender_id,
            created_at,
            sender:profiles!sender_id(id, username, display_name, avatar_url)
          )
        `)
        .contains('participants', [user.id])
        .order('updated_at', { ascending: false });

      if (error) {
        // Silently fail if table doesn't exist yet
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          console.log('Conversations table not ready yet');
          setConversations([]);
          setLoading(false);
          return;
        }
        throw error;
      }

      // Process conversations and get participant profiles
      const processedConversations = await Promise.all(
        (conversationData || []).map(async (conv: any) => {
          // Get other participants' profiles
          const otherParticipants = conv.participants.filter((id: string) => id !== user.id);
          
          const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id, username, display_name, avatar_url')
            .in('id', otherParticipants);

          if (profileError) throw profileError;

          // Get unread message count
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('read', false)
            .neq('sender_id', user.id);

          return {
            ...conv,
            participant_profiles: profiles || [],
            last_message: Array.isArray(conv.messages) ? conv.messages[0] : conv.messages,
            unread_count: unreadCount || 0
          };
        })
      );

      setConversations(processedConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: "Error loading conversations",
        description: "Unable to load conversations. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          sender_id,
          conversation_id,
          created_at,
          read,
          sender:profiles!sender_id(id, username, display_name, avatar_url)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const processedMessages = (data || []).map(message => ({
        ...message,
        sender: Array.isArray(message.sender) ? message.sender[0] : message.sender
      }));

      setMessages(processedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error loading messages",
        description: "Unable to load messages. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const setActiveConversation = async (conversation: Conversation | null) => {
    setActiveConversationState(conversation);
    
    if (conversation) {
      await loadMessages(conversation.id);
      await markAsRead(conversation.id);
    } else {
      setMessages([]);
    }
  };

  const handleNewMessage = async (newMessage: any) => {
    try {
      const supabase = createClient();
      
      // Fetch the complete message with sender profile
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          sender_id,
          conversation_id,
          created_at,
          read,
          sender:profiles!sender_id(id, username, display_name, avatar_url)
        `)
        .eq('id', newMessage.id)
        .single();

      if (error) throw error;

      const processedMessage = {
        ...data,
        sender: Array.isArray(data.sender) ? data.sender[0] : data.sender
      };

      // Add to messages if it's for the active conversation
      if (activeConversation && processedMessage.conversation_id === activeConversation.id) {
        setMessages(prev => [...prev, processedMessage]);
        
        // Mark as read if it's the active conversation
        if (processedMessage.sender_id !== user?.id) {
          await markAsRead(activeConversation.id);
        }
      }

      // Update conversations list
      await loadConversations();

      // Show toast if message is not from current user and not in active conversation
      if (processedMessage.sender_id !== user?.id && 
          (!activeConversation || processedMessage.conversation_id !== activeConversation.id)) {
        toast({
          title: `New message from ${processedMessage.sender.display_name}`,
          description: processedMessage.content.length > 50 
            ? processedMessage.content.substring(0, 50) + '...' 
            : processedMessage.content,
        });
      }
    } catch (error) {
      console.error('Error handling new message:', error);
    }
  };

  const sendMessage = async (conversationId: string, content: string) => {
    if (!user || !content.trim()) return;

    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('messages')
        .insert({
          content: content.trim(),
          sender_id: user.id,
          conversation_id: conversationId
        });

      if (error) throw error;

      // Update conversation's last message timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Failed to send message",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const createConversation = async (userId: string): Promise<Conversation> => {
    if (!user) throw new Error('Not authenticated');

    try {
      const supabase = createClient();
      
      // Check if conversation already exists
      const { data: existingConv, error: searchError } = await supabase
        .from('conversations')
        .select('*')
        .contains('participants', [user.id])
        .contains('participants', [userId])
        .single();

      if (existingConv && !searchError) {
        // Return existing conversation
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .eq('id', userId)
          .single();

        return {
          ...existingConv,
          participant_profiles: profile ? [profile] : [],
          unread_count: 0
        };
      }

      // Create new conversation
      const { data: newConv, error } = await supabase
        .from('conversations')
        .insert({
          participants: [user.id, userId]
        })
        .select('*')
        .single();

      if (error) throw error;

      // Get participant profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .eq('id', userId)
        .single();

      const conversation = {
        ...newConv,
        participant_profiles: profile ? [profile] : [],
        unread_count: 0
      };

      // Refresh conversations list
      await loadConversations();

      return conversation;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  };

  const markAsRead = async (conversationId: string) => {
    if (!user) return;

    try {
      const supabase = createClient();
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', conversationId)
        .eq('read', false)
        .neq('sender_id', user.id);

      // Update local state
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unread_count: 0 }
            : conv
        )
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const value = {
    conversations,
    activeConversation,
    messages,
    loading,
    setActiveConversation,
    sendMessage,
    createConversation,
    markAsRead,
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
}
