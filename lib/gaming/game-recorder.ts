/**
 * Game Recording System for IgnisStream
 * Built-in screen recording with automatic highlight detection
 */

interface RecordingConfig {
  quality: 'high' | 'medium' | 'low';
  frameRate: 30 | 60 | 120;
  resolution: '1080p' | '1440p' | '4K' | 'native';
  codec: 'h264' | 'h265' | 'vp9';
  bitrate: number;
  audioEnabled: boolean;
  microphoneEnabled: boolean;
  maxDuration: number; // seconds
  bufferDuration: number; // seconds for instant replay
}

interface RecordingSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  gameTitle: string;
  filePath: string;
  fileSize: number;
  highlights: HighlightMarker[];
  metadata: RecordingMetadata;
  status: 'recording' | 'processing' | 'completed' | 'failed';
}

interface HighlightMarker {
  id: string;
  timestamp: number; // seconds from start
  type: 'kill' | 'death' | 'achievement' | 'epic_moment' | 'funny' | 'custom';
  confidence: number;
  description: string;
  duration: number;
  thumbnailTime: number;
  tags: string[];
}

interface RecordingMetadata {
  gameId: string;
  playerName: string;
  gameMode: string;
  map: string;
  score?: Record<string, any>;
  performance: {
    avgFPS: number;
    minFPS: number;
    maxFPS: number;
  };
  audioLevels: {
    game: number;
    microphone: number;
  };
}

interface RecordingClip {
  id: string;
  sessionId: string;
  title: string;
  startTime: number;
  endTime: number;
  filePath: string;
  thumbnailPath: string;
  highlight: HighlightMarker;
  shareSettings: {
    platform: string[];
    privacy: 'public' | 'friends' | 'private';
    description: string;
    tags: string[];
  };
}

