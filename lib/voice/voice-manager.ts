import { createClient } from '@/lib/supabase/client';

export interface VoiceChannel {
  id: string;
  name: string;
  type: 'team' | 'match' | 'lobby' | 'tournament';
  game_id?: string;
  match_id?: string;
  tournament_id?: string;
  max_participants: number;
  current_participants: number;
  is_spatial: boolean;
  is_private: boolean;
  created_by: string;
  created_at: string;
  participants: VoiceParticipant[];
}

export interface VoiceParticipant {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  is_muted: boolean;
  is_deafened: boolean;
  is_speaking: boolean;
  volume: number;
  position?: { x: number; y: number; z: number }; // For spatial audio
  role: 'leader' | 'member' | 'spectator';
  joined_at: string;
}

export interface VoiceSettings {
  inputDeviceId: string;
  outputDeviceId: string;
  inputVolume: number;
  outputVolume: number;
  pushToTalkEnabled: boolean;
  pushToTalkKey: string;
  voiceActivationEnabled: boolean;
  voiceActivationThreshold: number;
  noiseSuppression: boolean;
  echoCancellation: boolean;
  autoGainControl: boolean;
  spatialAudioEnabled: boolean;
  maxDistance: number;
  rolloffFactor: number;
}

export interface AudioStats {
  inputLevel: number;
  outputLevel: number;
  packetLoss: number;
  latency: number;
  jitter: number;
  bitrate: number;
}

export type VoiceEventType = 
  | 'user-joined'
  | 'user-left' 
  | 'user-muted'
  | 'user-unmuted'
  | 'user-speaking'
  | 'user-stopped-speaking'
  | 'position-updated'
  | 'channel-created'
  | 'channel-destroyed';

export interface VoiceEvent {
  type: VoiceEventType;
  channel_id: string;
  user_id?: string;
  data?: any;
  timestamp: number;
}

export class VoiceManager {
  private supabase = createClient();
  private localStream: MediaStream | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private spatialNodes: Map<string, { panner: PannerNode; gain: GainNode }> = new Map();
  private currentChannel: VoiceChannel | null = null;
  private settings: VoiceSettings;
  private eventListeners: Map<VoiceEventType, ((event: VoiceEvent) => void)[]> = new Map();
  private voiceActivityDetector: VoiceActivityDetector | null = null;
  private pushToTalkActive = false;
  private keyboardListener: ((e: KeyboardEvent) => void) | null = null;

  constructor() {
    this.settings = this.getDefaultSettings();
    this.initializeAudioContext();
    this.loadSettings();
  }

  private getDefaultSettings(): VoiceSettings {
    return {
      inputDeviceId: 'default',
      outputDeviceId: 'default',
      inputVolume: 50,
      outputVolume: 80,
      pushToTalkEnabled: false,
      pushToTalkKey: 'KeyV',
      voiceActivationEnabled: true,
      voiceActivationThreshold: -40,
      noiseSuppression: true,
      echoCancellation: true,
      autoGainControl: true,
      spatialAudioEnabled: false,
      maxDistance: 50,
      rolloffFactor: 1
    };
  }

