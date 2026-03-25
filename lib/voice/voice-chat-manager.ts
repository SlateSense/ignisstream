/**
 * Advanced Voice Chat Manager for IgnisStream
 * Real-time voice communication for gaming teams with spatial audio
 */

interface VoiceChatConfig {
  sampleRate: number;
  bitrate: number;
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
  spatialAudio: boolean;
}

interface VoiceParticipant {
  id: string;
  userId: string;
  displayName: string;
  avatar?: string;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  audioLevel: number;
  position?: { x: number; y: number; z: number };
  stream?: MediaStream;
  peerConnection?: RTCPeerConnection;
  audioElement?: HTMLAudioElement;
}

interface VoiceChannel {
  id: string;
  name: string;
  type: 'team' | 'party' | 'proximity' | 'global';
  gameId?: string;
  maxParticipants: number;
  participants: Map<string, VoiceParticipant>;
  isPrivate: boolean;
  permissions: {
    canSpeak: string[];
    canMute: string[];
    canKick: string[];
  };
}

interface AudioProcessingNode {
  input: GainNode;
  output: GainNode;
  compressor: DynamicsCompressorNode;
  filter: BiquadFilterNode;
  analyzer: AnalyserNode;
}

export class VoiceChatManager {
  private audioContext: AudioContext | null = null;
  private localStream: MediaStream | null = null;
  private localParticipant: VoiceParticipant | null = null;
  private currentChannel: VoiceChannel | null = null;
  private participants: Map<string, VoiceParticipant> = new Map();
  private signalingSocket: WebSocket | null = null;
  private config: VoiceChatConfig;
  private audioNodes: AudioProcessingNode | null = null;
  private spatialAudioContext: AudioContext | null = null;
  private eventListeners: Map<string, Function[]> = new Map();
  
  // Voice activity detection
  private vadProcessor: AudioWorkletNode | null = null;
  private speechThreshold = -50; // dB
  private isSpeaking = false;
  
  // Push-to-talk
  private pttEnabled = false;
  private pttKey = ' '; // Spacebar
  private isPttPressed = false;

  constructor() {
    this.config = {
      sampleRate: 48000,
      bitrate: 64000,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      spatialAudio: true,
    };

    this.setupKeyboardHandlers();
  }

  // Initialize voice chat system
  async initialize(userId: string): Promise<boolean> {
    try {
      // Initialize audio contexts
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: this.config.sampleRate,
      });

      if (this.config.spatialAudio) {
        this.spatialAudioContext = new AudioContext();
      }

      // Set up local participant
      this.localParticipant = {
        id: `local_${userId}`,
        userId,
        displayName: 'You',
        isMuted: false,
        isDeafened: false,
        isSpeaking: false,
        audioLevel: 0,
      };

      // Connect to signaling server
      await this.connectSignaling();