export class GameRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private recordedChunks: Blob[] = [];
  private currentSession: RecordingSession | null = null;
  private config: RecordingConfig;
  private isRecording = false;
  private isPaused = false;
  private bufferRecorder: BufferRecorder;
  private highlightDetector: HighlightDetector;
  private eventListeners: Map<string, Function[]> = new Map();
  private recordingSessions: RecordingSession[] = [];
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;

  constructor(config: Partial<RecordingConfig> = {}) {
    this.config = {
      quality: 'high',
      frameRate: 60,
      resolution: '1080p',
      codec: 'h264',
      bitrate: 8000000, // 8 Mbps
      audioEnabled: true,
      microphoneEnabled: false,
      maxDuration: 3600, // 1 hour
      bufferDuration: 30, // 30 seconds
      ...config,
    };

    this.bufferRecorder = new BufferRecorder(this.config.bufferDuration);
    this.highlightDetector = new HighlightDetector();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Request permissions for screen capture
      await this.requestPermissions();
      
      // Initialize audio context for analysis
      this.initializeAudioAnalysis();
      
      // Start buffer recording for instant replay
      this.bufferRecorder.start();
      
      this.emit('initialized');
    } catch (error) {
      console.error('Failed to initialize game recorder:', error);
      this.emit('initializationFailed', error);
    }
  }

  private async requestPermissions(): Promise<void> {
    // Check for required permissions
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      throw new Error('Screen recording not supported in this browser');
    }

    // Test screen capture capability
    try {
      const testStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: this.config.audioEnabled,
      });
      testStream.getTracks().forEach(track => track.stop());
    } catch (error) {
      throw new Error('Screen capture permission denied');
    }
  }

  private initializeAudioAnalysis(): void {
    try {
      this.audioContext = new AudioContext();
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 2048;
    } catch (error) {
      console.warn('Audio analysis not available:', error);
    }
  }

  // Start recording
  public async startRecording(gameTitle = 'Unknown Game'): Promise<void> {
    if (this.isRecording) {
      throw new Error('Recording already in progress');
    }

    try {
      // Get screen capture stream
      this.mediaStream = await this.getRecordingStream();
      
      // Setup media recorder
      this.setupMediaRecorder();
      
      // Create recording session
      this.currentSession = {
        id: this.generateSessionId(),
        startTime: new Date(),
        duration: 0,
        gameTitle,
        filePath: '',
        fileSize: 0,
        highlights: [],
        metadata: {
          gameId: this.detectGameId(gameTitle),
          playerName: await this.getPlayerName(),
          gameMode: 'Unknown',
          map: 'Unknown',
          performance: {
            avgFPS: 0,
            minFPS: 0,
            maxFPS: 0,
          },
          audioLevels: {
            game: 0,
            microphone: 0,
          },
        },
        status: 'recording',
      };

      // Start recording
      this.mediaRecorder?.start(1000); // 1-second intervals
      this.isRecording = true;
      
      // Setup audio analysis
      this.setupAudioAnalysis();
      
      // Start highlight detection
      this.highlightDetector.start(gameTitle);
      
      // Setup automatic stop after max duration
      setTimeout(() => {
        if (this.isRecording) {
          this.stopRecording();
        }
      }, this.config.maxDuration * 1000);

      this.emit('recordingStarted', this.currentSession);
    } catch (error) {
      console.error('Failed to start recording:', error);
      this.emit('recordingFailed', error);
      throw error;
    }
  }

  // Stop recording
  public async stopRecording(): Promise<RecordingSession> {
    if (!this.isRecording || !this.mediaRecorder || !this.currentSession) {
      throw new Error('No active recording session');
    }

    return new Promise((resolve, reject) => {
      this.mediaRecorder!.addEventListener('stop', async () => {
        try {
          const session = await this.processRecordingEnd();
          resolve(session);
        } catch (error) {
          reject(error);
        }
      });

      this.mediaRecorder!.stop();
      this.isRecording = false;
      this.highlightDetector.stop();
    });
  }

  // Pause/resume recording
  public pauseRecording(): void {
    if (!this.isRecording || !this.mediaRecorder) return;

    if (this.isPaused) {
      this.mediaRecorder.resume();
      this.isPaused = false;
      this.emit('recordingResumed');
    } else {
      this.mediaRecorder.pause();
      this.isPaused = true;
      this.emit('recordingPaused');
    }
  }

  // Save instant replay (last N seconds)
  public async saveInstantReplay(duration = 30): Promise<RecordingClip> {
    const replayData = await this.bufferRecorder.getLastSeconds(duration);
    
    const clip: RecordingClip = {
      id: this.generateClipId(),
      sessionId: 'instant_replay',
      title: `Instant Replay - ${new Date().toLocaleString()}`,
      startTime: 0,
      endTime: duration,
      filePath: '',
      thumbnailPath: '',
      highlight: {
        id: this.generateHighlightId(),
        timestamp: 0,
        type: 'custom',
        confidence: 1.0,
        description: 'Instant replay clip',
        duration,
        thumbnailTime: duration / 2,
        tags: ['instant_replay'],
      },
      shareSettings: {
        platform: [],
        privacy: 'private',
        description: '',
        tags: ['instant_replay'],
      },
    };

    // Process and save the clip
    clip.filePath = await this.saveClipData(replayData, clip.id);
    clip.thumbnailPath = await this.generateThumbnail(clip.filePath, clip.highlight.thumbnailTime);

    this.emit('instantReplayCreated', clip);
    return clip;
  }

  // Add manual highlight marker
  public addHighlightMarker(type: HighlightMarker['type'], description?: string): void {
    if (!this.currentSession) return;

    const highlight: HighlightMarker = {
      id: this.generateHighlightId(),
      timestamp: this.getCurrentRecordingTime(),
      type,
      confidence: 1.0,
      description: description || `Manual ${type} highlight`,
      duration: 10, // Default 10-second highlight
      thumbnailTime: 0,
      tags: [type, 'manual'],
    };

    this.currentSession.highlights.push(highlight);
    this.emit('highlightAdded', highlight);
  }

  // Get recording stream with optimal settings
  private async getRecordingStream(): Promise<MediaStream> {
    const constraints = this.buildStreamConstraints();
    
    try {
      let stream = await navigator.mediaDevices.getDisplayMedia(constraints);
      
      // Add microphone audio if enabled
      if (this.config.microphoneEnabled) {
        const micStream = await navigator.mediaDevices.getUserMedia({ 
          audio: true 
        });
        
        // Mix audio streams
        stream = this.mixAudioStreams(stream, micStream);
      }
      
      return stream;
    } catch (error) {
      throw new Error(`Failed to capture screen: ${error}`);
    }
  }

  private buildStreamConstraints(): DisplayMediaStreamConstraints {
    const resolution = this.getResolutionConstraints();
    
    return {
      video: {
        ...resolution,
        frameRate: this.config.frameRate,
        cursor: 'always',
        displaySurface: 'monitor',
      },
      audio: this.config.audioEnabled,
    };
  }

  private getResolutionConstraints(): MediaTrackConstraints {
    switch (this.config.resolution) {
      case '4K':
        return { width: 3840, height: 2160 };
      case '1440p':
        return { width: 2560, height: 1440 };
      case '1080p':
        return { width: 1920, height: 1080 };
      default:
        return {}; // Native resolution
    }
  }

  private mixAudioStreams(screenStream: MediaStream, micStream: MediaStream): MediaStream {
    if (!this.audioContext) return screenStream;

    try {
      const mixedStream = new MediaStream();
      
      // Add video tracks from screen stream
      screenStream.getVideoTracks().forEach(track => {
        mixedStream.addTrack(track);
      });

      // Mix audio tracks
      const destination = this.audioContext.createMediaStreamDestination();
      
      if (screenStream.getAudioTracks().length > 0) {
        const screenSource = this.audioContext.createMediaStreamSource(screenStream);
        screenSource.connect(destination);
      }
      
      if (micStream.getAudioTracks().length > 0) {
        const micSource = this.audioContext.createMediaStreamSource(micStream);
        const micGain = this.audioContext.createGain();
        micGain.gain.value = 0.8; // Lower mic volume slightly
        
        micSource.connect(micGain);
        micGain.connect(destination);
      }

      // Add mixed audio track
      destination.stream.getAudioTracks().forEach(track => {
        mixedStream.addTrack(track);
      });

      return mixedStream;
    } catch (error) {
      console.warn('Audio mixing failed, using screen audio only:', error);
      return screenStream;
    }
  }

  private setupMediaRecorder(): void {
    if (!this.mediaStream) return;

    const mimeType = this.getSupportedMimeType();
    
    this.mediaRecorder = new MediaRecorder(this.mediaStream, {
      mimeType,
      videoBitsPerSecond: this.config.bitrate,
      audioBitsPerSecond: 128000, // 128 kbps for audio
    });

    this.recordedChunks = [];

    this.mediaRecorder.addEventListener('dataavailable', (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
        this.updateRecordingProgress();
      }
    });

    this.mediaRecorder.addEventListener('error', (event) => {
      console.error('MediaRecorder error:', event);
      this.emit('recordingError', event);
    });
  }

  private getSupportedMimeType(): string {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=h264,opus',
      'video/webm',
      'video/mp4',
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    throw new Error('No supported video codec found');
  }

  private setupAudioAnalysis(): void {
    if (!this.mediaStream || !this.audioContext || !this.analyserNode) return;

    const audioTracks = this.mediaStream.getAudioTracks();
    if (audioTracks.length === 0) return;

    try {
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      source.connect(this.analyserNode);
      
      // Start audio level monitoring
      this.monitorAudioLevels();
    } catch (error) {
      console.warn('Audio analysis setup failed:', error);
    }
  }

  private monitorAudioLevels(): void {
    if (!this.analyserNode || !this.currentSession) return;

    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
    
    const analyze = () => {
      if (!this.isRecording) return;
      
      this.analyserNode!.getByteFrequencyData(dataArray);
      
      // Calculate average volume
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      const normalizedLevel = average / 255;
      
      // Update metadata
      this.currentSession!.metadata.audioLevels.game = normalizedLevel;
      
      // Check for audio-based highlights
      this.highlightDetector.processAudioLevel(normalizedLevel);
      
      requestAnimationFrame(analyze);
    };
    
    analyze();
  }

  private async processRecordingEnd(): Promise<RecordingSession> {
    if (!this.currentSession) {
      throw new Error('No active session to process');
    }

    this.currentSession.status = 'processing';
    this.currentSession.endTime = new Date();
    this.currentSession.duration = (this.currentSession.endTime.getTime() - this.currentSession.startTime.getTime()) / 1000;

    try {
      // Create final video file
      const recordingBlob = new Blob(this.recordedChunks, { 
        type: this.getSupportedMimeType() 
      });
      
      this.currentSession.fileSize = recordingBlob.size;
      this.currentSession.filePath = await this.saveRecordingFile(recordingBlob, this.currentSession.id);
      
      // Process highlights
      this.currentSession.highlights = await this.highlightDetector.getDetectedHighlights();
      
      // Generate thumbnails for highlights
      await this.generateHighlightThumbnails(this.currentSession);
      
      // Update performance metadata
      this.updatePerformanceMetadata(this.currentSession);
      
      this.currentSession.status = 'completed';
      this.recordingSessions.push(this.currentSession);
      
      // Cleanup
      this.cleanup();
      
      this.emit('recordingCompleted', this.currentSession);
      return this.currentSession;
    } catch (error) {
      this.currentSession.status = 'failed';
      this.emit('recordingFailed', error);
      throw error;
    }
  }

  private async saveRecordingFile(blob: Blob, sessionId: string): Promise<string> {
    // In a real application, this would save to a local directory or upload to cloud storage
    const fileName = `recording_${sessionId}_${Date.now()}.webm`;
    
    // For demonstration, create a local URL
    const url = URL.createObjectURL(blob);
    
    // In a real implementation, you would:
    // 1. Save to local filesystem (if using Electron)
    // 2. Upload to cloud storage (AWS S3, etc.)
    // 3. Store in IndexedDB for browser storage
    
    return url;
  }

  private async saveClipData(blob: Blob, clipId: string): Promise<string> {
    const fileName = `clip_${clipId}_${Date.now()}.webm`;
    return URL.createObjectURL(blob);
  }

  private async generateThumbnail(videoPath: string, timeInSeconds: number): Promise<string> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      video.addEventListener('loadedmetadata', () => {
        canvas.width = video.videoWidth / 4; // Quarter resolution for thumbnail
        canvas.height = video.videoHeight / 4;
        
        video.currentTime = timeInSeconds;
      });
      
      video.addEventListener('seeked', () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(thumbnailUrl);
      });
      
      video.src = videoPath;
    });
  }

  private async generateHighlightThumbnails(session: RecordingSession): Promise<void> {
    for (const highlight of session.highlights) {
      try {
        highlight.thumbnailTime = highlight.timestamp + (highlight.duration / 2);
      } catch (error) {
        console.warn('Failed to generate thumbnail for highlight:', highlight.id, error);
      }
    }
  }

  private updatePerformanceMetadata(session: RecordingSession): void {
    // This would integrate with the performance monitor
    // For now, provide mock data
    session.metadata.performance = {
      avgFPS: 60,
      minFPS: 45,
      maxFPS: 75,
    };
  }

  private updateRecordingProgress(): void {
    if (!this.currentSession) return;
    
    const currentTime = new Date();
    this.currentSession.duration = (currentTime.getTime() - this.currentSession.startTime.getTime()) / 1000;
    
    this.emit('recordingProgress', {
      duration: this.currentSession.duration,
      fileSize: this.recordedChunks.reduce((size, chunk) => size + chunk.size, 0),
    });
  }

  private getCurrentRecordingTime(): number {
    if (!this.currentSession) return 0;
    return (Date.now() - this.currentSession.startTime.getTime()) / 1000;
  }

  // Utility methods
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateClipId(): string {
    return `clip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateHighlightId(): string {
    return `highlight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private detectGameId(gameTitle: string): string {
    const gameMap: Record<string, string> = {
      'VALORANT': 'valorant',
      'Counter-Strike': 'csgo',
      'Apex Legends': 'apex',
      'League of Legends': 'lol',
      'Overwatch': 'overwatch',
    };
    
    for (const [title, id] of Object.entries(gameMap)) {
      if (gameTitle.includes(title)) {
        return id;
      }
    }
    
    return 'unknown';
  }

  private async getPlayerName(): Promise<string> {
    // This would integrate with the user's profile
    return 'Player'; // Mock data
  }

  private cleanup(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    
    this.mediaRecorder = null;
    this.recordedChunks = [];
  }

  // Public API
  public getRecordingSessions(): RecordingSession[] {
    return [...this.recordingSessions];
  }

  public getCurrentSession(): RecordingSession | null {
    return this.currentSession;
  }

  public isRecordingActive(): boolean {
    return this.isRecording;
  }

  public updateConfig(newConfig: Partial<RecordingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public getConfig(): RecordingConfig {
    return { ...this.config };
  }

  // Event system
  public on(event: string, callback: Function): void {
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

  public destroy(): void {
    this.stopRecording().catch(() => {});
    this.cleanup();
    this.bufferRecorder.stop();
    this.highlightDetector.stop();
    
    if (this.audioContext) {
      this.audioContext.close();
    }
    
    this.eventListeners.clear();
  }
}

// Buffer Recorder for instant replay functionality
class BufferRecorder {
  private bufferDuration: number;
  private chunks: { data: Blob; timestamp: number }[] = [];
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;

  constructor(bufferDuration: number) {
    this.bufferDuration = bufferDuration * 1000; // Convert to milliseconds
  }

  public async start(): Promise<void> {
    try {
      // Use a low-quality stream for buffer recording
      this.stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 15, width: 640, height: 360 },
        audio: false,
      });

      this.mediaRecorder = new MediaRecorder(this.stream, {
        videoBitsPerSecond: 1000000, // 1 Mbps for buffer
      });

      this.mediaRecorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          this.addChunk(event.data);
        }
      });

      this.mediaRecorder.start(1000); // Record in 1-second chunks
    } catch (error) {
      console.warn('Buffer recording failed to start:', error);
    }
  }

  private addChunk(data: Blob): void {
    const timestamp = Date.now();
    this.chunks.push({ data, timestamp });

    // Remove old chunks beyond buffer duration
    const cutoff = timestamp - this.bufferDuration;
    this.chunks = this.chunks.filter(chunk => chunk.timestamp > cutoff);
  }

  public async getLastSeconds(seconds: number): Promise<Blob> {
    const duration = seconds * 1000;
    const cutoff = Date.now() - duration;
    
    const recentChunks = this.chunks
      .filter(chunk => chunk.timestamp > cutoff)
      .map(chunk => chunk.data);

    return new Blob(recentChunks, { type: 'video/webm' });
  }

  public stop(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    
    this.chunks = [];
  }
}

