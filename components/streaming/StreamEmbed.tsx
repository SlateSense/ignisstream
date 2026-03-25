"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Volume2, VolumeX, Maximize, ExternalLink, Users, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface StreamEmbedProps {
  platform: 'twitch' | 'youtube';
  channelId: string;
  channelName: string;
  title?: string;
  viewerCount?: number;
  isLive?: boolean;
  thumbnail?: string;
  className?: string;
  autoplay?: boolean;
}

export default function StreamEmbed({ 
  platform, 
  channelId, 
  channelName,
  title,
  viewerCount = 0,
  isLive = false,
  thumbnail,
  className,
  autoplay = false
}: StreamEmbedProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [muted, setMuted] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const getTwitchEmbedUrl = (channelId: string, autoplay: boolean = false) => {
    const params = new URLSearchParams({
      channel: channelId,
      parent: window.location.hostname,
      autoplay: autoplay.toString(),
      muted: 'true'
    });
    return `https://player.twitch.tv/?${params.toString()}`;
  };

  const getYouTubeEmbedUrl = (channelId: string, autoplay: boolean = false) => {
    const params = new URLSearchParams({
      channel: channelId,
      autoplay: autoplay ? '1' : '0',
      mute: '1',
      controls: '1',
      rel: '0',
      modestbranding: '1'
    });
    return `https://www.youtube.com/embed/live_stream?${params.toString()}`;
  };

  const getEmbedUrl = () => {
    switch (platform) {
      case 'twitch':
        return getTwitchEmbedUrl(channelId, showPlayer && autoplay);
      case 'youtube':
        return getYouTubeEmbedUrl(channelId, showPlayer && autoplay);
      default:
        return '';
    }
  };

  const getPlatformColor = () => {
    switch (platform) {
      case 'twitch':
        return 'bg-purple-600';
      case 'youtube':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getPlatformName = () => {
    switch (platform) {
      case 'twitch':
        return 'Twitch';
      case 'youtube':
        return 'YouTube';
      default:
        return 'Stream';
    }
  };

  const getExternalUrl = () => {
    switch (platform) {
      case 'twitch':
        return `https://www.twitch.tv/${channelId}`;
      case 'youtube':
        return `https://www.youtube.com/@${channelId}/live`;
      default:
        return '';
    }
  };

  const handlePlay = () => {
    setShowPlayer(true);
  };

  const toggleMute = () => {
    setMuted(!muted);
    // Send message to iframe to toggle mute (platform-specific)
    if (iframeRef.current) {
      // This would need platform-specific implementation
    }
  };

  if (!showPlayer) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <div className="relative aspect-video bg-black">
          {/* Thumbnail */}
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: thumbnail ? `url(${thumbnail})` : 'none',
              backgroundColor: thumbnail ? 'transparent' : '#000'
            }}
          />
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Button
              onClick={handlePlay}
              size="lg"
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm"
            >
              <Play className="h-8 w-8 mr-2" />
              Watch Stream
            </Button>
          </div>

          {/* Live Badge */}
          {isLive && (
            <div className="absolute top-4 left-4">
              <Badge className="bg-red-600 hover:bg-red-600">
                <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse" />
                LIVE
              </Badge>
            </div>
          )}

          {/* Platform Badge */}
          <div className="absolute top-4 right-4">
            <Badge className={cn(getPlatformColor(), "hover:opacity-90")}>
              {getPlatformName()}
            </Badge>
          </div>

          {/* Viewer Count */}
          {isLive && viewerCount > 0 && (
            <div className="absolute bottom-4 right-4 flex items-center gap-1 text-white text-sm bg-black/50 px-2 py-1 rounded">
              <Eye className="h-4 w-4" />
              {viewerCount.toLocaleString()}
            </div>
          )}
        </div>

        <CardHeader>
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback>
                {channelName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold line-clamp-2">
                {title || `${channelName} - Live on ${getPlatformName()}`}
              </h3>
              <p className="text-sm text-muted-foreground">
                {channelName}
              </p>
              {isLive && (
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {viewerCount.toLocaleString()} viewers
                  </span>
                </div>
              )}
            </div>
            <Button variant="ghost" size="sm" asChild>
              <a href={getExternalUrl()} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="relative aspect-video bg-black">
        <iframe
          ref={iframeRef}
          src={getEmbedUrl()}
          className="w-full h-full"
          frameBorder="0"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          onLoad={() => setIsLoaded(true)}
        />
        
        {/* Loading Overlay */}
        {!isLoaded && (
          <div className="absolute inset-0 bg-black flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}

        {/* Controls Overlay */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="bg-black/50 hover:bg-black/70"
            onClick={toggleMute}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="bg-black/50 hover:bg-black/70"
            onClick={() => iframeRef.current?.requestFullscreen()}
          >
            <Maximize className="h-4 w-4" />
          </Button>
        </div>

        {/* Live Badge */}
        {isLive && (
          <div className="absolute top-4 left-4">
            <Badge className="bg-red-600 hover:bg-red-600">
              <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse" />
              LIVE
            </Badge>
          </div>
        )}
      </div>

      <CardHeader>
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback>
              {channelName[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold line-clamp-2">
              {title || `${channelName} - Live on ${getPlatformName()}`}
            </h3>
            <p className="text-sm text-muted-foreground">
              {channelName}
            </p>
            {isLive && (
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {viewerCount.toLocaleString()} viewers
                </span>
              </div>
            )}
          </div>
          <Button variant="ghost" size="sm" asChild>
            <a href={getExternalUrl()} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
}
