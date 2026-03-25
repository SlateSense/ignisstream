"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Smile, 
  Users, 
  Shield, 
  Crown,
  Heart,
  Gift,
  Settings,
  MoreVertical,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChatMessage, streamManager } from '@/lib/streaming/stream-manager';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface StreamChatProps {
  streamId: string;
  className?: string;
}

interface ChatUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  badges: string[];
  is_moderator: boolean;
  is_subscriber: boolean;
  is_streamer: boolean;
}

const CHAT_COMMANDS = [
  { command: '/help', description: 'Show available commands' },
  { command: '/clear', description: 'Clear chat (moderators only)' },
  { command: '/timeout', description: 'Timeout user (moderators only)' },
  { command: '/ban', description: 'Ban user (moderators only)' }
];

const EMOTES = [
  { name: 'PogChamp', url: '🎮' },
  { name: 'Kappa', url: '😏' },
  { name: 'EZ', url: '😎' },
  { name: 'GG', url: '🎯' },
  { name: 'OMEGALUL', url: '😂' },
  { name: 'MonkaS', url: '😰' },
  { name: 'Pepega', url: '🤪' },
  { name: 'AYAYA', url: '🌸' }
];

export default function StreamChat({ streamId, className }: StreamChatProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [showEmotes, setShowEmotes] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isChatEnabled, setIsChatEnabled] = useState(true);
  const [slowMode, setSlowMode] = useState(0);
  const [lastMessageTime, setLastMessageTime] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadChatMessages();
    connectToChat();
    
    return () => {
      disconnectFromChat();
    };
  }, [streamId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatMessages = async () => {
    try {
      const chatMessages = await streamManager.getChatMessages(streamId, 100);
      setMessages(chatMessages);
    } catch (error) {
      console.error('Error loading chat messages:', error);
    }
  };

  const connectToChat = () => {
    // TODO: Implement WebSocket connection for real-time chat
    setIsConnected(true);
  };

  const disconnectFromChat = () => {
    setIsConnected(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !isChatEnabled) return;

    // Check slow mode
    const now = Date.now();
    if (slowMode > 0 && now - lastMessageTime < slowMode * 1000) {
      toast({
        title: "Slow mode active",
        description: `Please wait ${slowMode} seconds between messages.`,
        variant: "destructive"
      });
      return;
    }

    // Check for commands
    if (newMessage.startsWith('/')) {
      handleChatCommand(newMessage);
      setNewMessage('');
      return;
    }

    try {
      const message = await streamManager.sendChatMessage(streamId, user.id, newMessage);
      setMessages(prev => [...prev, message]);
      setNewMessage('');
      setLastMessageTime(now);
      
      // TODO: Broadcast message via WebSocket
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Failed to send message",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleChatCommand = (command: string) => {
    const [cmd, ...args] = command.split(' ');
    
    switch (cmd.toLowerCase()) {
      case '/help':
        showHelpMessage();
        break;
      case '/clear':
        if (user?.role === 'moderator' || user?.role === 'streamer') {
          clearChat();
        }
        break;
      case '/timeout':
        if (user?.role === 'moderator' || user?.role === 'streamer') {
          timeoutUser(args[0], parseInt(args[1]) || 600);
        }
        break;
      case '/ban':
        if (user?.role === 'moderator' || user?.role === 'streamer') {
          banUser(args[0]);
        }
        break;
      default:
        toast({
          title: "Unknown command",
          description: "Type /help to see available commands.",
          variant: "destructive"
        });
    }
  };

  const showHelpMessage = () => {
    const helpMessage: ChatMessage = {
      id: `help-${Date.now()}`,
      stream_id: streamId,
      user_id: 'system',
      username: 'System',
      display_name: 'System',
      message: 'Available commands: ' + CHAT_COMMANDS.map(c => c.command).join(', '),
      timestamp: new Date().toISOString(),
      is_moderator: false,
      is_subscriber: false,
      badges: ['system']
    };
    
    setMessages(prev => [...prev, helpMessage]);
  };

  const clearChat = () => {
    setMessages([]);
    toast({
      title: "Chat cleared",
      description: "All messages have been removed.",
    });
  };

  const timeoutUser = (username: string, duration: number) => {
    // TODO: Implement timeout functionality
    toast({
      title: "User timed out",
      description: `${username} has been timed out for ${duration} seconds.`,
    });
  };

  const banUser = (username: string) => {
    // TODO: Implement ban functionality
    toast({
      title: "User banned",
      description: `${username} has been banned from the chat.`,
    });
  };

  const addEmote = (emote: string) => {
    setNewMessage(prev => prev + ` ${emote} `);
    setShowEmotes(false);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  };

  const getBadgeIcon = (badge: string) => {
    switch (badge) {
      case 'streamer': return <Crown className="h-3 w-3 text-yellow-500" />;
      case 'moderator': return <Shield className="h-3 w-3 text-blue-500" />;
      case 'subscriber': return <Heart className="h-3 w-3 text-purple-500" />;
      case 'vip': return <Gift className="h-3 w-3 text-green-500" />;
      default: return null;
    }
  };

  const formatMessage = (message: string) => {
    // Replace emote names with emojis
    let formatted = message;
    EMOTES.forEach(emote => {
      formatted = formatted.replace(
        new RegExp(`\\b${emote.name}\\b`, 'gi'),
        emote.url
      );
    });
    return formatted;
  };

  return (
    <div className={cn("flex flex-col h-full bg-background border-l", className)}>
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <span className="font-semibold">Stream Chat</span>
          <Badge variant="secondary" className="text-xs">
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="ghost">
                  <Users className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{chatUsers.length} viewers in chat</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsChatEnabled(!isChatEnabled)}>
                {isChatEnabled ? 'Disable Chat' : 'Enable Chat'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={clearChat}>
                Clear Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-2">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-start gap-2 p-2 hover:bg-secondary/50 rounded-lg group"
              >
                <Avatar className="h-6 w-6 flex-shrink-0">
                  <AvatarImage src={message.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {message.username[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-1">
                    {message.badges.map((badge, i) => (
                      <div key={i} className="flex-shrink-0">
                        {getBadgeIcon(badge)}
                      </div>
                    ))}
                    <span className={cn(
                      "text-sm font-medium truncate",
                      message.is_moderator && "text-blue-500",
                      message.is_subscriber && "text-purple-500"
                    )}>
                      {message.display_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  
                  <p className="text-sm break-words">
                    {formatMessage(message.message)}
                  </p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Report Message
                    </DropdownMenuItem>
                    {(user?.role === 'moderator' || user?.role === 'streamer') && (
                      <>
                        <DropdownMenuItem onClick={() => timeoutUser(message.username, 600)}>
                          Timeout User
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => banUser(message.username)}>
                          Ban User
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Emote Picker */}
      <AnimatePresence>
        {showEmotes && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="border-t p-3"
          >
            <div className="grid grid-cols-8 gap-2">
              {EMOTES.map((emote) => (
                <button
                  key={emote.name}
                  onClick={() => addEmote(emote.name)}
                  className="p-2 hover:bg-secondary rounded-lg text-center text-lg transition-colors"
                  title={emote.name}
                >
                  {emote.url}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Input */}
      <div className="p-3 border-t space-y-2">
        {slowMode > 0 && (
          <div className="text-xs text-muted-foreground">
            Slow mode: {slowMode}s between messages
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowEmotes(!showEmotes)}
            className="flex-shrink-0"
          >
            <Smile className="h-4 w-4" />
          </Button>
          
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              !user 
                ? "Sign in to chat" 
                : !isChatEnabled 
                ? "Chat is disabled" 
                : "Type a message..."
            }
            disabled={!user || !isChatEnabled}
            maxLength={500}
            className="flex-1"
          />
          
          <Button
            size="sm"
            onClick={sendMessage}
            disabled={!newMessage.trim() || !user || !isChatEnabled}
            className="flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground">
          {newMessage.length}/500 characters
        </div>
      </div>
    </div>
  );
}
