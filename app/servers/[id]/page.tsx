"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Hash, 
  Users, 
  Settings, 
  Crown,
  Shield,
  Star,
  Bell,
  BellOff,
  UserPlus,
  MessageSquare,
  Send,
  Smile,
  Paperclip,
  Volume2,
  VolumeX,
  Phone,
  Video,
  MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface ServerMember {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  status: 'online' | 'away' | 'offline';
  activity?: string;
}

interface Channel {
  id: number;
  name: string;
  type: 'text' | 'voice';
  member_count?: number;
  is_active?: boolean;
}

interface Message {
  id: number;
  author: ServerMember;
  content: string;
  timestamp: string;
  type: 'text' | 'system';
}

const mockMembers: ServerMember[] = [
  {
    id: "1",
    username: "speedking",
    display_name: "Speed King",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=speedking",
    role: "owner",
    status: "online",
    activity: "Playing GTA V"
  },
  {
    id: "2", 
    username: "racerlord",
    display_name: "Racer Lord",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=racerlord",
    role: "admin",
    status: "online",
    activity: "In speedrun attempt"
  },
  {
    id: "3",
    username: "fastfox",
    display_name: "Fast Fox",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=fastfox",
    role: "member",
    status: "away",
    activity: "AFK"
  }
];

const mockChannels: Channel[] = [
  { id: 1, name: "general", type: "text" },
  { id: 2, name: "speedrun-strats", type: "text" },
  { id: 3, name: "weekly-challenges", type: "text" },
  { id: 4, name: "General Voice", type: "voice", member_count: 3, is_active: true },
  { id: 5, name: "Speedrun Practice", type: "voice", member_count: 0 },
];

const mockMessages: Message[] = [
  {
    id: 1,
    author: mockMembers[0],
    content: "Welcome to GTA V Speedrunners Elite! 🏁 Don't forget to check out our weekly challenges in the pinned messages.",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    type: "text"
  },
  {
    id: 2,
    author: mockMembers[1],
    content: "Just hit a new PB on Any%! 1:47:23 😤 The new route through the jewelry store really pays off",
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    type: "text"
  },
  {
    id: 3,
    author: mockMembers[2],
    content: "Nice! Can you share that route in speedrun-strats? I'm still struggling with the getaway",
    timestamp: new Date(Date.now() - 900000).toISOString(),
    type: "text"
  }
];

