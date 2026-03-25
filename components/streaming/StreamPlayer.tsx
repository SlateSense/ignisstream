"use client";

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Settings,
  Users,
  Heart,
  Share,
  Flag,
  MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Stream } from '@/lib/streaming/stream-manager';

interface StreamPlayerProps {
  stream: Stream;
  autoplay?: boolean;
  onViewerJoin?: () => void;
  onViewerLeave?: () => void;
}

export default function StreamPlayer({ 
  stream, 
  autoplay = false,
  onViewerJoin,
  onViewerLeave 
}: StreamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState([75]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [quality, setQuality] = useState('auto');
  const [isFollowing, setIsFollowing] = useState(false);
  const [likes, setLikes] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Initialize HLS.js for stream playback
    if (stream.hls_url && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = stream.hls_url;
    } else if (window.Hls && window.Hls.isSupported()) {
      const hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });
      
      hls.loadSource(stream.hls_url || '');
      hls.attachMedia(video);
      
      hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
        if (autoplay) {
          video.play().catch(console.error);
        }
      });

      hls.on(window.Hls.Events.ERROR, (event, data) => {
        console.error('HLS Error:', data);
      });

      return () => {
        hls.destroy();
      };
    }

    // Viewer tracking
    const handlePlay = () => {
      setIsPlaying(true);
      onViewerJoin?.();
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleDurationChange = () => {
      setDuration(video.duration);
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      onViewerLeave?.();
    };
  }, [stream.hls_url, autoplay, onViewerJoin, onViewerLeave]);

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (isPlaying) {
        await video.pause();
      } else {
        await video.play();
      }
    } catch (error) {
      console.error('Playback error:', error);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleVolumeChange = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    const vol = value[0] / 100;
    video.volume = vol;
    setVolume(value);
    setIsMuted(vol === 0);
  };

  const toggleFullscreen = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (!isFullscreen) {
        await video.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    // TODO: Implement actual follow/unfollow API call
  };

  const handleLike = () => {
    setLikes(prev => prev + (likes > 0 ? -1 : 1));
    // TODO: Implement actual like API call
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative bg-black rounded-lg overflow-hidden group">
      <video
        ref={videoRef}
        className="w-full aspect-video object-contain"
        poster={stream.thumbnail_url}
        playsInline
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      />

      {/* Stream Info Overlay */}
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Badge className="bg-red-500 text-white animate-pulse">
            ● LIVE
          </Badge>
          <Badge variant="secondary" className="bg-black/50 text-white">
            {stream.viewer_count.toLocaleString()} viewers
          </Badge>
          {stream.category && (
            <Badge variant="secondary" className="bg-black/50 text-white">
              {stream.category}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="bg-black/50 text-white hover:bg-black/70"
            onClick={handleFollow}
          >
            <Heart className={cn("h-4 w-4 mr-2", isFollowing && "fill-current text-red-500")} />
            {isFollowing ? 'Following' : 'Follow'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="bg-black/50 text-white hover:bg-black/70"
          >
            <Share className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="bg-black/50 text-white hover:bg-black/70"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Streamer Info */}
      <div className="absolute bottom-20 left-4 right-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : 20 }}
          className="bg-black/75 backdrop-blur-sm rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-white/20">
                <AvatarImage src={(stream as any).streamer?.avatar_url} />
                <AvatarFallback>
                  {(stream as any).streamer?.username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-white font-semibold">{stream.title}</h3>
                <p className="text-white/70 text-sm">
                  {(stream as any).streamer?.display_name}
                </p>
              </div>
            </div>
            
            <Button
              size="sm"
              onClick={handleLike}
              variant="ghost"
              className="text-white hover:bg-white/10"
            >
              <Heart className={cn("h-4 w-4 mr-2", likes > 0 && "fill-current text-red-500")} />
              {likes > 0 ? likes.toLocaleString() : 'Like'}
            </Button>
          </div>
          
          {stream.description && (
            <p className="text-white/80 text-sm line-clamp-2">
              {stream.description}
            </p>
          )}
        </motion.div>
      </div>

      {/* Video Controls */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showControls ? 1 : 0 }}
        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4"
      >
        <div className="flex items-center gap-4">
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/10"
            onClick={togglePlay}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/10"
              onClick={toggleMute}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <Slider
              value={volume}
              onValueChange={handleVolumeChange}
              max={100}
              step={1}
              className="w-20"
            />
          </div>

          <div className="flex-1" />

          <span className="text-white text-sm">
            {formatTime(currentTime)} / {stream.status === 'live' ? 'LIVE' : formatTime(duration)}
          </span>

          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/10"
          >
            <Settings className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/10"
            onClick={toggleFullscreen}
          >
            <Maximize className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      {/* Loading State */}
      {!isPlaying && stream.status === 'live' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white">Loading stream...</p>
          </div>
        </div>
      )}

      {/* Offline State */}
      {stream.status === 'offline' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/75">
          <div className="text-center">
            <Users className="h-16 w-16 text-white/50 mx-auto mb-4" />
            <h3 className="text-white text-xl font-semibold mb-2">Stream Offline</h3>
            <p className="text-white/70">
              {(stream as any).streamer?.display_name} is not currently streaming
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
