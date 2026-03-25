/**
 * AI-Powered Highlight Detection System for IgnisStream
 * Automatically identifies epic moments in gameplay videos using computer vision and audio analysis
 */

interface HighlightMoment {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  confidence: number;
  type: 'kill_streak' | 'clutch' | 'ace' | 'multikill' | 'skillshot' | 'comeback' | 'achievement' | 'funny_moment' | 'fail';
  game: string;
  title: string;
  description: string;
  thumbnailTime: number;
  detectionFactors: {
    audioSpike: number;
    visualIntensity: number;
    uiChanges: number;
    playerReaction: number;
    gameEvents: number;
  };
  tags: string[];
  shareability: number; // 0-1 score for social media potential
  clipSuggestion: {
    recommended: boolean;
    optimalStart: number;
    optimalEnd: number;
    reason: string;
  };
}

interface VideoAnalysisResult {
  videoId: string;
  duration: number;
  game: string;
  highlights: HighlightMoment[];
  processingTime: number;
  analysisMetadata: {
    fps: number;
    resolution: string;
    audioChannels: number;
    gameDetected: boolean;
    qualityScore: number;
  };
  suggestedClips: HighlightMoment[];
  bestMoments: HighlightMoment[];
}

interface GameSpecificDetector {
  game: string;
  patterns: {
    killFeedPatterns: RegExp[];
    scoringPatterns: RegExp[];
    achievementPatterns: RegExp[];
    uiElements: {
      killFeed: { x: number; y: number; width: number; height: number };
      scoreBoard: { x: number; y: number; width: number; height: number };
      minimap: { x: number; y: number; width: number; height: number };
    };
  };
  audioSignatures: {
    killSounds: string[];
    achievementSounds: string[];
    criticalMoments: string[];
  };
  thresholds: {
    minHighlightDuration: number;
    maxHighlightDuration: number;
    confidenceThreshold: number;
  };
}

export class HighlightDetectionSystem {
  private gameDetectors: Map<string, GameSpecificDetector> = new Map();
  private modelCache: Map<string, any> = new Map();
  private processingQueue: Array<{ videoId: string; videoUrl: string; priority: number }> = [];
  private isProcessing = false;

  constructor() {
    this.initializeGameDetectors();
    this.loadAIModels();
  }

  // Initialize game-specific detection patterns
  private initializeGameDetectors(): void {
    // Valorant detector
    this.gameDetectors.set('valorant', {
      game: 'valorant',
      patterns: {
        killFeedPatterns: [
          /.*eliminated.*/i,
          /.*\+\d+.*XP/i,
          /.*headshot.*/i,
        ],
        scoringPatterns: [
          /ROUND\s+WON/i,
          /MATCH\s+WON/i,
          /ACE/i,
        ],
        achievementPatterns: [
          /TRIPLE\s+KILL/i,
          /QUADRA\s+KILL/i,
          /PENTAKILL/i,
          /CLUTCH/i,
        ],
        uiElements: {
          killFeed: { x: 0.65, y: 0.15, width: 0.3, height: 0.4 },
          scoreBoard: { x: 0.4, y: 0.05, width: 0.2, height: 0.1 },
          minimap: { x: 0.02, y: 0.02, width: 0.2, height: 0.2 },
        },
      },
      audioSignatures: [
        'headshot_sound',
        'elimination_sound',
        'round_win_sound',
        'ace_sound',
      ],
      thresholds: {
        minHighlightDuration: 5,
        maxHighlightDuration: 30,
        confidenceThreshold: 0.6,
      },
    });

    // CS:GO detector
    this.gameDetectors.set('csgo', {
      game: 'csgo',
      patterns: {
        killFeedPatterns: [
          /.*killed.*with.*/i,
          /.*\+\$\d+/i,
          /.*headshot.*/i,
        ],
        scoringPatterns: [
          /TERRORISTS\s+WIN/i,
          /COUNTER-TERRORISTS\s+WIN/i,
          /BOMB\s+DEFUSED/i,
        ],
        achievementPatterns: [
          /DOUBLE\s+KILL/i,
          /TRIPLE\s+KILL/i,
          /MULTI\s+KILL/i,
          /ACE/i,
        ],
        uiElements: {
          killFeed: { x: 0.02, y: 0.75, width: 0.4, height: 0.2 },
          scoreBoard: { x: 0.4, y: 0.02, width: 0.2, height: 0.08 },
          minimap: { x: 0.02, y: 0.02, width: 0.25, height: 0.25 },
        },
      },
      audioSignatures: [
        'ak47_sound',
        'awp_sound',
        'bomb_plant_sound',
        'round_end_sound',
      ],
      thresholds: {
        minHighlightDuration: 8,
        maxHighlightDuration: 45,
        confidenceThreshold: 0.65,
      },
    });

    // Add more games (Apex, Overwatch, LoL, etc.)
    this.initializeAdditionalGames();
  }

