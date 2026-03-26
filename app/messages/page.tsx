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
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import OnlineStatus from "@/components/ui/online-status";

export const dynamic = "force-dynamic";

const quickReactions = ["🔥", "GG", "⚡", "🎯", "💜", "POG"];

export default function MessagesPage() {
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
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
  const unreadConversations = conversations.filter((conversation) => conversation.unread_count > 0).length;
  const recentContacts = filteredConversations.slice(0, 4);

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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.28),transparent_32%),radial-gradient(circle_at_top_right,rgba(6,182,212,0.22),transparent_28%),linear-gradient(135deg,#12081f_0%,#091420_55%,#041019_100%)]">
      <div className="container mx-auto max-w-7xl px-4 py-6 sm:py-8">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 h-[calc(100vh-7.5rem)]">
          <div className="hidden xl:flex xl:col-span-3 flex-col gap-4">
            <Card className="border-white/10 bg-white/5 text-white shadow-2xl backdrop-blur">
              <div className="p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-2xl bg-gaming-cyan/15 p-3">
                    <Gamepad2 className="h-5 w-5 text-gaming-cyan" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Message Center</h2>
                    <p className="text-sm text-white/65">
                      Keep every squad, duo, and creator chat in one place.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/45">Threads</p>
                    <p className="mt-2 text-2xl font-semibold">{conversations.length}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/45">Unread</p>
                    <p className="mt-2 text-2xl font-semibold">{unreadConversations}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="flex-1 border-white/10 bg-white/5 text-white shadow-2xl backdrop-blur">
              <div className="flex items-center justify-between border-b border-white/10 p-4">
                <div>
                  <h3 className="font-semibold">Recent Contacts</h3>
                  <p className="text-xs text-white/60">Active chats update automatically.</p>
                </div>
                <Users className="h-4 w-4 text-white/60" />
              </div>
              <ScrollArea className="flex-1">
                <div className="space-y-2 p-3">
                  {recentContacts.length > 0 ? (
                    recentContacts.map((conversation) => {
                      const profile = conversation.participant_profiles?.[0];
                      return (
                        <button
                          key={conversation.id}
                          onClick={() => setActiveConversation(conversation)}
                          className={cn(
                            "w-full rounded-2xl border px-3 py-3 text-left transition-all",
                            activeConversation?.id === conversation.id
                              ? "border-gaming-cyan/60 bg-gaming-cyan/10"
                              : "border-white/10 bg-white/5 hover:border-gaming-purple/40 hover:bg-white/10"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={profile?.avatar_url} />
                              <AvatarFallback>{profile?.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{profile?.display_name || profile?.username || "Unknown User"}</p>
                              <p className="truncate text-xs text-white/55">
                                {conversation.last_message?.content || "No messages yet"}
                              </p>
                            </div>
                            {conversation.unread_count > 0 && (
                              <Badge className="bg-gaming-pink/20 text-gaming-pink">
                                {conversation.unread_count}
                              </Badge>
                            )}
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-white/60">
                      No recent contacts yet. Start a new chat to build your inbox.
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="border-t border-white/10 p-4 text-xs text-white/55 flex items-center gap-2">
                <Trophy className="h-3.5 w-3.5 text-gaming-green" />
                Read receipts and latest previews stay synced in real time.
              </div>
            </Card>
          </div>

          {/* Conversations List */}
          <Card className="flex flex-col xl:col-span-3 border-white/10 bg-white/90 shadow-2xl backdrop-blur">
            <div className="border-b p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold">Messages</h2>
                  <p className="text-xs text-muted-foreground">
                    {filteredConversations.length} conversation{filteredConversations.length === 1 ? "" : "s"} available
                  </p>
                </div>
                <Button size="icon" variant="ghost" className="rounded-full">
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
                <div className="space-y-3 p-4">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-3 rounded-2xl border border-border/60 p-3">
                      <div className="h-12 w-12 animate-pulse rounded-full bg-secondary" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-1/2 animate-pulse rounded bg-secondary" />
                        <div className="h-3 w-3/4 animate-pulse rounded bg-secondary" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium text-foreground">No conversations yet</p>
                  <p className="text-sm">Search for a player and start your first message thread.</p>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {filteredConversations.map((conversation) => {
                    const otherUser = conversation.participant_profiles?.[0];
                    const isActive = activeConversation?.id === conversation.id;
                    
                    return (
                      <motion.div
                        key={conversation.id}
                        whileHover={{ scale: 1.01 }}
                        className={cn(
                          "flex items-center gap-3 rounded-2xl border p-3 cursor-pointer transition-all",
                          isActive
                            ? "border-gaming-purple/25 bg-gradient-to-r from-gaming-purple/10 to-gaming-cyan/10 shadow-sm"
                            : "border-transparent hover:border-border/80 hover:bg-secondary/70"
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
              <Card className="h-full flex items-center justify-center border-white/10 bg-white/90 shadow-2xl backdrop-blur">
                <div className="text-center text-muted-foreground max-w-sm px-6">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gaming-purple/10">
                    <MessageCircle className="h-10 w-10 opacity-60" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Pick a conversation</h3>
                  <p>Open an existing thread to view previews, read receipts, and recent messages instantly.</p>
                </div>
              </Card>
            ) : (
              <Card className="h-full flex flex-col border-white/10 bg-white/95 shadow-2xl backdrop-blur">
                {/* Chat Header */}
                <div className="flex items-center justify-between border-b p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={activeConversation.participant_profiles?.[0]?.avatar_url} />
                      <AvatarFallback>
                        {activeConversation.participant_profiles?.[0]?.username?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium text-foreground">
                        {getConversationName(activeConversation)}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        @{activeConversation.participant_profiles?.[0]?.username} • {messages.length} message{messages.length === 1 ? "" : "s"}
                      </p>
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
                              "rounded-2xl px-4 py-3 text-sm shadow-sm transition-colors",
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
                                <>
                                  <span>{msg.read ? "Read" : "Sent"}</span>
                                  <CheckCircle2 className={cn(
                                    "h-3 w-3",
                                    msg.read ? "text-blue-500" : "text-gray-400"
                                  )} />
                                </>
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
