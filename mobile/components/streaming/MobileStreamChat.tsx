import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface ChatMessage {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  message: string;
  timestamp: string;
  type: 'message' | 'system' | 'mod_action';
  badges?: string[];
}

interface MobileStreamChatProps {
  streamId: string;
  onClose?: () => void;
}

export default function MobileStreamChat({ streamId, onClose }: MobileStreamChatProps) {
  const { theme } = useTheme();
  const { user } = useAuth();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    connectToChat();
    loadRecentMessages();
    
    return () => {
      disconnectFromChat();
    };
  }, [streamId]);

  const connectToChat = async () => {
    try {
      // Subscribe to real-time chat messages
      const channel = supabase
        .channel(`stream_chat_${streamId}`)
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'stream_chat_messages',
            filter: `stream_id=eq.${streamId}`
          },
          (payload) => {
            const newMessage = payload.new as ChatMessage;
            setMessages(prev => [...prev, newMessage]);
            
            // Auto-scroll to bottom
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }
        )
        .subscribe();

      setIsConnected(true);
    } catch (error) {
      console.error('Failed to connect to chat:', error);
    }
  };

  const disconnectFromChat = () => {
    supabase.removeAllChannels();
    setIsConnected(false);
  };

  const loadRecentMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('stream_chat_messages')
        .select('*')
        .eq('stream_id', streamId)
        .order('timestamp', { ascending: true })
        .limit(50);

      if (error) throw error;
      
      setMessages(data || []);
      
      // Auto-scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    } catch (error) {
      console.error('Failed to load chat messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      const message: Partial<ChatMessage> = {
        stream_id: streamId,
        user_id: user.id,
        username: user.user_metadata?.username || 'Anonymous',
        display_name: user.user_metadata?.display_name || user.user_metadata?.username || 'Anonymous',
        message: newMessage.trim(),
        timestamp: new Date().toISOString(),
        type: 'message',
        badges: []
      };

      const { error } = await supabase
        .from('stream_chat_messages')
        .insert(message);

      if (error) throw error;

      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View style={[styles.messageContainer, { borderBottomColor: theme.colors.border }]}>
      <View style={styles.messageHeader}>
        <Text style={[styles.username, { color: theme.colors.primary }]}>
          {item.display_name}
        </Text>
        <Text style={[styles.timestamp, { color: theme.colors.textSecondary }]}>
          {formatTimestamp(item.timestamp)}
        </Text>
      </View>
      
      <Text style={[styles.messageText, { color: theme.colors.text }]}>
        {item.message}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Chat Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <View style={styles.headerLeft}>
          <Ionicons name="chatbubbles" size={20} color={theme.colors.primary} />
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Stream Chat
          </Text>
          {isConnected && (
            <View style={styles.connectedIndicator}>
              <View style={styles.connectedDot} />
            </View>
          )}
        </View>
        
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={20} color={theme.colors.text} />
          </TouchableOpacity>
        )}
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Message Input */}
      {user ? (
        <View style={[styles.inputContainer, { borderTopColor: theme.colors.border }]}>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border,
              }
            ]}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            maxLength={500}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          
          <TouchableOpacity 
            style={[
              styles.sendButton,
              { 
                backgroundColor: newMessage.trim() ? theme.colors.primary : theme.colors.border,
              }
            ]}
            onPress={sendMessage}
            disabled={!newMessage.trim()}
          >
            <Ionicons 
              name="send" 
              size={16} 
              color={newMessage.trim() ? '#FFFFFF' : theme.colors.textSecondary} 
            />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.loginPrompt, { backgroundColor: theme.colors.background }]}>
          <Text style={[styles.loginPromptText, { color: theme.colors.textSecondary }]}>
            Sign in to chat
          </Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  connectedIndicator: {
    marginLeft: 8,
  },
  connectedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  closeButton: {
    padding: 4,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 8,
  },
  messageContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  timestamp: {
    fontSize: 12,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 14,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginPrompt: {
    padding: 16,
    alignItems: 'center',
  },
  loginPromptText: {
    fontSize: 14,
  },
});