  private async initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  }

  private loadSettings() {
    const saved = localStorage.getItem('voice-settings');
    if (saved) {
      try {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      } catch (error) {
        console.error('Failed to load voice settings:', error);
      }
    }
  }

  private saveSettings() {
    localStorage.setItem('voice-settings', JSON.stringify(this.settings));
  }

  // Channel Management
  async createChannel(options: {
    name: string;
    type: VoiceChannel['type'];
    game_id?: string;
    match_id?: string;
    tournament_id?: string;
    max_participants?: number;
    is_spatial?: boolean;
    is_private?: boolean;
  }): Promise<VoiceChannel | null> {
    try {
      const channelData = {
        id: crypto.randomUUID(),
        name: options.name,
        type: options.type,
        game_id: options.game_id,
        match_id: options.match_id,
        tournament_id: options.tournament_id,
        max_participants: options.max_participants || 10,
        current_participants: 0,
        is_spatial: options.is_spatial || false,
        is_private: options.is_private || false,
        created_by: 'current_user_id', // Would get from auth context
        created_at: new Date().toISOString(),
        participants: []
      };

      // Create channel in database
      const { error } = await this.supabase
        .from('voice_channels')
        .insert(channelData);

      if (error) throw error;

      return channelData;
    } catch (error) {
      console.error('Failed to create voice channel:', error);
      return null;
    }
  }

  async joinChannel(channelId: string): Promise<boolean> {
    try {
      // Get channel info
      const { data: channelData, error } = await this.supabase
        .from('voice_channels')
        .select('*')
        .eq('id', channelId)
        .single();

      if (error) throw error;

      this.currentChannel = channelData;

      // Initialize media stream
      await this.initializeMediaStream();

      // Set up spatial audio if enabled
      if (channelData.is_spatial && this.settings.spatialAudioEnabled) {
        this.setupSpatialAudio();
      }

      // Set up push-to-talk
      this.setupPushToTalk();

      // Initialize voice activity detection
      if (this.settings.voiceActivationEnabled) {
        this.initializeVoiceActivityDetection();
      }

      // Join signaling channel
      await this.joinSignalingChannel(channelId);

      this.emitEvent({
        type: 'user-joined',
        channel_id: channelId,
        user_id: 'current_user_id',
        timestamp: Date.now()
      });

      return true;
    } catch (error) {
      console.error('Failed to join voice channel:', error);
      return false;
    }
  }

  async leaveChannel(): Promise<boolean> {
    try {
      if (!this.currentChannel) return true;

      // Clean up peer connections
      this.peerConnections.forEach((pc) => {
        pc.close();
      });
      this.peerConnections.clear();

      // Clean up spatial audio nodes
      this.spatialNodes.clear();

      // Stop local stream
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
        this.localStream = null;
      }

      // Clean up voice activity detector
      if (this.voiceActivityDetector) {
        this.voiceActivityDetector.destroy();
        this.voiceActivityDetector = null;
      }

      // Remove push-to-talk listener
      if (this.keyboardListener) {
        document.removeEventListener('keydown', this.keyboardListener);
        document.removeEventListener('keyup', this.keyboardListener);
        this.keyboardListener = null;
      }

      const channelId = this.currentChannel.id;
      this.currentChannel = null;

      this.emitEvent({
        type: 'user-left',
        channel_id: channelId,
        user_id: 'current_user_id',
        timestamp: Date.now()
      });

      return true;
    } catch (error) {
      console.error('Failed to leave voice channel:', error);
      return false;
    }
  }

  // Media Stream Management
  private async initializeMediaStream(): Promise<void> {
    try {
      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: this.settings.inputDeviceId !== 'default' 
            ? { exact: this.settings.inputDeviceId } 
            : undefined,
          noiseSuppression: this.settings.noiseSuppression,
          echoCancellation: this.settings.echoCancellation,
          autoGainControl: this.settings.autoGainControl,
        },
        video: false
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);

      // Apply input volume
      if (this.audioContext && this.localStream) {
        const source = this.audioContext.createMediaStreamSource(this.localStream);
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = this.settings.inputVolume / 100;
        
        source.connect(gainNode);
        gainNode.connect(this.analyser!);
      }
    } catch (error) {
      console.error('Failed to initialize media stream:', error);
      throw error;
    }
  }

  // Spatial Audio
  private setupSpatialAudio(): void {
    if (!this.audioContext) return;

    // Set up 3D audio context
    if (this.audioContext.listener) {
      this.audioContext.listener.positionX.value = 0;
      this.audioContext.listener.positionY.value = 0;
      this.audioContext.listener.positionZ.value = 0;
      this.audioContext.listener.forwardX.value = 0;
      this.audioContext.listener.forwardY.value = 0;
      this.audioContext.listener.forwardZ.value = -1;
      this.audioContext.listener.upX.value = 0;
      this.audioContext.listener.upY.value = 1;
      this.audioContext.listener.upZ.value = 0;
    }
  }

  updateUserPosition(userId: string, position: { x: number; y: number; z: number }): void {
    if (!this.currentChannel?.is_spatial || !this.audioContext) return;

    const spatialNode = this.spatialNodes.get(userId);
    if (spatialNode) {
      const { panner } = spatialNode;
      
      // Update panner position
      panner.positionX.value = position.x;
      panner.positionY.value = position.y;
      panner.positionZ.value = position.z;

      // Calculate distance for volume adjustment
      const distance = Math.sqrt(
        position.x * position.x + 
        position.y * position.y + 
        position.z * position.z
      );

      const volume = Math.max(0, 1 - (distance / this.settings.maxDistance));
      spatialNode.gain.gain.value = volume;
    }

    // Emit position update event
    this.emitEvent({
      type: 'position-updated',
      channel_id: this.currentChannel?.id || '',
      user_id: userId,
      data: { position },
      timestamp: Date.now()
    });
  }

  // Push-to-Talk
  private setupPushToTalk(): void {
    if (!this.settings.pushToTalkEnabled) return;

    this.keyboardListener = (e: KeyboardEvent) => {
      if (e.code === this.settings.pushToTalkKey) {
        if (e.type === 'keydown' && !this.pushToTalkActive) {
          this.pushToTalkActive = true;
          this.setMuted(false);
        } else if (e.type === 'keyup' && this.pushToTalkActive) {
          this.pushToTalkActive = false;
          this.setMuted(true);
        }
      }
    };

    document.addEventListener('keydown', this.keyboardListener);
    document.addEventListener('keyup', this.keyboardListener);

    // Start muted if push-to-talk is enabled
    this.setMuted(true);
  }

  // Voice Activity Detection
  private initializeVoiceActivityDetection(): void {
    if (!this.localStream || !this.audioContext) return;

    this.voiceActivityDetector = new VoiceActivityDetector(
      this.localStream,
      this.audioContext,
      {
        threshold: this.settings.voiceActivationThreshold,
        onSpeakingStart: () => {
          if (!this.settings.pushToTalkEnabled) {
            this.setMuted(false);
          }
          this.emitEvent({
            type: 'user-speaking',
            channel_id: this.currentChannel?.id || '',
            user_id: 'current_user_id',
            timestamp: Date.now()
          });
        },
        onSpeakingStop: () => {
          if (!this.settings.pushToTalkEnabled) {
            this.setMuted(true);
          }
          this.emitEvent({
            type: 'user-stopped-speaking',
            channel_id: this.currentChannel?.id || '',
            user_id: 'current_user_id',
            timestamp: Date.now()
          });
        }
      }
    );
  }

  // Audio Controls
  setMuted(muted: boolean): void {
    if (!this.localStream) return;

    this.localStream.getAudioTracks().forEach(track => {
      track.enabled = !muted;
    });

    this.emitEvent({
      type: muted ? 'user-muted' : 'user-unmuted',
      channel_id: this.currentChannel?.id || '',
      user_id: 'current_user_id',
      timestamp: Date.now()
    });
  }

  setDeafened(deafened: boolean): void {
    // Mute all remote audio
    this.peerConnections.forEach((pc, userId) => {
      const spatialNode = this.spatialNodes.get(userId);
      if (spatialNode) {
        spatialNode.gain.gain.value = deafened ? 0 : 1;
      }
    });
  }

  setVolume(userId: string, volume: number): void {
    const spatialNode = this.spatialNodes.get(userId);
    if (spatialNode) {
      spatialNode.gain.gain.value = Math.max(0, Math.min(1, volume / 100));
    }
  }

  // Settings Management
  updateSettings(newSettings: Partial<VoiceSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();

    // Apply settings that require reinitialization
    if (newSettings.inputDeviceId || newSettings.outputDeviceId) {
      this.reinitializeAudio();
    }

    if (newSettings.pushToTalkEnabled !== undefined || newSettings.pushToTalkKey) {
      this.setupPushToTalk();
    }

    if (newSettings.voiceActivationEnabled !== undefined || newSettings.voiceActivationThreshold) {
      if (this.settings.voiceActivationEnabled) {
        this.initializeVoiceActivityDetection();
      } else if (this.voiceActivityDetector) {
        this.voiceActivityDetector.destroy();
        this.voiceActivityDetector = null;
      }
    }
  }

  private async reinitializeAudio(): Promise<void> {
    if (this.currentChannel) {
      await this.initializeMediaStream();
    }
  }

  getSettings(): VoiceSettings {
    return { ...this.settings };
  }

  // Audio Device Management
  async getAudioDevices(): Promise<{ input: MediaDeviceInfo[]; output: MediaDeviceInfo[] }> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      return {
        input: devices.filter(device => device.kind === 'audioinput'),
        output: devices.filter(device => device.kind === 'audiooutput')
      };
    } catch (error) {
      console.error('Failed to get audio devices:', error);
      return { input: [], output: [] };
    }
  }

  // Audio Statistics
  getAudioStats(): AudioStats {
    const stats: AudioStats = {
      inputLevel: this.getInputLevel(),
      outputLevel: this.getOutputLevel(),
      packetLoss: 0, // Would be calculated from WebRTC stats
      latency: 0,    // Would be calculated from WebRTC stats
      jitter: 0,     // Would be calculated from WebRTC stats
      bitrate: 0     // Would be calculated from WebRTC stats
    };

    return stats;
  }

  private getInputLevel(): number {
    if (!this.analyser) return 0;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    return (average / 255) * 100;
  }

  private getOutputLevel(): number {
    // Would be implemented with output audio analysis
    return 0;
  }

  // Event System
  addEventListener(type: VoiceEventType, callback: (event: VoiceEvent) => void): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, []);
    }
    this.eventListeners.get(type)!.push(callback);
  }

  removeEventListener(type: VoiceEventType, callback: (event: VoiceEvent) => void): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emitEvent(event: VoiceEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach(callback => callback(event));
    }
  }

  // WebRTC Signaling (simplified)
  private async joinSignalingChannel(channelId: string): Promise<void> {
    // Implementation would use Supabase real-time subscriptions for signaling
    // This is a simplified version
  }

  // Cleanup
  destroy(): void {
    this.leaveChannel();
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.eventListeners.clear();
  }
}

