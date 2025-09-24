"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
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
  Circle,
  CheckCircle2,
  MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { mockUsers, mockMessages } from "@/lib/mock-data";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Conversation {
  id: number;
  user: any;
  lastMessage: string;
  timestamp: string;
  unread: number;
  online: boolean;
  typing?: boolean;
}

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>(mockMessages);
  const [searchQuery, setSearchQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock conversations
  const conversations: Conversation[] = mockUsers.slice(1).map((user, index) => ({
    id: index + 1,
    user,
    lastMessage: mockMessages[index]?.body || "Start a conversation",
    timestamp: mockMessages[index]?.created_at || new Date().toISOString(),
    unread: Math.random() > 0.5 ? Math.floor(Math.random() * 5) : 0,
    online: Math.random() > 0.5,
    typing: false
  }));

  const filteredConversations = conversations.filter(conv =>
    conv.user.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!message.trim() || !selectedConversation) return;

    const newMessage = {
      id: messages.length + 1,
      conversation_id: selectedConversation.id,
      sender: mockUsers[0], // Current user
      body: message,
      created_at: new Date().toISOString(),
      read: false
    };

    setMessages([...messages, newMessage]);
    setMessage("");

    // Simulate typing indicator and response
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const response = {
          id: messages.length + 2,
          conversation_id: selectedConversation.id,
          sender: selectedConversation.user,
          body: "That sounds great! Let's play together 🎮",
          created_at: new Date().toISOString(),
          read: false
        };
        setMessages(prev => [...prev, response]);
      }, 2000);
    }, 1000);
  };

  const conversationMessages = selectedConversation
    ? messages.filter(m => m.conversation_id === selectedConversation.id)
    : [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-0 h-screen flex">
        {/* Conversations List */}
        <div className="w-full md:w-96 border-r flex flex-col">
          {/* Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-gaming font-bold bg-gradient-to-r from-gaming-purple to-gaming-pink bg-clip-text text-transparent">
                Messages
              </h1>
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

          {/* Conversations */}
          <ScrollArea className="flex-1">
            <div className="p-2">
              {filteredConversations.map((conv) => (
                <motion.div
                  key={conv.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ x: 4 }}
                >
                  <Card
                    className={cn(
                      "mb-2 p-3 cursor-pointer transition-all hover:shadow-md",
                      selectedConversation?.id === conv.id && "bg-secondary"
                    )}
                    onClick={() => setSelectedConversation(conv)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={conv.user.avatar_url} />
                          <AvatarFallback>
                            {conv.user.username[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {conv.online && (
                          <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold truncate">{conv.user.display_name}</p>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(conv.timestamp), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {conv.typing ? (
                            <span className="italic">Typing...</span>
                          ) : (
                            conv.lastMessage
                          )}
                        </p>
                      </div>
                      {conv.unread > 0 && (
                        <Badge className="bg-gradient-to-r from-gaming-purple to-gaming-pink">
                          {conv.unread}
                        </Badge>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        {selectedConversation ? (
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedConversation.user.avatar_url} />
                  <AvatarFallback>
                    {selectedConversation.user.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{selectedConversation.user.display_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedConversation.online ? (
                      <span className="text-green-500">Online</span>
                    ) : (
                      `Last seen ${formatDistanceToNow(new Date(selectedConversation.timestamp), { addSuffix: true })}`
                    )}
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
                {conversationMessages.map((msg) => {
                  const isCurrentUser = msg.sender.id === mockUsers[0].id;
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
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={msg.sender.avatar_url} />
                        <AvatarFallback>
                          {msg.sender.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className={cn(
                        "max-w-[70%]",
                        isCurrentUser && "items-end"
                      )}>
                        <div className={cn(
                          "rounded-lg px-4 py-2",
                          isCurrentUser
                            ? "bg-gradient-to-r from-gaming-purple to-gaming-pink text-white"
                            : "bg-secondary"
                        )}>
                          <p>{msg.body}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                          </span>
                          {isCurrentUser && (
                            <CheckCircle2 className="h-3 w-3 text-primary" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-3"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={selectedConversation.user.avatar_url} />
                      <AvatarFallback>
                        {selectedConversation.user.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-secondary rounded-lg px-4 py-2">
                      <div className="flex gap-1">
                        <Circle className="h-2 w-2 fill-current animate-bounce" />
                        <Circle className="h-2 w-2 fill-current animate-bounce delay-100" />
                        <Circle className="h-2 w-2 fill-current animate-bounce delay-200" />
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex items-center gap-2">
                <Button size="icon" variant="ghost">
                  <Paperclip className="h-5 w-5" />
                </Button>
                <Button size="icon" variant="ghost">
                  <ImageIcon className="h-5 w-5" />
                </Button>
                <Input
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  className="flex-1"
                />
                <Button size="icon" variant="ghost">
                  <Smile className="h-5 w-5" />
                </Button>
                <Button size="icon" variant="ghost">
                  <Mic className="h-5 w-5" />
                </Button>
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  className="bg-gradient-to-r from-gaming-purple to-gaming-pink hover:opacity-90"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="mb-4">
                <div className="h-24 w-24 mx-auto bg-gradient-to-r from-gaming-purple to-gaming-pink rounded-full flex items-center justify-center">
                  <MessageCircle className="h-12 w-12 text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-semibold mb-2">Select a conversation</h2>
              <p className="text-muted-foreground">Choose a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
