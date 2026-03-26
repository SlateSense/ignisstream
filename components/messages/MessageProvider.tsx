"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  conversation_id?: string;
  recipient_id?: string;
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
  transport?: 'conversation' | 'direct';
  other_user_id?: string;
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
  const [transportMode, setTransportMode] = useState<'conversation' | 'direct'>('conversation');
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
        const fallbackConversations = await loadDirectMessageConversations(supabase);
        setTransportMode('direct');
        setConversations(fallbackConversations);
        return;
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

      setTransportMode('conversation');
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

  const loadDirectMessageConversations = async (supabase = createClient()) => {
    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        sender_id,
        recipient_id,
        created_at,
        read,
        sender:profiles!sender_id(id, username, display_name, avatar_url),
        recipient:profiles!recipient_id(id, username, display_name, avatar_url)
      `)
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        return [];
      }
      throw error;
    }

    const conversationMap = new Map<string, Conversation>();

    for (const rawMessage of data || []) {
      const sender = Array.isArray(rawMessage.sender) ? rawMessage.sender[0] : rawMessage.sender;
      const recipient = Array.isArray((rawMessage as any).recipient) ? (rawMessage as any).recipient[0] : (rawMessage as any).recipient;
      const otherProfile = rawMessage.sender_id === user.id ? recipient : sender;

      if (!otherProfile?.id) {
        continue;
      }

      const normalizedMessage: Message = {
        ...rawMessage,
        sender,
        recipient_id: rawMessage.recipient_id,
      };

      const existingConversation = conversationMap.get(otherProfile.id);
      if (existingConversation) {
        if (!existingConversation.last_message) {
          existingConversation.last_message = normalizedMessage;
        }
        if (rawMessage.recipient_id === user.id && !rawMessage.read) {
          existingConversation.unread_count += 1;
        }
        continue;
      }

      conversationMap.set(otherProfile.id, {
        id: `direct-${otherProfile.id}`,
        participants: [user.id, otherProfile.id],
        created_at: rawMessage.created_at,
        updated_at: rawMessage.created_at,
        transport: 'direct',
        other_user_id: otherProfile.id,
        participant_profiles: [otherProfile],
        last_message: normalizedMessage,
        unread_count: rawMessage.recipient_id === user.id && !rawMessage.read ? 1 : 0,
      });
    }

    return Array.from(conversationMap.values());
  };

  const loadMessages = async (conversationId: string) => {
    setLoading(true);
    try {
      const supabase = createClient();
      const selectedConversation =
        conversations.find((conversation) => conversation.id === conversationId) ||
        activeConversation;

      let processedMessages: Message[] = [];

      if (selectedConversation?.transport === 'direct') {
        const otherUserId = selectedConversation.other_user_id;
        if (!otherUserId || !user) {
          setMessages([]);
          return;
        }

        const { data, error } = await supabase
          .from('messages')
          .select(`
            id,
            content,
            sender_id,
            recipient_id,
            created_at,
            read,
            sender:profiles!sender_id(id, username, display_name, avatar_url)
          `)
          .or(`and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`)
          .order('created_at', { ascending: true });

        if (error) throw error;

        processedMessages = (data || []).map((message) => ({
          ...message,
          sender: Array.isArray(message.sender) ? message.sender[0] : message.sender
        }));
      } else {
        const { data, error } = await supabase
          .from('messages')
          .select(`
            id,
            content,
            sender_id,
            conversation_id,
            recipient_id,
            created_at,
            read,
            sender:profiles!sender_id(id, username, display_name, avatar_url)
          `)
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        processedMessages = (data || []).map(message => ({
          ...message,
          sender: Array.isArray(message.sender) ? message.sender[0] : message.sender
        }));
      }

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
      if (!user) {
        return;
      }

      const isRelevant =
        newMessage.sender_id === user.id ||
        newMessage.recipient_id === user.id ||
        (activeConversation?.transport !== 'direct' && newMessage.conversation_id === activeConversation?.id);

      if (!isRelevant) {
        return;
      }

      await loadConversations();

      if (activeConversation) {
        const isActiveDirectThread =
          activeConversation.transport === 'direct' &&
          activeConversation.other_user_id &&
          [newMessage.sender_id, newMessage.recipient_id].includes(activeConversation.other_user_id);

        const isActiveConversationThread =
          activeConversation.transport !== 'direct' &&
          newMessage.conversation_id === activeConversation.id;

        if (isActiveDirectThread || isActiveConversationThread) {
          await loadMessages(activeConversation.id);
          if (newMessage.sender_id !== user.id) {
            await markAsRead(activeConversation.id);
          }
          return;
        }
      }

      if (newMessage.sender_id !== user.id) {
        const senderConversation = conversations.find((conversation) =>
          conversation.other_user_id === newMessage.sender_id ||
          conversation.participant_profiles?.some((profile) => profile.id === newMessage.sender_id)
        );

        const senderName =
          senderConversation?.participant_profiles?.[0]?.display_name ||
          senderConversation?.participant_profiles?.[0]?.username ||
          'a player';

        toast({
          title: `New message from ${senderName}`,
          description: typeof newMessage.content === 'string' && newMessage.content.length > 50
            ? `${newMessage.content.substring(0, 50)}...`
            : newMessage.content,
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
      const conversation =
        conversations.find((item) => item.id === conversationId) ||
        activeConversation;

      if (conversation?.transport === 'direct') {
        const recipientId = conversation.other_user_id;
        if (!recipientId) {
          throw new Error('Missing recipient');
        }

        const { error } = await supabase
          .from('messages')
          .insert({
            content: content.trim(),
            sender_id: user.id,
            recipient_id: recipientId
          });

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('messages')
          .insert({
            content: content.trim(),
            sender_id: user.id,
            conversation_id: conversationId
          });

        if (error) throw error;

        await supabase
          .from('conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', conversationId);
      }

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

      if (transportMode === 'direct') {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .eq('id', userId)
          .single();

        if (error) throw error;

        const directConversation = {
          id: `direct-${userId}`,
          participants: [user.id, userId],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          transport: 'direct' as const,
          other_user_id: userId,
          participant_profiles: profile ? [profile] : [],
          unread_count: 0
        };

        setConversations((previous) => {
          const exists = previous.some((conversation) => conversation.id === directConversation.id);
          return exists ? previous : [directConversation, ...previous];
        });

        return directConversation;
      }
      
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
      const conversation =
        conversations.find((item) => item.id === conversationId) ||
        activeConversation;

      if (conversation?.transport === 'direct' && conversation.other_user_id) {
        await supabase
          .from('messages')
          .update({ read: true })
          .eq('recipient_id', user.id)
          .eq('sender_id', conversation.other_user_id)
          .eq('read', false);
      } else {
        await supabase
          .from('messages')
          .update({ read: true })
          .eq('conversation_id', conversationId)
          .eq('read', false)
          .neq('sender_id', user.id);
      }

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