      console.log('Voice chat system initialized');
      this.emit('initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize voice chat:', error);
      return false;
    }
  }

  // Connect to signaling server for WebRTC coordination
  private async connectSignaling(): Promise<void> {
    const wsUrl = process.env.NODE_ENV === 'production'
      ? 'wss://api.ignisstream.com/voice-signaling'
      : 'ws://localhost:8080/voice-signaling';

    this.signalingSocket = new WebSocket(wsUrl);

    this.signalingSocket.onopen = () => {
      console.log('Voice signaling connected');
      this.emit('signalingConnected');
    };

    this.signalingSocket.onmessage = (event) => {
      this.handleSignalingMessage(JSON.parse(event.data));
    };

    this.signalingSocket.onclose = () => {
      console.log('Voice signaling disconnected');
      this.emit('signalingDisconnected');
      
      // Attempt reconnection after 3 seconds
      setTimeout(() => this.connectSignaling(), 3000);
    };

    this.signalingSocket.onerror = (error) => {
      console.error('Voice signaling error:', error);
    };
  }

  // Join voice channel
  async joinChannel(channelId: string): Promise<boolean> {
    try {
      // Request microphone access
      await this.startLocalAudio();
      
      // Leave current channel if any
      if (this.currentChannel) {
        await this.leaveChannel();
      }

      // Join new channel
      if (this.signalingSocket?.readyState === WebSocket.OPEN) {
        this.signalingSocket.send(JSON.stringify({
          type: 'join_channel',
          channelId,
          participant: this.localParticipant,
        }));
      }

      this.emit('channelJoining', { channelId });
      return true;
    } catch (error) {
      console.error('Failed to join voice channel:', error);
      return false;
    }
  }

  // Leave current voice channel
  async leaveChannel(): Promise<void> {
    if (!this.currentChannel) return;

    // Notify signaling server
    if (this.signalingSocket?.readyState === WebSocket.OPEN) {
      this.signalingSocket.send(JSON.stringify({
        type: 'leave_channel',
        channelId: this.currentChannel.id,
        participantId: this.localParticipant?.id,
      }));
    }

    // Cleanup peer connections
    this.participants.forEach(participant => {
      if (participant.peerConnection) {
        participant.peerConnection.close();
      }
      if (participant.audioElement) {
        participant.audioElement.remove();
      }
    });

    this.participants.clear();
    this.currentChannel = null;
    
    await this.stopLocalAudio();
    
    this.emit('channelLeft');
  }

  // Start local audio capture
  private async startLocalAudio(): Promise<void> {
    try {
      const constraints: MediaStreamConstraints = {
        audio: {
          sampleRate: this.config.sampleRate,
          echoCancellation: this.config.echoCancellation,
          noiseSuppression: this.config.noiseSuppression,
          autoGainControl: this.config.autoGainControl,
        },
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Set up audio processing
      await this.setupAudioProcessing();
      
      // Set up voice activity detection
      this.setupVoiceActivityDetection();

      if (this.localParticipant) {
        this.localParticipant.stream = this.localStream;
      }

      this.emit('localAudioStarted');
    } catch (error) {
      console.error('Failed to start local audio:', error);
      throw error;
    }
  }

  // Stop local audio capture
  private async stopLocalAudio(): Promise<void> {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.audioNodes) {
      this.audioNodes.input.disconnect();
      this.audioNodes.output.disconnect();
      this.audioNodes = null;
    }

    if (this.vadProcessor) {
      this.vadProcessor.disconnect();
      this.vadProcessor = null;
    }

    this.emit('localAudioStopped');
  }

  // Set up advanced audio processing
  private async setupAudioProcessing(): Promise<void> {
    if (!this.audioContext || !this.localStream) return;

    const source = this.audioContext.createMediaStreamSource(this.localStream);
    
    // Create audio processing chain
    const input = this.audioContext.createGain();
    const compressor = this.audioContext.createDynamicsCompressor();
    const filter = this.audioContext.createBiquadFilter();
    const output = this.audioContext.createGain();
    const analyzer = this.audioContext.createAnalyser();

    // Configure compressor for voice
    compressor.threshold.value = -24;
    compressor.knee.value = 30;
    compressor.ratio.value = 12;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;

    // Configure high-pass filter to remove low-frequency noise
    filter.type = 'highpass';
    filter.frequency.value = 85;
    filter.Q.value = 1;

    // Configure analyzer for voice level detection
    analyzer.fftSize = 512;
    analyzer.smoothingTimeConstant = 0.8;

    // Connect audio nodes
    source.connect(input);
    input.connect(compressor);
    compressor.connect(filter);
    filter.connect(output);
    output.connect(analyzer);

    this.audioNodes = { input, output, compressor, filter, analyzer };
  }

  // Voice Activity Detection
  private setupVoiceActivityDetection(): void {
    if (!this.audioNodes) return;

    const bufferLength = this.audioNodes.analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const checkVoiceActivity = () => {
      if (!this.audioNodes) return;
      
      this.audioNodes.analyzer.getByteFrequencyData(dataArray);
      
      // Calculate RMS (Root Mean Square) for voice level
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / bufferLength);
      const dbLevel = 20 * Math.log10(rms / 128);
      
      // Update speaking status
      const wasSpeaking = this.isSpeaking;
      this.isSpeaking = dbLevel > this.speechThreshold && this.canSpeak();
      
      if (this.localParticipant) {
        this.localParticipant.audioLevel = Math.max(0, Math.min(100, (dbLevel + 60) * 1.67));
        this.localParticipant.isSpeaking = this.isSpeaking;
      }
      
      // Emit speaking events
      if (this.isSpeaking !== wasSpeaking) {
        this.emit('speakingChanged', {
          participantId: this.localParticipant?.id,
          isSpeaking: this.isSpeaking,
        });
      }
      
      requestAnimationFrame(checkVoiceActivity);
    };
    
    checkVoiceActivity();
  }

  // Handle signaling messages
  private async handleSignalingMessage(message: any): Promise<void> {
    switch (message.type) {
      case 'channel_joined':
        await this.handleChannelJoined(message);
        break;
        
      case 'participant_joined':
        await this.handleParticipantJoined(message);
        break;
        
      case 'participant_left':
        this.handleParticipantLeft(message);
        break;
        
      case 'offer':
        await this.handleOffer(message);
        break;
        
      case 'answer':
        await this.handleAnswer(message);
        break;
        
      case 'ice_candidate':
        await this.handleIceCandidate(message);
        break;
        
      case 'participant_muted':
        this.handleParticipantMuted(message);
        break;
        
      case 'speaking_update':
        this.handleSpeakingUpdate(message);
        break;
    }
  }

  private async handleChannelJoined(message: any): Promise<void> {
    this.currentChannel = message.channel;
    
    // Set up peer connections for existing participants
    for (const participant of message.channel.participants) {
      if (participant.id !== this.localParticipant?.id) {
        await this.createPeerConnection(participant);
      }
    }
    
    this.emit('channelJoined', { channel: this.currentChannel });
  }

  private async handleParticipantJoined(message: any): Promise<void> {
    const participant = message.participant;
    await this.createPeerConnection(participant);
    this.emit('participantJoined', { participant });
  }

  private handleParticipantLeft(message: any): Promise<void> {
    const participantId = message.participantId;
    const participant = this.participants.get(participantId);
    
    if (participant) {
      if (participant.peerConnection) {
        participant.peerConnection.close();
      }
      if (participant.audioElement) {
        participant.audioElement.remove();
      }
      
      this.participants.delete(participantId);
      this.emit('participantLeft', { participantId });
    }
    
    return Promise.resolve();
  }

  // WebRTC Peer Connection Management
  private async createPeerConnection(participant: VoiceParticipant): Promise<void> {
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { 
          urls: 'turn:turn.ignisstream.com:3478',
          username: 'ignisstream',
          credential: process.env.TURN_CREDENTIAL || 'defaultcredential',
        },
      ],
    });

    participant.peerConnection = peerConnection;
    this.participants.set(participant.id, participant);

    // Add local stream to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.localStream!);
      });
    }

    // Handle incoming remote stream
    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      this.handleRemoteStream(participant, remoteStream);
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.signalingSocket?.readyState === WebSocket.OPEN) {
        this.signalingSocket.send(JSON.stringify({
          type: 'ice_candidate',
          candidate: event.candidate,
          targetId: participant.id,
        }));
      }
    };

    // Create and send offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    
    if (this.signalingSocket?.readyState === WebSocket.OPEN) {
      this.signalingSocket.send(JSON.stringify({
        type: 'offer',
        offer,
        targetId: participant.id,
      }));
    }
  }

  private async handleOffer(message: any): Promise<void> {
    const participant = this.participants.get(message.senderId);
    if (!participant?.peerConnection) return;

    await participant.peerConnection.setRemoteDescription(message.offer);
    
    const answer = await participant.peerConnection.createAnswer();
    await participant.peerConnection.setLocalDescription(answer);
    
    if (this.signalingSocket?.readyState === WebSocket.OPEN) {
      this.signalingSocket.send(JSON.stringify({
        type: 'answer',
        answer,
        targetId: message.senderId,
      }));
    }
  }

  private async handleAnswer(message: any): Promise<void> {
    const participant = this.participants.get(message.senderId);
    if (!participant?.peerConnection) return;

    await participant.peerConnection.setRemoteDescription(message.answer);
  }

  private async handleIceCandidate(message: any): Promise<void> {
    const participant = this.participants.get(message.senderId);
    if (!participant?.peerConnection) return;

    await participant.peerConnection.addIceCandidate(message.candidate);
  }

  // Remote stream handling with spatial audio
  private handleRemoteStream(participant: VoiceParticipant, stream: MediaStream): void {
    const audioElement = new Audio();
    audioElement.srcObject = stream;
    audioElement.autoplay = true;
    
    participant.stream = stream;
    participant.audioElement = audioElement;
    
    // Set up spatial audio if enabled
    if (this.config.spatialAudio && this.spatialAudioContext) {
      this.setupSpatialAudio(participant);
    }
    
    // Monitor audio levels
    this.monitorParticipantAudio(participant);
    
    this.emit('participantStreamReceived', { participant });
  }

  private setupSpatialAudio(participant: VoiceParticipant): void {
    if (!this.spatialAudioContext || !participant.audioElement) return;

    const source = this.spatialAudioContext.createMediaElementSource(participant.audioElement);
    const panner = this.spatialAudioContext.createPanner();
    
    // Configure 3D audio
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 1;
    panner.maxDistance = 100;
    panner.rolloffFactor = 1;
    panner.coneInnerAngle = 360;
    panner.coneOuterAngle = 0;
    panner.coneOuterGain = 0;
    
    // Set initial position
    if (participant.position) {
      panner.setPosition(participant.position.x, participant.position.y, participant.position.z);
    }
    
    source.connect(panner);
    panner.connect(this.spatialAudioContext.destination);
  }

  private monitorParticipantAudio(participant: VoiceParticipant): void {
    if (!participant.stream || !this.audioContext) return;

    const source = this.audioContext.createMediaStreamSource(participant.stream);
    const analyzer = this.audioContext.createAnalyser();
    
    analyzer.fftSize = 256;
    analyzer.smoothingTimeConstant = 0.8;
    
    source.connect(analyzer);
    
    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const updateAudioLevel = () => {
      analyzer.getByteFrequencyData(dataArray);
      
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / bufferLength);
      const dbLevel = 20 * Math.log10(rms / 128);
      
      participant.audioLevel = Math.max(0, Math.min(100, (dbLevel + 60) * 1.67));
      participant.isSpeaking = dbLevel > this.speechThreshold;
      
      this.emit('participantAudioLevel', {
        participantId: participant.id,
        audioLevel: participant.audioLevel,
        isSpeaking: participant.isSpeaking,
      });
      
      if (this.participants.has(participant.id)) {
        requestAnimationFrame(updateAudioLevel);
      }
    };
    
    updateAudioLevel();
  }

  // Mute/Unmute controls
  async toggleMute(): Promise<void> {
    if (!this.localParticipant) return;
    
    this.localParticipant.isMuted = !this.localParticipant.isMuted;
    
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !this.localParticipant!.isMuted;
      });
    }
    
    // Notify other participants
    if (this.signalingSocket?.readyState === WebSocket.OPEN) {
      this.signalingSocket.send(JSON.stringify({
        type: 'mute_update',
        participantId: this.localParticipant.id,
        isMuted: this.localParticipant.isMuted,
      }));
    }
    
    this.emit('muteToggled', { 
      isMuted: this.localParticipant.isMuted 
    });
  }

  async toggleDeafen(): Promise<void> {
    if (!this.localParticipant) return;
    
    this.localParticipant.isDeafened = !this.localParticipant.isDeafened;
    
    // Mute all remote audio
    this.participants.forEach(participant => {
      if (participant.audioElement) {
        participant.audioElement.muted = this.localParticipant!.isDeafened;
      }
    });
    
    this.emit('deafenToggled', { 
      isDeafened: this.localParticipant.isDeafened 
    });
  }

  // Push-to-talk functionality
  private setupKeyboardHandlers(): void {
    document.addEventListener('keydown', (event) => {
      if (event.code === 'Space' && this.pttEnabled && !this.isPttPressed) {
        event.preventDefault();
        this.isPttPressed = true;
        this.handlePushToTalk(true);
      }
    });

    document.addEventListener('keyup', (event) => {
      if (event.code === 'Space' && this.pttEnabled && this.isPttPressed) {
        event.preventDefault();
        this.isPttPressed = false;
        this.handlePushToTalk(false);
      }
    });
  }

  private handlePushToTalk(pressed: boolean): void {
    if (!this.localStream || !this.localParticipant) return;
    
    this.localStream.getAudioTracks().forEach(track => {
      track.enabled = pressed;
    });
    
    this.emit('pushToTalkChanged', { pressed });
  }

  setPushToTalkEnabled(enabled: boolean): void {
    this.pttEnabled = enabled;
    
    // If PTT is disabled, ensure audio is enabled
    if (!enabled && this.localStream && !this.localParticipant?.isMuted) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = true;
      });
    }
  }

  // Audio settings
  updateAudioSettings(settings: Partial<VoiceChatConfig>): void {
    this.config = { ...this.config, ...settings };
    
    // Apply settings to audio nodes
    if (this.audioNodes) {
      if (settings.bitrate) {
        // Update bitrate settings for peer connections
        this.participants.forEach(participant => {
          if (participant.peerConnection) {
            this.updatePeerConnectionBitrate(participant.peerConnection, settings.bitrate!);
          }
        });
      }
    }
    
    this.emit('audioSettingsUpdated', { settings: this.config });
  }

  private async updatePeerConnectionBitrate(pc: RTCPeerConnection, bitrate: number): Promise<void> {
    const sender = pc.getSenders().find(s => s.track?.kind === 'audio');
    if (sender) {
      const params = sender.getParameters();
      if (params.encodings) {
        params.encodings[0].maxBitrate = bitrate;
        await sender.setParameters(params);
      }
    }
  }

  // Spatial audio position updates
  updateParticipantPosition(participantId: string, position: { x: number; y: number; z: number }): void {
    const participant = this.participants.get(participantId);
    if (participant) {
      participant.position = position;
      
      if (this.spatialAudioContext && participant.audioElement) {
        // Update spatial audio position
        const source = this.spatialAudioContext.createMediaElementSource(participant.audioElement);
        const panner = this.spatialAudioContext.createPanner();
        panner.setPosition(position.x, position.y, position.z);
      }
    }
  }

  // Utility methods
  private canSpeak(): boolean {
    if (!this.localParticipant) return false;
    
    if (this.pttEnabled) {
      return this.isPttPressed && !this.localParticipant.isMuted;
    }
    
    return !this.localParticipant.isMuted;
  }

  private handleParticipantMuted(message: any): void {
    const participant = this.participants.get(message.participantId);
    if (participant) {
      participant.isMuted = message.isMuted;
      this.emit('participantMuteChanged', { participant });
    }
  }

  private handleSpeakingUpdate(message: any): void {
    const participant = this.participants.get(message.participantId);
    if (participant) {
      participant.isSpeaking = message.isSpeaking;
      participant.audioLevel = message.audioLevel || 0;
      this.emit('participantSpeakingChanged', { participant });
    }
  }

  // Event system
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // Cleanup
  async cleanup(): Promise<void> {
    await this.leaveChannel();
    
    if (this.signalingSocket) {
      this.signalingSocket.close();
      this.signalingSocket = null;
    }
    
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }
    
    if (this.spatialAudioContext) {
      await this.spatialAudioContext.close();
      this.spatialAudioContext = null;
    }
  }

  // Status getters
  getCurrentChannel(): VoiceChannel | null {
    return this.currentChannel;
  }

  getParticipants(): VoiceParticipant[] {
    return Array.from(this.participants.values());
  }

  getLocalParticipant(): VoiceParticipant | null {
    return this.localParticipant;
  }

  isConnected(): boolean {
    return this.signalingSocket?.readyState === WebSocket.OPEN;
  }

  isInChannel(): boolean {
    return this.currentChannel !== null;
  }
}

// Initialize global voice chat manager
export const voiceChatManager = new VoiceChatManager();
