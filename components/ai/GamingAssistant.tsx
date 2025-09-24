"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bot, 
  Send, 
  Mic, 
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Gamepad2,
  Target,
  Trophy,
  Users,
  Clock,
  MessageSquare,
  X,
  Minimize2,
  Maximize2,
  Settings,
  Lightbulb,
  TrendingUp,
  Map,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  attachments?: {
    type: 'strategy' | 'tip' | 'build' | 'route';
    title: string;
    data: any;
  }[];
}

interface AIPersonality {
  id: string;
  name: string;
  description: string;
  avatar: string;
  specialties: string[];
  greeting: string;
}

const aiPersonalities: AIPersonality[] = [
  {
    id: "ignis",
    name: "Ignis",
    description: "General gaming assistant with expertise across all games",
    avatar: "🤖",
    specialties: ["General Gaming", "Strategy", "Tips", "Multiplayer"],
    greeting: "Hey there, gamer! I'm Ignis, your AI gaming companion. What game are we tackling today?"
  },
  {
    id: "tactical",
    name: "Tactical",
    description: "Specialized in competitive FPS games and esports strategy",
    avatar: "🎯",
    specialties: ["FPS Games", "Competitive", "Aim Training", "Team Strategy"],
    greeting: "Ready to dominate the competition? I'm here to help you climb the ranks!"
  },
  {
    id: "creative",
    name: "Creative",
    description: "Expert in sandbox games, building, and creative projects",
    avatar: "🎨",
    specialties: ["Minecraft", "Building", "Creative Projects", "Tutorials"],
    greeting: "Let's build something amazing together! What's your creative vision today?"
  },
  {
    id: "speedster",
    name: "Speedster", 
    description: "Speedrunning expert with knowledge of optimal routes and tricks",
    avatar: "⚡",
    specialties: ["Speedrunning", "Route Optimization", "Glitches", "Time Saves"],
    greeting: "Time to break some records! What speedrun are we optimizing today?"
  }
];

const mockConversation: Message[] = [
  {
    id: "1",
    type: "system",
    content: "Ignis AI Assistant activated. Gaming session detected: Valorant",
    timestamp: new Date(Date.now() - 300000)
  },
  {
    id: "2", 
    type: "assistant",
    content: "I notice you're playing Valorant! Your recent matches show you're struggling with entry fragging. Would you like some tips on positioning and timing for better site takes?",
    timestamp: new Date(Date.now() - 240000),
    suggestions: ["Show me positioning tips", "Analyze my recent matches", "Recommend aim training", "Team communication advice"]
  },
  {
    id: "3",
    type: "user", 
    content: "Show me positioning tips",
    timestamp: new Date(Date.now() - 180000)
  },
  {
    id: "4",
    type: "assistant",
    content: "Here are key entry fragging positions for Ascent:\n\n🎯 **A Main**: Use the boxes for cover, pre-aim common angles\n🎯 **B Main**: Clear close corners first, utilize smoke cover\n🎯 **Mid**: Control market area before rotating\n\nRemember: Information gathering > aggressive peeking. Your team's utility should set you up for success!",
    timestamp: new Date(Date.now() - 120000),
    attachments: [{
      type: "strategy",
      title: "Ascent Entry Routes",
      data: { map: "Ascent", routes: ["A Main", "B Main", "Mid Control"] }
    }]
  }
];

interface GamingAssistantProps {
  isOpen?: boolean;
  onToggle?: () => void;
  className?: string;
}