  private initializeAdditionalGames(): void {
    // Apex Legends
    this.gameDetectors.set('apex', {
      game: 'apex',
      patterns: {
        killFeedPatterns: [/.*knocked down.*/i, /.*eliminated.*/i],
        scoringPatterns: [/CHAMPION/i, /YOU\s+ARE\s+THE\s+CHAMPION/i],
        achievementPatterns: [/SQUAD\s+WIPE/i, /TRIPLE\s+TAKE/i],
        uiElements: {
          killFeed: { x: 0.02, y: 0.3, width: 0.35, height: 0.4 },
          scoreBoard: { x: 0.85, y: 0.02, width: 0.13, height: 0.15 },
          minimap: { x: 0.85, y: 0.85, width: 0.13, height: 0.13 },
        },
      },
      audioSignatures: ['knockdown_sound', 'elimination_sound', 'champion_sound'],
      thresholds: { minHighlightDuration: 10, maxHighlightDuration: 60, confidenceThreshold: 0.55 },
    });

    // League of Legends
    this.gameDetectors.set('lol', {
      game: 'lol',
      patterns: {
        killFeedPatterns: [/.*has slain.*/i, /.*FIRST BLOOD.*/i],
        scoringPatterns: [/VICTORY/i, /DEFEAT/i, /PENTAKILL/i],
        achievementPatterns: [/DOUBLE KILL/i, /TRIPLE KILL/i, /QUADRA KILL/i, /PENTAKILL/i],
        uiElements: {
          killFeed: { x: 0.3, y: 0.15, width: 0.4, height: 0.3 },
          scoreBoard: { x: 0.4, y: 0.02, width: 0.2, height: 0.05 },
          minimap: { x: 0.77, y: 0.77, width: 0.21, height: 0.21 },
        },
      },
      audioSignatures: ['kill_sound', 'multikill_sound', 'victory_sound'],
      thresholds: { minHighlightDuration: 15, maxHighlightDuration: 90, confidenceThreshold: 0.6 },
    });
  }

  // Load AI models for video analysis
  private async loadAIModels(): Promise<void> {
    try {
      // In production, load actual TensorFlow.js or similar models
      console.log('Loading AI models for highlight detection...');
      
      // Mock model loading
      this.modelCache.set('objectDetection', { loaded: true });
      this.modelCache.set('audioClassification', { loaded: true });
      this.modelCache.set('textDetection', { loaded: true });
      
      console.log('AI models loaded successfully');
    } catch (error) {
      console.error('Failed to load AI models:', error);
    }
  }

  // Main entry point for video analysis
  async analyzeVideo(
    videoId: string,
    videoUrl: string,
    options: {
      priority?: number;
      game?: string;
      skipCache?: boolean;
      generateClips?: boolean;
    } = {}
  ): Promise<VideoAnalysisResult> {
    const { priority = 1, game, skipCache = false, generateClips = true } = options;

    // Check cache first
    if (!skipCache) {
      const cached = await this.getCachedResult(videoId);
      if (cached) return cached;
    }

    // Add to processing queue
    return new Promise((resolve, reject) => {
      this.processingQueue.push({
        videoId,
        videoUrl,
        priority,
      });

      // Sort queue by priority
      this.processingQueue.sort((a, b) => b.priority - a.priority);

      // Start processing if not already running
      if (!this.isProcessing) {
        this.processQueue().then(() => {
          this.getCachedResult(videoId).then(result => {
            if (result) {
              resolve(result);
            } else {
              reject(new Error('Failed to process video'));
            }
          });
        });
      }
    });
  }

