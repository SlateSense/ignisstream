'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Zap, 
  Skull, 
  Target, 
  Trophy, 
  Clock, 
  Users, 
  Wifi, 
  WifiOff,
  Play,
  Square,
  Volume2,
  VolumeX
} from 'lucide-react';
import { LiveMatchUpdate, WebSocketMessage } from '@/lib/gaming/game-api-manager';
import { formatDistanceToNow } from 'date-fns';

interface LiveMatchUpdatesProps {
  userId: string;
  matchId?: string;
  gameId?: string;
  onMatchUpdate?: (update: LiveMatchUpdate) => void;
  className?: string;
}

interface MatchEvent {
  id: string;
  type: 'kill' | 'death' | 'objective' | 'round_end' | 'match_end';
  playerId: string;
  playerName: string;
  data: any;
  timestamp: string;
}

export function LiveMatchUpdates({ 
  userId, 
  matchId, 
  gameId, 
  onMatchUpdate,
  className = ''
}: LiveMatchUpdatesProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!userId) return;

    const connectWebSocket = () => {
      const wsUrl = `ws://localhost:3001/ws/${userId}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        console.log('Connected to live updates');
        
        // Join specific game/match if provided
        if (gameId) {
          ws.send(JSON.stringify({
            type: 'join_game',
            gameId
          }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        console.log('Disconnected from live updates');
        
        // Attempt to reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [userId, gameId]);

  useEffect(() => {
    // Initialize audio for notifications
    audioRef.current = new Audio('/sounds/notification.mp3');
  }, []);

  const handleWebSocketMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'match_update':
        const update = message.payload as LiveMatchUpdate;
        
        // Only show updates for current match or if no specific match
        if (!matchId || update.matchId === matchId) {
          const newEvent: MatchEvent = {
            id: `${update.matchId}-${Date.now()}`,
            type: update.type,
            playerId: update.playerId,
            playerName: update.data.playerName || 'Unknown Player',
            data: update.data,
            timestamp: update.timestamp
          };

          setEvents(prev => [newEvent, ...prev.slice(0, 49)]); // Keep last 50 events
          
          // Play sound notification
          if (soundEnabled && audioRef.current) {
            audioRef.current.play().catch(() => {});
          }

          // Callback for parent component
          onMatchUpdate?.(update);
        }
        break;
        
      case 'friend_match_update':
        // Handle friend's match updates
        if (message.payload.userId !== userId) {
          const friendUpdate = message.payload.update as LiveMatchUpdate;
          const newEvent: MatchEvent = {
            id: `friend-${friendUpdate.matchId}-${Date.now()}`,
            type: friendUpdate.type,
            playerId: friendUpdate.playerId,
            playerName: `${message.payload.friendName || 'Friend'} - ${friendUpdate.data.playerName || 'Unknown'}`,
            data: friendUpdate.data,
            timestamp: friendUpdate.timestamp
          };

          setEvents(prev => [newEvent, ...prev.slice(0, 49)]);
        }
        break;
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'kill': return <Zap className="h-4 w-4 text-green-500" />;
      case 'death': return <Skull className="h-4 w-4 text-red-500" />;
      case 'objective': return <Target className="h-4 w-4 text-blue-500" />;
      case 'round_end': return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 'match_end': return <Trophy className="h-4 w-4 text-purple-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getEventDescription = (event: MatchEvent) => {
    switch (event.type) {
      case 'kill':
        return `eliminated ${event.data.targetName || 'an opponent'}${event.data.weapon ? ` with ${event.data.weapon}` : ''}`;
      case 'death':
        return `was eliminated${event.data.killerName ? ` by ${event.data.killerName}` : ''}`;
      case 'objective':
        return `${event.data.action || 'completed objective'} ${event.data.objectiveName || ''}`;
      case 'round_end':
        return `${event.data.result === 'win' ? 'won' : 'lost'} the round`;
      case 'match_end':
        return `${event.data.result === 'win' ? 'won' : 'lost'} the match!`;
      default:
        return 'performed an action';
    }
  };

  const toggleLive = () => {
    setIsLive(!isLive);
    if (!isLive && wsRef.current && gameId) {
      wsRef.current.send(JSON.stringify({
        type: 'join_game',
        gameId
      }));
    }
  };

  const clearEvents = () => {
    setEvents([]);
  };

  return (
    <Card className={`${className} border-l-4 ${isConnected ? 'border-l-green-500' : 'border-l-red-500'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
            Live Match Updates
            {events.length > 0 && (
              <Badge variant="secondary">{events.length}</Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost" 
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLive}
              className={isLive ? 'text-red-500' : 'text-green-500'}
            >
              {isLive ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          {isConnected ? 'Connected' : 'Reconnecting...'}
          {matchId && <span>• Match: {matchId.slice(-8)}</span>}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-80" ref={scrollAreaRef}>
          <div className="p-4 space-y-3">
            {events.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No live updates yet</p>
                <p className="text-sm">Updates will appear here when matches are active</p>
              </div>
            ) : (
              events.map((event) => (
                <div key={event.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-shrink-0 mt-1">
                    {getEventIcon(event.type)}
                  </div>
                  
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={`/avatars/${event.playerId}.png`} />
                        <AvatarFallback className="text-xs">
                          {event.playerName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm truncate">
                        {event.playerName}
                      </span>
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                      >
                        {event.type.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {getEventDescription(event)}
                    </p>
                    
                    {event.data.score && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Score: {event.data.score}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-shrink-0 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        
        {events.length > 0 && (
          <div className="p-4 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearEvents}
              className="w-full"
            >
              Clear Events
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