export default function ServerPage() {
  const params = useParams();
  const { user } = useAuth();
  const [selectedChannel, setSelectedChannel] = useState<Channel>(mockChannels[0]);
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [newMessage, setNewMessage] = useState("");
  const [members] = useState<ServerMember[]>(mockMembers);
  const [muted, setMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);

  const serverName = "GTA V Speedrunners Elite";
  const currentUserRole = "member";

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: messages.length + 1,
      author: {
        id: user?.id || "current",
        username: "you",
        display_name: "You",
        avatar_url: user?.user_metadata?.avatar_url || "",
        role: "member",
        status: "online"
      },
      content: newMessage,
      timestamp: new Date().toISOString(),
      type: "text"
    };

    setMessages([...messages, message]);
    setNewMessage("");
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'text-yellow-500';
      case 'admin': return 'text-blue-500';
      case 'moderator': return 'text-green-500';
      default: return 'text-foreground';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="h-3 w-3" />;
      case 'admin': return <Shield className="h-3 w-3" />;
      case 'moderator': return <Star className="h-3 w-3" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="h-screen pt-16 flex bg-background">
      {/* Server Sidebar */}
      <div className="w-60 bg-secondary/50 border-r flex flex-col">
        {/* Server Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm truncate">{serverName}</h2>
            <Button size="icon" variant="ghost" className="h-6 w-6">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Channels */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            <div className="mb-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-2">
                Text Channels
              </p>
              {mockChannels.filter(c => c.type === 'text').map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => setSelectedChannel(channel)}
                  className={cn(
                    "w-full flex items-center px-2 py-1.5 rounded text-sm hover:bg-secondary/80 transition-colors text-left",
                    selectedChannel.id === channel.id && "bg-secondary text-primary"
                  )}
                >
                  <Hash className="h-4 w-4 mr-2 text-muted-foreground" />
                  {channel.name}
                </button>
              ))}
            </div>

            <div className="mb-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-2">
                Voice Channels
              </p>
              {mockChannels.filter(c => c.type === 'voice').map((channel) => (
                <div key={channel.id} className="mb-1">
                  <button className="w-full flex items-center justify-between px-2 py-1.5 rounded text-sm hover:bg-secondary/80 transition-colors text-left">
                    <div className="flex items-center">
                      <Volume2 className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{channel.name}</span>
                    </div>
                    {channel.member_count !== undefined && channel.member_count > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {channel.member_count}
                      </Badge>
                    )}
                  </button>
                  {channel.is_active && (
                    <div className="ml-6 space-y-1">
                      {members.filter(m => m.status === 'online').slice(0, channel.member_count).map((member) => (
                        <div key={member.id} className="flex items-center text-xs text-muted-foreground px-2 py-0.5">
                          <div className="relative mr-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          </div>
                          {member.display_name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>

        {/* User Panel */}
        <div className="p-2 border-t">
          <div className="flex items-center justify-between p-2 bg-secondary/50 rounded">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <div className={cn("absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background", getStatusColor("online"))}></div>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">You</p>
                <p className="text-xs text-muted-foreground truncate">Online</p>
              </div>
            </div>
            <div className="flex space-x-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => setMuted(!muted)}
                title={muted ? "Unmute" : "Mute"}
              >
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" title="Settings">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Channel Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Hash className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold">{selectedChannel.name}</h1>
            <Badge variant="outline" className="text-xs">
              {members.length} members
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button size="icon" variant="ghost">
              <Bell className="h-5 w-5" />
            </Button>
            <Button size="icon" variant="ghost">
              <UserPlus className="h-5 w-5" />
            </Button>
            <Button size="icon" variant="ghost">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message, index) => {
              const showAvatar = index === 0 || messages[index - 1].author.id !== message.author.id;
              return (
                <div key={message.id} className={cn("flex gap-3", !showAvatar && "ml-14")}>
                  {showAvatar && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={message.author.avatar_url} />
                      <AvatarFallback>{message.author.username[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className="flex-1 min-w-0">
                    {showAvatar && (
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={cn("font-semibold text-sm", getRoleColor(message.author.role))}>
                          {message.author.display_name}
                        </span>
                        {getRoleIcon(message.author.role)}
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="p-4 border-t">
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <Input
                placeholder={`Message #${selectedChannel.name}`}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                className="pr-20"
              />
              <div className="absolute right-2 top-2 flex space-x-1">
                <Button size="icon" variant="ghost" className="h-6 w-6">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-6 w-6">
                  <Smile className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="bg-gradient-to-r from-gaming-purple to-gaming-pink hover:opacity-90"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Members Sidebar */}
      <div className="w-60 bg-secondary/50 border-l">
        <div className="p-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            Members — {members.length}
          </h3>
          
          <div className="space-y-4">
            {/* Online Members */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                Online — {members.filter(m => m.status === 'online').length}
              </p>
              <div className="space-y-1">
                {members.filter(m => m.status === 'online').map((member) => (
                  <div key={member.id} className="flex items-center space-x-3 p-2 rounded hover:bg-secondary/50 transition-colors cursor-pointer">
                    <div className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar_url} />
                        <AvatarFallback>{member.username[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className={cn("absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background", getStatusColor(member.status))}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1">
                        <span className={cn("text-sm font-medium truncate", getRoleColor(member.role))}>
                          {member.display_name}
                        </span>
                        {getRoleIcon(member.role)}
                      </div>
                      {member.activity && (
                        <p className="text-xs text-muted-foreground truncate">{member.activity}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Offline Members */}
            {members.filter(m => m.status !== 'online').length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                  Offline — {members.filter(m => m.status !== 'online').length}
                </p>
                <div className="space-y-1">
                  {members.filter(m => m.status !== 'online').map((member) => (
                    <div key={member.id} className="flex items-center space-x-3 p-2 rounded hover:bg-secondary/50 transition-colors cursor-pointer opacity-60">
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.avatar_url} />
                          <AvatarFallback>{member.username[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className={cn("absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background", getStatusColor(member.status))}></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-1">
                          <span className={cn("text-sm font-medium truncate", getRoleColor(member.role))}>
                            {member.display_name}
                          </span>
                          {getRoleIcon(member.role)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