export default function GamingAssistant({ 
  isOpen = false, 
  onToggle,
  className 
}: GamingAssistantProps) {
  const [messages, setMessages] = useState<Message[]>(mockConversation);
  const [inputMessage, setInputMessage] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedPersonality, setSelectedPersonality] = useState(aiPersonalities[0]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [settings, setSettings] = useState({
    voiceEnabled: true,
    autoSuggestions: true,
    gameDetection: true,
    proactiveHelp: true
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = (content?: string) => {
    const messageContent = content || inputMessage.trim();
    if (!messageContent) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: messageContent,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = generateAIResponse(messageContent);
      setMessages(prev => [...prev, aiResponse]);
    }, 1000 + Math.random() * 2000);
  };

  const generateAIResponse = (userInput: string): Message => {
    const responses = {
      "aim training": {
        content: "Here's a customized aim training routine:\n\n🎯 **Warm-up (10 min)**:\n• Gridshot: 2 rounds\n• Tracking: 3 minutes\n\n🎯 **Main Training (20 min)**:\n• Microflick: 5 rounds\n• Target switching: 10 minutes\n• Reflex training: 5 minutes\n\n💡 **Pro tip**: Focus on crosshair placement over flick speed!",
        suggestions: ["Show advanced drills", "Analyze my aim stats", "Recommend sensitivity", "Track my progress"]
      },
      "strategy": {
        content: "Let me break down the current meta strategy for your rank:\n\n📊 **Team Composition**: 1 Controller, 1 Initiator, 2 Duelists, 1 Sentinel\n\n🛡️ **Defense**: Play for picks, rotate quickly on info\n⚔️ **Attack**: Default setup → Execute on weakest site\n\n💡 **Current patch changes**: Jett updraft nerf affects vertical control",
        suggestions: ["Map-specific strategies", "Counter enemy picks", "Economy management", "Clutch scenarios"]
      },
      "default": {
        content: `Based on your ${selectedPersonality.specialties[0]} focus, here are some personalized recommendations:\n\n✨ **Quick Tips**:\n• Practice in aim trainers for 15min before ranked\n• Review your last 3 matches for positioning errors\n• Focus on one agent to master their utility\n\n🎮 **Today's Goals**: Improve your crosshair placement and pre-aim common angles!`,
        suggestions: ["Detailed game analysis", "Custom training plan", "Find teammates", "Track improvement"]
      }
    };

    const response = responses[userInput.toLowerCase().includes("aim") ? "aim training" : 
                               userInput.toLowerCase().includes("strategy") ? "strategy" : "default"];

    return {
      id: Date.now().toString(),
      type: "assistant",
      content: response.content,
      timestamp: new Date(),
      suggestions: response.suggestions
    };
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const toggleVoice = () => {
    setIsListening(!isListening);
    // Implement speech recognition
  };

  const getPersonalityIcon = (personality: AIPersonality) => {
    return (
      <div className="text-2xl">
        {personality.avatar}
      </div>
    );
  };

  if (!isOpen) {
    return (
      <Button
        onClick={onToggle}
        className={cn(
          "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50",
          "bg-gradient-to-r from-gaming-purple to-gaming-pink hover:opacity-90",
          className
        )}
      >
        <Bot className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <div className={cn(
      "fixed bottom-6 right-6 z-50 w-96 h-[600px] flex flex-col",
      isMinimized && "h-16",
      className
    )}>
      <Card className="h-full flex flex-col shadow-xl border-primary/20">
        {/* Header */}
        <CardHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getPersonalityIcon(selectedPersonality)}
              <div>
                <h3 className="font-semibold text-sm">{selectedPersonality.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {selectedPersonality.description}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={onToggle}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <>
            {/* Messages */}
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-full p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className="space-y-3">
                      <div className={cn(
                        "flex gap-3",
                        message.type === "user" && "flex-row-reverse"
                      )}>
                        {message.type !== "system" && (
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            {message.type === "assistant" ? (
                              <div className="bg-gradient-to-r from-gaming-purple to-gaming-pink rounded-full h-full w-full flex items-center justify-center text-white text-xs">
                                {selectedPersonality.avatar}
                              </div>
                            ) : (
                              <AvatarFallback>U</AvatarFallback>
                            )}
                          </Avatar>
                        )}
                        <div className={cn(
                          "flex-1 space-y-2",
                          message.type === "user" && "text-right"
                        )}>
                          {message.type === "system" ? (
                            <div className="text-center">
                              <Badge variant="outline" className="text-xs">
                                {message.content}
                              </Badge>
                            </div>
                          ) : (
                            <div className={cn(
                              "inline-block p-3 rounded-lg max-w-[85%] text-sm",
                              message.type === "user" 
                                ? "bg-primary text-primary-foreground ml-auto" 
                                : "bg-muted"
                            )}>
                              <div className="whitespace-pre-wrap">{message.content}</div>
                            </div>
                          )}

                          {/* Attachments */}
                          {message.attachments && (
                            <div className="space-y-2">
                              {message.attachments.map((attachment, i) => (
                                <Card key={i} className="border-primary/20">
                                  <CardContent className="p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Map className="h-4 w-4 text-primary" />
                                      <span className="text-sm font-medium">
                                        {attachment.title}
                                      </span>
                                    </div>
                                    <Button size="sm" variant="outline" className="w-full">
                                      View Details
                                    </Button>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}

                          {/* Suggestions */}
                          {message.suggestions && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {message.suggestions.map((suggestion, i) => (
                                <Button
                                  key={i}
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-7"
                                  onClick={() => handleSuggestionClick(suggestion)}
                                >
                                  {suggestion}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </CardContent>

            {/* Input */}
            <div className="p-4 border-t">
              <div className="space-y-3">
                {/* Quick Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => sendMessage("Give me tips for this game")}
                  >
                    <Lightbulb className="h-3 w-3 mr-1" />
                    Tips
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => sendMessage("Analyze my performance")}
                  >
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Analysis
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => sendMessage("Find teammates")}
                  >
                    <Users className="h-3 w-3 mr-1" />
                    Team
                  </Button>
                </div>

                {/* Message Input */}
                <div className="flex items-center space-x-2">
                  <div className="flex-1 relative">
                    <Input
                      ref={inputRef}
                      placeholder="Ask me anything about gaming..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                      className="pr-10"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className={cn(
                        "absolute right-1 top-1 h-8 w-8",
                        isListening && "text-red-500"
                      )}
                      onClick={toggleVoice}
                    >
                      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button 
                    onClick={() => sendMessage()}
                    disabled={!inputMessage.trim()}
                    className="bg-gradient-to-r from-gaming-purple to-gaming-pink hover:opacity-90"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                {/* Personality Selector */}
                <Select
                  value={selectedPersonality.id}
                  onValueChange={(value) => {
                    const personality = aiPersonalities.find(p => p.id === value);
                    if (personality) setSelectedPersonality(personality);
                  }}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {aiPersonalities.map((personality) => (
                      <SelectItem key={personality.id} value={personality.id}>
                        <div className="flex items-center space-x-2">
                          <span>{personality.avatar}</span>
                          <span>{personality.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