  // Process video queue
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.processingQueue.length === 0) return;

    this.isProcessing = true;

    while (this.processingQueue.length > 0) {
      const { videoId, videoUrl } = this.processingQueue.shift()!;
      
      try {
        const result = await this.processVideo(videoId, videoUrl);
        await this.cacheResult(videoId, result);
      } catch (error) {
        console.error(`Failed to process video ${videoId}:`, error);
      }
    }

    this.isProcessing = false;
  }

  // Core video processing logic
  private async processVideo(videoId: string, videoUrl: string): Promise<VideoAnalysisResult> {
    const startTime = Date.now();
    
    // Initialize result
    const result: VideoAnalysisResult = {
      videoId,
      duration: 0,
      game: 'unknown',
      highlights: [],
      processingTime: 0,
      analysisMetadata: {
        fps: 30,
        resolution: '1920x1080',
        audioChannels: 2,
        gameDetected: false,
        qualityScore: 0.8,
      },
      suggestedClips: [],
      bestMoments: [],
    };

    try {
      // Step 1: Extract video metadata
      const metadata = await this.extractVideoMetadata(videoUrl);
      result.duration = metadata.duration;
      result.analysisMetadata = { ...result.analysisMetadata, ...metadata };

      // Step 2: Detect game from video
      const detectedGame = await this.detectGame(videoUrl);
      result.game = detectedGame;
      result.analysisMetadata.gameDetected = detectedGame !== 'unknown';

      // Step 3: Analyze video for highlights
      const highlights = await this.detectHighlights(videoUrl, detectedGame);
      result.highlights = highlights;

      // Step 4: Generate clip suggestions
      result.suggestedClips = this.generateClipSuggestions(highlights);
      result.bestMoments = this.selectBestMoments(highlights, 3);

      result.processingTime = Date.now() - startTime;

    } catch (error) {
      console.error('Video processing error:', error);
      throw error;
    }

    return result;
  }

  // Extract video metadata using FFmpeg or similar
  private async extractVideoMetadata(videoUrl: string): Promise<any> {
    // Mock implementation - in production, use FFmpeg.js or server-side processing
    return {
      duration: 300, // 5 minutes
      fps: 60,
      resolution: '1920x1080',
      audioChannels: 2,
      qualityScore: 0.85,
    };
  }

  // Detect game from video using computer vision
  private async detectGame(videoUrl: string): Promise<string> {
    try {
      // In production, analyze first few frames to identify game UI elements
      // For now, return mock detection
      
      // Analyze UI elements, logos, HUD layouts
      const gameSignatures = await this.analyzeGameUISignatures(videoUrl);
      
      // Check against known game patterns
      for (const [gameName, detector] of this.gameDetectors.entries()) {
        if (this.matchesGameSignature(gameSignatures, detector)) {
          return gameName;
        }
      }

      return 'unknown';
    } catch (error) {
      console.error('Game detection failed:', error);
      return 'unknown';
    }
  }

  private async analyzeGameUISignatures(videoUrl: string): Promise<any> {
    // Mock game signature analysis
    return {
      hasKillFeed: true,
      hasHealthBar: true,
      hasAmmoCounter: true,
      uiLayout: 'competitive_fps',
    };
  }

  private matchesGameSignature(signatures: any, detector: GameSpecificDetector): boolean {
    // Mock signature matching logic
    return Math.random() > 0.5; // Simplified for demo
  }

  // Main highlight detection logic
  private async detectHighlights(videoUrl: string, game: string): Promise<HighlightMoment[]> {
    const highlights: HighlightMoment[] = [];
    const gameDetector = this.gameDetectors.get(game);

    if (!gameDetector) {
      return this.genericHighlightDetection(videoUrl);
    }

    // Analyze video in segments
    const segmentDuration = 10; // 10-second segments
    const totalDuration = 300; // Mock 5-minute video
    
    for (let time = 0; time < totalDuration; time += segmentDuration) {
      const segment = await this.analyzeVideoSegment(videoUrl, time, segmentDuration, gameDetector);
      
      if (segment.confidence > gameDetector.thresholds.confidenceThreshold) {
        highlights.push(segment);
      }
    }

    // Merge overlapping highlights
    return this.mergeOverlappingHighlights(highlights);
  }

  // Analyze individual video segment
  private async analyzeVideoSegment(
    videoUrl: string,
    startTime: number,
    duration: number,
    detector: GameSpecificDetector
  ): Promise<HighlightMoment> {
    const endTime = startTime + duration;
    
    // Multi-modal analysis
    const [audioAnalysis, visualAnalysis, textAnalysis] = await Promise.all([
      this.analyzeAudioSegment(videoUrl, startTime, duration),
      this.analyzeVisualSegment(videoUrl, startTime, duration, detector),
      this.analyzeTextInSegment(videoUrl, startTime, duration, detector),
    ]);

    // Combine analysis results
    const detectionFactors = {
      audioSpike: audioAnalysis.intensityScore,
      visualIntensity: visualAnalysis.actionScore,
      uiChanges: textAnalysis.eventScore,
      playerReaction: audioAnalysis.reactionScore,
      gameEvents: textAnalysis.gameEventScore,
    };

    // Calculate overall confidence
    const confidence = this.calculateHighlightConfidence(detectionFactors);

    // Determine highlight type
    const type = this.determineHighlightType(detectionFactors, textAnalysis.detectedEvents);

    // Generate title and description
    const { title, description } = this.generateHighlightMetadata(type, textAnalysis.detectedEvents);

    return {
      id: `highlight_${startTime}_${endTime}`,
      startTime,
      endTime,
      duration,
      confidence,
      type,
      game: detector.game,
      title,
      description,
      thumbnailTime: startTime + duration / 2,
      detectionFactors,
      tags: this.generateHighlightTags(type, textAnalysis.detectedEvents),
      shareability: this.calculateShareability(confidence, type),
      clipSuggestion: this.generateClipSuggestion(startTime, endTime, confidence, type),
    };
  }

  // Audio analysis for excitement detection
  private async analyzeAudioSegment(videoUrl: string, startTime: number, duration: number): Promise<{
    intensityScore: number;
    reactionScore: number;
    detectedSounds: string[];
  }> {
    // Mock audio analysis - in production, use Web Audio API or ML models
    const mockIntensity = Math.random();
    const mockReaction = Math.random();

    return {
      intensityScore: mockIntensity,
      reactionScore: mockReaction,
      detectedSounds: mockIntensity > 0.7 ? ['gunshot', 'explosion'] : ['ambient'],
    };
  }

  // Visual analysis for action detection
  private async analyzeVisualSegment(
    videoUrl: string,
    startTime: number,
    duration: number,
    detector: GameSpecificDetector
  ): Promise<{
    actionScore: number;
    detectedObjects: string[];
    motionIntensity: number;
  }> {
    // Mock visual analysis
    const mockAction = Math.random();
    
    return {
      actionScore: mockAction,
      detectedObjects: mockAction > 0.6 ? ['muzzle_flash', 'explosion'] : [],
      motionIntensity: mockAction,
    };
  }

  // Text/OCR analysis for game events
  private async analyzeTextInSegment(
    videoUrl: string,
    startTime: number,
    duration: number,
    detector: GameSpecificDetector
  ): Promise<{
    eventScore: number;
    gameEventScore: number;
    detectedEvents: string[];
    detectedText: string[];
  }> {
    // Mock OCR analysis
    const mockEvents = Math.random() > 0.7 ? ['DOUBLE KILL', 'HEADSHOT'] : [];
    
    return {
      eventScore: mockEvents.length > 0 ? 0.8 : 0.2,
      gameEventScore: mockEvents.length * 0.3,
      detectedEvents: mockEvents,
      detectedText: mockEvents,
    };
  }

  // Calculate highlight confidence score
  private calculateHighlightConfidence(factors: HighlightMoment['detectionFactors']): number {
    const weights = {
      audioSpike: 0.25,
      visualIntensity: 0.30,
      uiChanges: 0.25,
      playerReaction: 0.10,
      gameEvents: 0.10,
    };

    return Object.entries(factors).reduce(
      (sum, [factor, score]) => sum + score * weights[factor as keyof typeof weights],
      0
    );
  }

  // Determine highlight type based on detected events
  private determineHighlightType(
    factors: HighlightMoment['detectionFactors'],
    detectedEvents: string[]
  ): HighlightMoment['type'] {
    if (detectedEvents.some(event => event.includes('ACE'))) {
      return 'ace';
    }
    if (detectedEvents.some(event => event.includes('CLUTCH'))) {
      return 'clutch';
    }
    if (detectedEvents.some(event => event.includes('TRIPLE') || event.includes('QUADRA'))) {
      return 'multikill';
    }
    if (factors.gameEvents > 0.6) {
      return 'kill_streak';
    }
    if (factors.visualIntensity > 0.8) {
      return 'skillshot';
    }
    
    return 'kill_streak'; // Default
  }

  // Generate highlight metadata
  private generateHighlightMetadata(type: HighlightMoment['type'], events: string[]): {
    title: string;
    description: string;
  } {
    const templates = {
      ace: {
        title: '🔥 ACE - Team Wipe!',
        description: 'Incredible ace round eliminating the entire enemy team',
      },
      clutch: {
        title: '💪 Clutch Victory',
        description: 'Amazing clutch play in a high-pressure situation',
      },
      multikill: {
        title: '⚡ Multi-Kill Spree',
        description: 'Multiple eliminations in quick succession',
      },
      kill_streak: {
        title: '🎯 Kill Streak',
        description: 'Impressive elimination streak',
      },
      skillshot: {
        title: '🎭 Epic Skillshot',
        description: 'Incredible skill-based play',
      },
      comeback: {
        title: '🔄 Epic Comeback',
        description: 'Amazing comeback from a difficult situation',
      },
      achievement: {
        title: '🏆 Achievement Unlocked',
        description: 'Milestone achievement moment',
      },
      funny_moment: {
        title: '😂 Funny Moment',
        description: 'Hilarious gaming moment',
      },
      fail: {
        title: '🤦 Epic Fail',
        description: 'Amusing gaming mishap',
      },
    };

    return templates[type] || templates.kill_streak;
  }

  // Generate relevant tags
  private generateHighlightTags(type: HighlightMoment['type'], events: string[]): string[] {
    const baseTags = [type.replace('_', ''), 'gaming', 'highlight'];
    const eventTags = events.map(event => event.toLowerCase().replace(/\s+/g, '_'));
    
    return [...baseTags, ...eventTags];
  }

  // Calculate social media shareability score
  private calculateShareability(confidence: number, type: HighlightMoment['type']): number {
    const typeMultipliers = {
      ace: 1.0,
      clutch: 0.9,
      multikill: 0.8,
      skillshot: 0.7,
      kill_streak: 0.6,
      comeback: 0.8,
      achievement: 0.5,
      funny_moment: 0.9,
      fail: 0.7,
    };

    return confidence * (typeMultipliers[type] || 0.5);
  }

  // Generate clip suggestion
  private generateClipSuggestion(
    startTime: number,
    endTime: number,
    confidence: number,
    type: HighlightMoment['type']
  ): HighlightMoment['clipSuggestion'] {
    const shouldRecommend = confidence > 0.7;
    
    // Add buffer time for context
    const buffer = type === 'ace' ? 10 : 5;
    
    return {
      recommended: shouldRecommend,
      optimalStart: Math.max(0, startTime - buffer),
      optimalEnd: endTime + buffer,
      reason: shouldRecommend 
        ? `High confidence ${type} with great shareability potential`
        : 'Below confidence threshold for clip generation',
    };
  }

  // Generic highlight detection for unknown games
  private async genericHighlightDetection(videoUrl: string): Promise<HighlightMoment[]> {
    // Fallback to general excitement detection based on audio/visual intensity
    const highlights: HighlightMoment[] = [];
    
    // Mock generic detection
    for (let i = 0; i < 3; i++) {
      const start = Math.random() * 200;
      highlights.push({
        id: `generic_${i}`,
        startTime: start,
        endTime: start + 15,
        duration: 15,
        confidence: 0.5 + Math.random() * 0.3,
        type: 'kill_streak',
        game: 'unknown',
        title: 'Gaming Highlight',
        description: 'Detected exciting gameplay moment',
        thumbnailTime: start + 7,
        detectionFactors: {
          audioSpike: Math.random(),
          visualIntensity: Math.random(),
          uiChanges: Math.random(),
          playerReaction: Math.random(),
          gameEvents: Math.random(),
        },
        tags: ['gaming', 'highlight'],
        shareability: 0.6,
        clipSuggestion: {
          recommended: true,
          optimalStart: start - 5,
          optimalEnd: start + 20,
          reason: 'General excitement detection',
        },
      });
    }
    
    return highlights;
  }

  // Merge overlapping highlights
  private mergeOverlappingHighlights(highlights: HighlightMoment[]): HighlightMoment[] {
    if (highlights.length <= 1) return highlights;

    const sorted = highlights.sort((a, b) => a.startTime - b.startTime);
    const merged: HighlightMoment[] = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i];
      const last = merged[merged.length - 1];

      // If overlapping, merge
      if (current.startTime <= last.endTime + 5) { // 5-second buffer
        last.endTime = Math.max(last.endTime, current.endTime);
        last.duration = last.endTime - last.startTime;
        last.confidence = Math.max(last.confidence, current.confidence);
        
        // Merge tags and factors
        last.tags = [...new Set([...last.tags, ...current.tags])];
      } else {
        merged.push(current);
      }
    }

    return merged;
  }

  // Generate clip suggestions
  private generateClipSuggestions(highlights: HighlightMoment[]): HighlightMoment[] {
    return highlights
      .filter(h => h.clipSuggestion.recommended)
      .sort((a, b) => b.shareability - a.shareability)
      .slice(0, 5); // Top 5 suggestions
  }

  // Select best moments
  private selectBestMoments(highlights: HighlightMoment[], count: number): HighlightMoment[] {
    return highlights
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, count);
  }

  // Cache management
  private async getCachedResult(videoId: string): Promise<VideoAnalysisResult | null> {
    try {
      const cached = localStorage.getItem(`highlight_${videoId}`);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }

  private async cacheResult(videoId: string, result: VideoAnalysisResult): Promise<void> {
    try {
      localStorage.setItem(`highlight_${videoId}`, JSON.stringify(result));
    } catch (error) {
      console.warn('Failed to cache highlight result:', error);
    }
  }

  // Public utility methods
  async getHighlightClip(
    videoUrl: string,
    highlight: HighlightMoment,
    format: 'mp4' | 'gif' | 'webm' = 'mp4'
  ): Promise<Blob> {
    // In production, use FFmpeg.js to extract clip
    throw new Error('Clip extraction not implemented - requires FFmpeg.js');
  }

  async generateThumbnail(videoUrl: string, timeSeconds: number): Promise<string> {
    // Extract frame at specified time
    return '/api/video/thumbnail?url=' + encodeURIComponent(videoUrl) + '&t=' + timeSeconds;
  }

  // Get processing status
  getProcessingStatus(): {
    isProcessing: boolean;
    queueLength: number;
    currentVideoId: string | null;
  } {
    return {
      isProcessing: this.isProcessing,
      queueLength: this.processingQueue.length,
      currentVideoId: this.processingQueue[0]?.videoId || null,
    };
  }

  // Analytics
  getDetectionStats(): {
    totalProcessed: number;
    averageHighlights: number;
    topGames: string[];
    popularHighlightTypes: string[];
  } {
    // Mock stats - in production, track real metrics
    return {
      totalProcessed: 1250,
      averageHighlights: 3.2,
      topGames: ['valorant', 'csgo', 'apex', 'lol'],
      popularHighlightTypes: ['kill_streak', 'ace', 'clutch', 'multikill'],
    };
  }
}

// Gaming highlight utilities
export const HighlightUtils = {
  formatDuration: (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  },

  getHighlightEmoji: (type: HighlightMoment['type']): string => {
    const emojis = {
      ace: '🔥',
      clutch: '💪',
      multikill: '⚡',
      kill_streak: '🎯',
      skillshot: '🎭',
      comeback: '🔄',
      achievement: '🏆',
      funny_moment: '😂',
      fail: '🤦',
    };
    return emojis[type] || '🎮';
  },

  getConfidenceLabel: (confidence: number): string => {
    if (confidence >= 0.8) return 'Very High';
    if (confidence >= 0.6) return 'High';
    if (confidence >= 0.4) return 'Medium';
    return 'Low';
  },

  generateShareText: (highlight: HighlightMoment): string => {
    const emoji = HighlightUtils.getHighlightEmoji(highlight.type);
    return `${emoji} ${highlight.title} - ${highlight.description} #${highlight.game} #gaming #highlights`;
  },
};

// Initialize highlight detection system
export const highlightDetectionSystem = new HighlightDetectionSystem();