// Voice Activity Detection Class
class VoiceActivityDetector {
  private analyser: AnalyserNode;
  private threshold: number;
  private onSpeakingStart: () => void;
  private onSpeakingStop: () => void;
  private isSpeaking = false;
  private animationFrame: number | null = null;

  constructor(
    stream: MediaStream,
    audioContext: AudioContext,
    options: {
      threshold: number;
      onSpeakingStart: () => void;
      onSpeakingStop: () => void;
    }
  ) {
    this.threshold = options.threshold;
    this.onSpeakingStart = options.onSpeakingStart;
    this.onSpeakingStop = options.onSpeakingStop;

    // Set up audio analysis
    this.analyser = audioContext.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.8;

    const source = audioContext.createMediaStreamSource(stream);
    source.connect(this.analyser);

    this.startDetection();
  }

  private startDetection(): void {
    const detect = () => {
      const dataArray = new Float32Array(this.analyser.frequencyBinCount);
      this.analyser.getFloatFrequencyData(dataArray);

      // Calculate average volume
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      
      const isSpeakingNow = average > this.threshold;

      if (isSpeakingNow && !this.isSpeaking) {
        this.isSpeaking = true;
        this.onSpeakingStart();
      } else if (!isSpeakingNow && this.isSpeaking) {
        this.isSpeaking = false;
        this.onSpeakingStop();
      }

      this.animationFrame = requestAnimationFrame(detect);
    };

    detect();
  }

  destroy(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }
}

export const voiceManager = new VoiceManager();
