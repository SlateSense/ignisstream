"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useMessages } from "@/components/messages/MessageProvider";
import { 
  Send, 
  Search, 
  Plus, 
  MoreVertical,
  Phone,
  Video,
  Info,
  Smile,
  Paperclip,
  Image as ImageIcon,
  Mic,
  CheckCircle2,
  MessageCircle,
  Users,
  Gamepad2,
  Trophy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import OnlineStatus from "@/components/ui/online-status";

export const dynamic = "force-dynamic";

const lobbyChannels = [
  { id: "lobby-1", name: "Ranked Grind", game: "VALORANT", players: 4, status: "In Queue" },
  { id: "lobby-2", name: "Late-Night Scrims", game: "Counter-Strike 2", players: 5, status: "Live" },
  { id: "lobby-3", name: "Chill Arena", game: "Apex Legends", players: 3, status: "Open" },
];

const quickReactions = ["🔥", "GG", "⚡", "🎯", "💜", "POG"];

export default function MessagesPage() {
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLobby, setSelectedLobby] = useState(lobbyChannels[0].id);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    conversations, 
    activeConversation, 
    messages, 
    loading, 
    setActiveConversation, 
    sendMessage 
  } = useMessages();
  
  const { user } = useAuth();

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv => {
    const otherUser = conv.participant_profiles?.[0];
    return otherUser?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           otherUser?.username?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim() || !activeConversation) return;

    try {
      await sendMessage(activeConversation.id, message);
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const getConversationName = (conversation: any) => {
    const otherUser = conversation.participant_profiles?.[0];
    return otherUser?.display_name || otherUser?.username || "Unknown User";
  };

  const getLastMessageText = (conversation: any) => {
    if (conversation.last_message) {
      return conversation.last_message.content;
    }
    return "Start a conversation";
  };

  return (
    <div className="min-h-screen gaming-shell">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-[calc(100vh-8rem)]">
          <Card className="hidden xl:flex xl:col-span-3 flex-col border-gaming-purple/25">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <Gamepad2 className="h-5 w-5 text-gaming-cyan" />
                Gaming Lobbies
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Join active squad channels and stay synced.
              </p>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-2">
                {lobbyChannels.map((lobby) => (
                  <button
                    key={lobby.id}
                    onClick={() => setSelectedLobby(lobby.id)}
                    className={cn(
                      "w-full rounded-lg border px-3 py-3 text-left transition",
                      selectedLobby === lobby.id
                        ? "border-gaming-cyan bg-gaming-cyan/10"
                        : "border-border hover:border-gaming-purple/40"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{lobby.name}</p>
                      <Badge variant="outline">{lobby.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{lobby.game}</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {lobby.players} players active
                    </p>
                  </button>
                ))}
              </div>
            </ScrollArea>
            <div className="p-4 border-t text-xs text-muted-foreground flex items-center gap-2">
              <Trophy className="h-3.5 w-3.5 text-gaming-green" />
              Lobby voice and calls are available per channel.
            </div>
          </Card>

          {/* Conversations List */}
          <Card className="flex flex-col xl:col-span-3 border-gaming-purple/25">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg">Messages</h2>
                <Button size="icon" variant="ghost">
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <ScrollArea className="flex-1">
              {loading ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No conversations yet</p>
                  <p className="text-sm">Start a conversation with someone!</p>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {filteredConversations.map((conversation) => {
                    const otherUser = conversation.participant_profiles?.[0];
                    const isActive = activeConversation?.id === conversation.id;
                    
                    return (
                      <motion.div
                        key={conversation.id}
                        whileHover={{ scale: 1.02 }}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                          isActive ? "bg-primary/10" : "hover:bg-secondary"
                        )}
                        onClick={() => setActiveConversation(conversation)}
                      >
                        <div className="relative">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={otherUser?.avatar_url} />
                            <AvatarFallback>
                              {otherUser?.username?.[0]?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          {otherUser?.id && (
                            <div className="absolute -bottom-1 -right-1">
                              <OnlineStatus userId={otherUser.id} />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium truncate">
                              {getConversationName(conversation)}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {conversation.last_message && formatDistanceToNow(
                                new Date(conversation.last_message.created_at), 
                                { addSuffix: true }
                              )}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground truncate">
                              {getLastMessageText(conversation)}
                            </p>
                            {conversation.unread_count > 0 && (
                              <Badge className="bg-gradient-to-r from-gaming-purple to-gaming-pink text-xs">
                                {conversation.unread_count}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </Card>

          {/* Chat Area */}
          <div className="xl:col-span-6">
            {!activeConversation ? (
              <Card className="h-full flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                  <p>Choose a conversation from the list to start messaging</p>
                </div>
              </Card>
            ) : (
              <Card className="h-full flex flex-col border-gaming-cyan/20">
                {/* Chat Header */}
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={activeConversation.participant_profiles?.[0]?.avatar_url} />
                      <AvatarFallback>
                        {activeConversation.participant_profiles?.[0]?.username?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">
                        {getConversationName(activeConversation)}
                      </h3>
                      <p className="text-sm text-muted-foreground">@{activeConversation.participant_profiles?.[0]?.username}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="ghost">
                      <Phone className="h-5 w-5" />
                    </Button>
                    <Button size="icon" variant="ghost">
                      <Video className="h-5 w-5" />
                    </Button>
                    <Button size="icon" variant="ghost">
                      <Info className="h-5 w-5" />
                    </Button>
                    <Button size="icon" variant="ghost">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((msg) => {
                      const isCurrentUser = msg.sender_id === user?.id;
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            "flex gap-3",
                            isCurrentUser && "flex-row-reverse"
                          )}
                        >
                          {!isCurrentUser && (
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarImage src={msg.sender?.avatar_url} />
                              <AvatarFallback>
                                {msg.sender?.username?.[0]?.toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                          )}

                          <div className={cn(
                            "max-w-[70%] space-y-1",
                            isCurrentUser && "items-end"
                          )}>
                            <div className={cn(
                              "rounded-lg px-3 py-2 text-sm",
                              isCurrentUser
                                ? "bg-gradient-to-r from-gaming-purple to-gaming-pink text-white"
                                : "bg-secondary"
                            )}>
                              <p>{msg.content}</p>
                            </div>
                            
                            <div className={cn(
                              "flex items-center gap-1 text-xs text-muted-foreground",
                              isCurrentUser && "flex-row-reverse"
                            )}>
                              <span>
                                {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                              </span>
                              {isCurrentUser && (
                                <CheckCircle2 className={cn(
                                  "h-3 w-3",
                                  msg.read ? "text-blue-500" : "text-gray-400"
                                )} />
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <div className="p-4 border-t">
                  <div className="mb-2 flex flex-wrap gap-2">
                    {quickReactions.map((reaction) => (
                      <Button
                        key={reaction}
                        size="sm"
                        variant="outline"
                        onClick={() => setMessage((prev) => `${prev} ${reaction}`.trim())}
                      >
                        {reaction}
                      </Button>
                    ))}
                  </div>
                  <div className="flex items-end gap-2">
                    <Button size="icon" variant="ghost" className="mb-1">
                      <Paperclip className="h-5 w-5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="mb-1">
                      <ImageIcon className="h-5 w-5" />
                    </Button>
                    
                    <div className="flex-1">
                      <Input
                        placeholder="Type a message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        className="resize-none"
                      />
                    </div>

                    <Button size="icon" variant="ghost" className="mb-1">
                      <Smile className="h-5 w-5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="mb-1">
                      <Mic className="h-5 w-5" />
                    </Button>
                    
                    <Button
                      onClick={handleSendMessage}
                      disabled={!message.trim()}
                      className="bg-gradient-to-r from-gaming-purple to-gaming-pink hover:opacity-90"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