// Highlight Detection System
class HighlightDetector {
  private gameId: string = '';
  private highlights: HighlightMarker[] = [];
  private audioThreshold = 0.8;
  private isDetecting = false;
  private detectionInterval = 0;

  public start(gameTitle: string): void {
    this.gameId = this.detectGameId(gameTitle);
    this.isDetecting = true;
    this.highlights = [];

    // Start detection loop
    this.detectionInterval = window.setInterval(() => {
      this.detectHighlights();
    }, 5000); // Check every 5 seconds
  }

  public stop(): void {
    this.isDetecting = false;
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
    }
  }

  public processAudioLevel(level: number): void {
    // Detect audio spikes that might indicate exciting moments
    if (level > this.audioThreshold) {
      this.addHighlight('epic_moment', 'Audio spike detected', 0.6);
    }
  }

  private detectHighlights(): void {
    if (!this.isDetecting) return;

    // Game-specific highlight detection would be implemented here
    // For demonstration, add some mock detection logic
    
    if (Math.random() < 0.1) { // 10% chance of detecting a highlight
      const types: HighlightMarker['type'][] = ['kill', 'achievement', 'epic_moment'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      this.addHighlight(type, `Detected ${type} moment`, 0.7 + Math.random() * 0.3);
    }
  }

  private addHighlight(type: HighlightMarker['type'], description: string, confidence: number): void {
    const highlight: HighlightMarker = {
      id: `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now() / 1000, // Current time in seconds
      type,
      confidence,
      description,
      duration: 15, // Default 15-second highlight
      thumbnailTime: 0,
      tags: [type, 'auto_detected'],
    };

    this.highlights.push(highlight);
  }

  public async getDetectedHighlights(): Promise<HighlightMarker[]> {
    return [...this.highlights];
  }

  private detectGameId(gameTitle: string): string {
    // Same logic as in GameRecorder
    const gameMap: Record<string, string> = {
      'VALORANT': 'valorant',
      'Counter-Strike': 'csgo',
      'Apex Legends': 'apex',
      'League of Legends': 'lol',
      'Overwatch': 'overwatch',
    };
    
    for (const [title, id] of Object.entries(gameMap)) {
      if (gameTitle.includes(title)) {
        return id;
      }
    }
    
    return 'unknown';
  }
}

// Export recorder instance
export const gameRecorder = new GameRecorder();
