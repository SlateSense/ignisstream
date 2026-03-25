import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  PanGestureHandler,
  PinchGestureHandler,
  State,
  StyleSheet
} from 'react-native';
import { Video, ResizeMode, VideoFullscreenUpdate } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import MobileStreamChat from './MobileStreamChat';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Stream {
  id: string;
  title: string;
  streamer_name: string;
  streamer_avatar?: string;
  viewer_count: number;
  is_live: boolean;
  game_name?: string;
  thumbnail_url?: string;
  stream_url: string;
  chat_enabled: boolean;
  categories: string[];
}

interface MobileStreamViewerProps {
  stream: Stream;
  onBack?: () => void;
  onShareStream?: () => void;
  onFollowStreamer?: () => void;
  enablePictureInPicture?: boolean;
}

export default function MobileStreamViewer({
  stream,
  onBack,
  onShareStream,
  onFollowStreamer,
  enablePictureInPicture = true
}: MobileStreamViewerProps) {
  const { theme } = useTheme();
  const { user } = useAuth();
  
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [videoStatus, setVideoStatus] = useState<any>(null);
  const [isPictureInPicture, setIsPictureInPicture] = useState(false);
  const [streamQuality, setStreamQuality] = useState<'auto' | '1080p' | '720p' | '480p'>('auto');
  const [volume, setVolume] = useState(1.0);
  
  // Animated values for gestures
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  
  // Control visibility timer
  const controlsTimerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Auto-hide controls after 3 seconds
    resetControlsTimer();
    
    return () => {
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current);
      }
    };
  }, []);

  const resetControlsTimer = () => {
    if (controlsTimerRef.current) {
      clearTimeout(controlsTimerRef.current);
    }
    
    setShowControls(true);
    controlsTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const handlePlayPause = async () => {
    try {
      if (videoRef.current) {
        if (isPlaying) {
          await videoRef.current.pauseAsync();
        } else {
          await videoRef.current.playAsync();
        }
        setIsPlaying(!isPlaying);
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
    }
  };

  const handleFullscreen = async () => {
    try {
      if (videoRef.current) {
        if (isFullscreen) {
          await videoRef.current.dismissFullscreenPlayer();
        } else {
          await videoRef.current.presentFullscreenPlayer();
        }
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  const handlePictureInPicture = async () => {
    if (!enablePictureInPicture) return;
    
    try {
      if (videoRef.current) {
        const result = await videoRef.current.startPictureInPictureAsync();
        setIsPictureInPicture(result);
      }
    } catch (error) {
      console.error('Picture-in-Picture not supported:', error);
      Alert.alert('Not Supported', 'Picture-in-Picture is not available on this device');
    }
  };

  const handleVideoLoad = (status: any) => {
    setVideoStatus(status);
    setIsLoading(!status.isLoaded);
    
    if (status.isLoaded) {
      setIsPlaying(!status.shouldPlay);
    }
  };

  const handleFullscreenUpdate = (event: VideoFullscreenUpdate) => {
    setIsFullscreen(event.fullscreenUpdate === VideoFullscreenUpdate.PLAYER_DID_PRESENT);
  };

  const handleFollowStreamer = () => {
    setIsFollowing(!isFollowing);
    if (onFollowStreamer) {
      onFollowStreamer();
    }
  };

  const handleShareStream = () => {
    if (onShareStream) {
      onShareStream();
    }
  };

  const handleQualityChange = (quality: typeof streamQuality) => {
    setStreamQuality(quality);
    // In a real implementation, this would switch the stream URL
    Alert.alert('Quality Changed', `Stream quality set to ${quality}`);
  };

  // Gesture handlers for pinch-to-zoom and pan
  const pinchGestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      runOnJS(resetControlsTimer)();
    },
    onActive: (event) => {
      scale.value = Math.max(0.5, Math.min(event.scale, 3));
    },
    onEnd: () => {
      if (scale.value < 1) {
        scale.value = withSpring(1);
      }
    },
  });

  const panGestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      runOnJS(resetControlsTimer)();
    },
    onActive: (event) => {
      if (scale.value > 1) {
        translateX.value = event.translationX;
        translateY.value = event.translationY;
      }
    },
    onEnd: () => {
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
    },
  });

  const animatedVideoStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  const renderStreamInfo = () => (
    <View style={styles.streamInfo}>
      <View style={styles.streamerInfo}>
        <View style={styles.streamerDetails}>
          <Text style={[styles.streamTitle, { color: theme.colors.text }]} numberOfLines={2}>
            {stream.title}
          </Text>
          <Text style={[styles.streamerName, { color: theme.colors.textSecondary }]}>
            {stream.streamer_name}
          </Text>
          
          <View style={styles.streamMeta}>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
            
            <Text style={[styles.viewerCount, { color: theme.colors.textSecondary }]}>
              {stream.viewer_count.toLocaleString()} viewers
            </Text>
            
            {stream.game_name && (
              <Text style={[styles.gameName, { color: theme.colors.textSecondary }]}>
                Playing {stream.game_name}
              </Text>
            )}
          </View>
        </View>
        
        <TouchableOpacity 
          style={[
            styles.followButton,
            { backgroundColor: isFollowing ? theme.colors.primary : 'transparent' },
            { borderColor: theme.colors.primary }
          ]}
          onPress={handleFollowStreamer}
        >
          <Text style={[
            styles.followButtonText,
            { color: isFollowing ? '#FFFFFF' : theme.colors.primary }
          ]}>
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderVideoControls = () => (
    <Animated.View 
      style={[
        styles.videoControlsOverlay,
        { opacity: showControls ? 1 : 0 }
      ]}
      pointerEvents={showControls ? 'auto' : 'none'}
    >
      {/* Top Controls */}
      <LinearGradient
        colors={['rgba(0,0,0,0.7)', 'transparent']}
        style={styles.topControls}
      >
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.topRightControls}>
          <TouchableOpacity style={styles.controlButton} onPress={handleShareStream}>
            <Ionicons name="share-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          
          {enablePictureInPicture && (
            <TouchableOpacity style={styles.controlButton} onPress={handlePictureInPicture}>
              <Ionicons name="resize-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Center Play/Pause */}
      <View style={styles.centerControls}>
        <TouchableOpacity style={styles.playPauseButton} onPress={handlePlayPause}>
          <Ionicons 
            name={isPlaying ? "pause" : "play"} 
            size={48} 
            color="#FFFFFF" 
          />
        </TouchableOpacity>
      </View>

      {/* Bottom Controls */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={styles.bottomControls}
      >
        <View style={styles.bottomControlsContent}>
          <TouchableOpacity style={styles.controlButton}>
            <Ionicons name="volume-high" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.qualitySelector}>
            <TouchableOpacity 
              style={styles.qualityButton}
              onPress={() => {
                Alert.alert(
                  'Stream Quality',
                  'Select stream quality',
                  [
                    { text: 'Auto', onPress: () => handleQualityChange('auto') },
                    { text: '1080p', onPress: () => handleQualityChange('1080p') },
                    { text: '720p', onPress: () => handleQualityChange('720p') },
                    { text: '480p', onPress: () => handleQualityChange('480p') },
                    { text: 'Cancel', style: 'cancel' }
                  ]
                );
              }}
            >
              <Text style={styles.qualityText}>{streamQuality}</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={styles.controlButton} onPress={handleFullscreen}>
            <Ionicons name="expand" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          
          {stream.chat_enabled && (
            <TouchableOpacity 
              style={styles.controlButton} 
              onPress={() => setShowChat(!showChat)}
            >
              <Ionicons 
                name="chatbubbles" 
                size={20} 
                color={showChat ? theme.colors.primary : "#FFFFFF"} 
              />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      {/* Video Player */}
      <View style={styles.videoContainer}>
        <PinchGestureHandler onGestureEvent={pinchGestureHandler}>
          <Animated.View style={[styles.gestureContainer, animatedVideoStyle]}>
            <PanGestureHandler onGestureEvent={panGestureHandler}>
              <Animated.View style={styles.videoWrapper}>
                <Video
                  ref={videoRef}
                  source={{ uri: stream.stream_url }}
                  style={styles.video}
                  shouldPlay={isPlaying}
                  isLooping={false}
                  isMuted={false}
                  volume={volume}
                  rate={1.0}
                  resizeMode={ResizeMode.CONTAIN}
                  onPlaybackStatusUpdate={handleVideoLoad}
                  onFullscreenUpdate={handleFullscreenUpdate}
                  useNativeControls={false}
                />
                
                {/* Loading Overlay */}
                {isLoading && (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={styles.loadingText}>Loading stream...</Text>
                  </View>
                )}
                
                {/* Video Controls */}
                {renderVideoControls()}
                
                {/* Tap to show/hide controls */}
                <TouchableOpacity 
                  style={styles.tapOverlay}
                  onPress={resetControlsTimer}
                  activeOpacity={1}
                />
              </Animated.View>
            </PanGestureHandler>
          </Animated.View>
        </PinchGestureHandler>
      </View>

      {/* Stream Info (only in portrait) */}
      {!isFullscreen && renderStreamInfo()}

      {/* Chat Panel */}
      {showChat && stream.chat_enabled && !isFullscreen && (
        <View style={[styles.chatContainer, { backgroundColor: theme.colors.surface }]}>
          <MobileStreamChat 
            streamId={stream.id}
            onClose={() => setShowChat(false)}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  videoContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * (9 / 16), // 16:9 aspect ratio
    backgroundColor: '#000000',
    position: 'relative',
  },
  gestureContainer: {
    flex: 1,
  },
  videoWrapper: {
    flex: 1,
    position: 'relative',
  },
  video: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
  },
  tapOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  videoControlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  topRightControls: {
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  centerControls: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPauseButton: {
    padding: 16,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  bottomControls: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  bottomControlsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qualitySelector: {
    flex: 1,
    alignItems: 'center',
  },
  qualityButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  qualityText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  streamInfo: {
    padding: 16,
  },
  streamerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  streamerDetails: {
    flex: 1,
    marginRight: 16,
  },
  streamTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  streamerName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  streamMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  liveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    marginRight: 4,
  },
  liveText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  viewerCount: {
    fontSize: 14,
  },
  gameName: {
    fontSize: 14,
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chatContainer: {
    flex: 1,
    marginTop: 1,
  },
});
