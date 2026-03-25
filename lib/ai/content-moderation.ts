/**
 * Smart Content Moderation System for IgnisStream
 * AI-powered detection of inappropriate content with gaming-specific context
 */

interface ModerationResult {
  isAppropriate: boolean;
  confidence: number;
  categories: {
    adult: number;        // 18+ content
    violence: number;     // Excessive violence
    profanity: number;    // Strong language
    harassment: number;   // Bullying/harassment
    spam: number;         // Spam content
    hate: number;         // Hate speech
  };
  detectedWords: string[];
  suggestedAction: 'approve' | 'flag' | 'block' | 'review';
  explanation: string;
  gamingContext?: {
    isGameRelated: boolean;
    gameTitle?: string;
    isCompetitiveTrash: boolean; // Competitive gaming trash talk
  };
}

interface ModerationConfig {
  strictness: 'relaxed' | 'moderate' | 'strict';
  enableGamingContext: boolean;
  customWordList: string[];
  whitelistedTerms: string[];
  ageRating: 'teen' | 'mature' | 'adult';
}

interface ImageModerationResult {
  isAppropriate: boolean;
  confidence: number;
  categories: {
    adult: number;
    violence: number;
    suggestive: number;
    medical: number;
    racy: number;
  };
  detectedObjects: string[];
  faces: {
    count: number;
    ageEstimates: number[];
    expressions: string[];
  };
}

export class ContentModerationSystem {
  private config: ModerationConfig;
  private profanityList: Set<string>;
  private gamingTerms: Set<string>;
  private competitiveTrashTalk: Set<string>;
  private whitelistedGamingTerms: Set<string>;
  private aiClient: any = null;

  constructor(config: Partial<ModerationConfig> = {}) {
    this.config = {
      strictness: 'moderate',
      enableGamingContext: true,
      customWordList: [],
      whitelistedTerms: [],
      ageRating: 'teen',
      ...config,
    };

    this.initializeProfanityFilters();
    this.initializeGamingContext();
    this.initializeAIClient();
  }

  private initializeProfanityFilters(): void {
    // Moderate profanity list - not overly strict for gaming
    this.profanityList = new Set([
      // Strong profanity that should be blocked
      'fuck', 'shit', 'bitch', 'asshole', 'damn', 'hell',
      'crap', 'piss', 'bastard', 'slut', 'whore',
      
      // Hate speech and slurs (always blocked)
      'nigger', 'faggot', 'retard', 'chink', 'spic',
      'kike', 'wetback', 'raghead', 'towelhead',
      
      // Sexually explicit terms
      'porn', 'nude', 'naked', 'sex', 'dick', 'cock',
      'pussy', 'boobs', 'tits', 'penis', 'vagina',
      
      // Harassment terms
      'kill yourself', 'kys', 'suicide', 'die',
      'cancer', 'aids', 'hitler', 'nazi',
      
      // Add custom words from config
      ...this.config.customWordList,
    ]);
  }

  private initializeGamingContext(): void {
    // Common gaming terms that might be flagged but are acceptable
    this.gamingTerms = new Set([
      'kill', 'died', 'death', 'murder', 'shot', 'shooting',
      'blood', 'violence', 'war', 'battle', 'fight', 'combat',
      'weapon', 'gun', 'sword', 'knife', 'bomb', 'explosion',
      'headshot', 'frag', 'pwn', 'rekt', 'owned', 'noob',
      'camping', 'rushing', 'flanking', 'clutch', 'ace',
    ]);

    // Competitive trash talk that's part of gaming culture (mild)
    this.competitiveTrashTalk = new Set([
      'ez', 'easy', 'git gud', 'get good', 'trash', 'bad',
      'noob', 'scrub', 'casual', 'tryhard', 'sweat',
      'rekt', 'owned', 'pwned', 'demolished', 'destroyed',
    ]);

    // Gaming terms that should never be flagged
    this.whitelistedGamingTerms = new Set([
      'kill streak', 'death match', 'battle royale', 'first person shooter',
      'multiplayer', 'cooperative', 'pvp', 'pve', 'mmorpg',
      'fps', 'rts', 'moba', 'rpg', 'strategy', 'simulation',
      ...this.config.whitelistedTerms,
    ]);
  }

  private async initializeAIClient(): Promise<void> {
    try {
      // Initialize OpenAI or similar AI service
      this.aiClient = {
        // Mock AI client - replace with actual implementation
        moderateContent: async (content: string) => {
          return { flagged: false, categories: {} };
        },
        moderateImage: async (imageUrl: string) => {
          return { flagged: false, categories: {} };
        },
      };
    } catch (error) {
      console.error('Failed to initialize AI moderation client:', error);
    }
  }

  // Main text moderation function
  async moderateText(content: string, context?: {
    userId?: string;
    gameTitle?: string;
    messageType?: 'post' | 'comment' | 'chat' | 'bio';
  }): Promise<ModerationResult> {
    const normalizedContent = content.toLowerCase().trim();
    
    // Initialize result
    const result: ModerationResult = {
      isAppropriate: true,
      confidence: 0,
      categories: {
        adult: 0,
        violence: 0,
        profanity: 0,
        harassment: 0,
        spam: 0,
        hate: 0,
      },
      detectedWords: [],
      suggestedAction: 'approve',
      explanation: 'Content appears appropriate',
      gamingContext: {
        isGameRelated: false,
        isCompetitiveTrash: false,
      },
    };

    // Detect gaming context
    const gamingContext = this.analyzeGamingContext(normalizedContent, context?.gameTitle);
    result.gamingContext = gamingContext;

    // Check for profanity with gaming context
    const profanityCheck = this.checkProfanity(normalizedContent, gamingContext);
    result.categories.profanity = profanityCheck.score;
    result.detectedWords.push(...profanityCheck.words);

    // Check for adult content
    const adultCheck = this.checkAdultContent(normalizedContent);
    result.categories.adult = adultCheck.score;
    result.detectedWords.push(...adultCheck.words);

    // Check for harassment
    const harassmentCheck = this.checkHarassment(normalizedContent);
    result.categories.harassment = harassmentCheck.score;
    result.detectedWords.push(...harassmentCheck.words);

    // Check for hate speech
    const hateCheck = this.checkHateSpeech(normalizedContent);
    result.categories.hate = hateCheck.score;
    result.detectedWords.push(...hateCheck.words);

    // Check for spam
    const spamCheck = this.checkSpam(normalizedContent);
    result.categories.spam = spamCheck.score;

    // Violence check with gaming context
    const violenceCheck = this.checkViolence(normalizedContent, gamingContext);
    result.categories.violence = violenceCheck.score;
    result.detectedWords.push(...violenceCheck.words);

    // Use AI for additional analysis if available
    if (this.aiClient) {
      try {
        const aiResult = await this.aiClient.moderateContent(content);
        this.incorporateAIResults(result, aiResult);
      } catch (error) {
        console.warn('AI moderation failed, using rule-based only:', error);
      }
    }

    // Calculate overall confidence and decision
    this.calculateFinalDecision(result);

    return result;
  }

  // Image moderation
  async moderateImage(imageUrl: string, context?: {
    userId?: string;
    gameTitle?: string;
  }): Promise<ImageModerationResult> {
    const result: ImageModerationResult = {
      isAppropriate: true,
      confidence: 0,
      categories: {
        adult: 0,
        violence: 0,
        suggestive: 0,
        medical: 0,
        racy: 0,
      },
      detectedObjects: [],
      faces: {
        count: 0,
        ageEstimates: [],
        expressions: [],
      },
    };

    try {
      // Use AI service for image analysis
      if (this.aiClient) {
        const aiResult = await this.aiClient.moderateImage(imageUrl);
        
        // Process AI results
        result.categories.adult = aiResult.adult || 0;
        result.categories.violence = aiResult.violence || 0;
        result.categories.suggestive = aiResult.suggestive || 0;
        result.categories.racy = aiResult.racy || 0;
        
        // Check thresholds based on config
        const threshold = this.getImageThreshold();
        const maxScore = Math.max(...Object.values(result.categories));
        
        result.isAppropriate = maxScore < threshold;
        result.confidence = maxScore;
      }

      // Additional gaming context analysis
      if (context?.gameTitle) {
        result.isAppropriate = this.adjustForGamingImage(result, context.gameTitle);
      }

    } catch (error) {
      console.error('Image moderation failed:', error);
      // Err on the side of caution
      result.isAppropriate = false;
      result.confidence = 0.5;
    }

    return result;
  }

  // Gaming context analysis
  private analyzeGamingContext(content: string, gameTitle?: string): {
    isGameRelated: boolean;
    gameTitle?: string;
    isCompetitiveTrash: boolean;
  } {
    const isGameRelated = Array.from(this.gamingTerms).some(term => 
      content.includes(term)
    ) || (gameTitle !== undefined);

    const isCompetitiveTrash = Array.from(this.competitiveTrashTalk).some(term =>
      content.includes(term)
    );

    return {
      isGameRelated,
      gameTitle,
      isCompetitiveTrash,
    };
  }

  // Profanity checking with gaming context
  private checkProfanity(content: string, gamingContext: any): {
    score: number;
    words: string[];
  } {
    const detectedWords: string[] = [];
    let score = 0;

    for (const word of this.profanityList) {
      if (content.includes(word)) {
        // Check if it's whitelisted in gaming context
        if (gamingContext.isGameRelated && this.whitelistedGamingTerms.has(word)) {
          continue;
        }

        detectedWords.push(word);
        
        // Different severity for different words
        if (['fuck', 'shit', 'damn'].includes(word)) {
          score += gamingContext.isGameRelated ? 0.3 : 0.6; // More lenient in gaming
        } else if (word.length > 0) {
          score += 0.8; // Stronger words get higher scores
        }
      }
    }

    return { score: Math.min(score, 1), words: detectedWords };
  }

  // Adult content detection
  private checkAdultContent(content: string): {
    score: number;
    words: string[];
  } {
    const adultTerms = [
      'porn', 'nude', 'naked', 'sex', 'sexual', 'xxx',
      'adult content', 'nsfw', 'only fans', 'onlyfans',
      'cam girl', 'webcam', 'strip', 'masturbate',
    ];

    const detectedWords: string[] = [];
    let score = 0;

    for (const term of adultTerms) {
      if (content.includes(term)) {
        detectedWords.push(term);
        score += 0.8;
      }
    }

    return { score: Math.min(score, 1), words: detectedWords };
  }

  // Harassment detection
  private checkHarassment(content: string): {
    score: number;
    words: string[];
  } {
    const harassmentPatterns = [
      'kill yourself', 'kys', 'commit suicide', 'end your life',
      'nobody likes you', 'you should die', 'worthless',
      'pathetic', 'loser', 'waste of space',
    ];

    const detectedWords: string[] = [];
    let score = 0;

    for (const pattern of harassmentPatterns) {
      if (content.includes(pattern)) {
        detectedWords.push(pattern);
        score += 0.9; // Harassment is serious
      }
    }

    // Check for repeated characters (typical spam/harassment)
    if (/(.)\1{4,}/.test(content)) {
      score += 0.3;
    }

    return { score: Math.min(score, 1), words: detectedWords };
  }

  // Hate speech detection
  private checkHateSpeech(content: string): {
    score: number;
    words: string[];
  } {
    const hateTerms = [
      'nigger', 'faggot', 'retard', 'chink', 'spic',
      'nazi', 'hitler', 'holocaust', 'jew', 'muslim',
      'terrorist', 'isis', 'bomb', 'attack',
    ];

    const detectedWords: string[] = [];
    let score = 0;

    for (const term of hateTerms) {
      if (content.includes(term)) {
        detectedWords.push(term);
        score = 1; // Hate speech gets maximum score
        break;
      }
    }

    return { score, words: detectedWords };
  }

  // Spam detection
  private checkSpam(content: string): {
    score: number;
  } {
    let score = 0;

    // Check for excessive repetition
    const words = content.split(' ');
    const uniqueWords = new Set(words);
    if (words.length > 5 && uniqueWords.size / words.length < 0.3) {
      score += 0.5;
    }

    // Check for excessive caps
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (capsRatio > 0.7 && content.length > 10) {
      score += 0.4;
    }

    // Check for URLs or promotional content
    if (content.includes('http') || content.includes('www.') || 
        content.includes('click here') || content.includes('subscribe')) {
      score += 0.6;
    }

    return { score: Math.min(score, 1) };
  }

  // Violence check with gaming context
  private checkViolence(content: string, gamingContext: any): {
    score: number;
    words: string[];
  } {
    const violenceTerms = [
      'murder', 'torture', 'gore', 'brutal', 'savage',
      'slaughter', 'massacre', 'butcher', 'mutilate',
    ];

    const detectedWords: string[] = [];
    let score = 0;

    for (const term of violenceTerms) {
      if (content.includes(term)) {
        // Much more lenient for gaming content
        if (gamingContext.isGameRelated) {
          score += 0.2; // Low score for gaming violence
        } else {
          score += 0.7; // Higher score for non-gaming violence
        }
        detectedWords.push(term);
      }
    }

    return { score: Math.min(score, 1), words: detectedWords };
  }

  // Incorporate AI results
  private incorporateAIResults(result: ModerationResult, aiResult: any): void {
    if (aiResult.flagged) {
      // Boost scores based on AI confidence
      Object.keys(result.categories).forEach(category => {
        if (aiResult.categories[category]) {
          result.categories[category as keyof typeof result.categories] = Math.max(
            result.categories[category as keyof typeof result.categories],
            aiResult.categories[category]
          );
        }
      });
    }
  }

  // Calculate final decision
  private calculateFinalDecision(result: ModerationResult): void {
    const weights = {
      adult: 0.9,
      violence: result.gamingContext?.isGameRelated ? 0.3 : 0.7,
      profanity: result.gamingContext?.isGameRelated ? 0.4 : 0.6,
      harassment: 0.9,
      spam: 0.5,
      hate: 1.0,
    };

    // Calculate weighted score
    let weightedScore = 0;
    let totalWeight = 0;

    Object.entries(result.categories).forEach(([category, score]) => {
      const weight = weights[category as keyof typeof weights];
      weightedScore += score * weight;
      totalWeight += weight;
    });

    result.confidence = weightedScore / totalWeight;

    // Adjust thresholds based on strictness
    const thresholds = this.getThresholds();

    // Make decision
    if (result.confidence >= thresholds.block) {
      result.isAppropriate = false;
      result.suggestedAction = 'block';
      result.explanation = 'Content contains inappropriate material';
    } else if (result.confidence >= thresholds.review) {
      result.isAppropriate = false;
      result.suggestedAction = 'review';
      result.explanation = 'Content flagged for manual review';
    } else if (result.confidence >= thresholds.flag) {
      result.isAppropriate = true;
      result.suggestedAction = 'flag';
      result.explanation = 'Content flagged but approved';
    } else {
      result.isAppropriate = true;
      result.suggestedAction = 'approve';
      result.explanation = 'Content appears appropriate';
    }

    // Special case for competitive gaming trash talk
    if (result.gamingContext?.isCompetitiveTrash && result.confidence < 0.6) {
      result.isAppropriate = true;
      result.suggestedAction = 'approve';
      result.explanation = 'Competitive gaming trash talk - approved';
    }
  }

  // Get thresholds based on strictness
  private getThresholds(): {
    flag: number;
    review: number;
    block: number;
  } {
    switch (this.config.strictness) {
      case 'relaxed':
        return { flag: 0.3, review: 0.6, block: 0.8 };
      case 'moderate':
        return { flag: 0.2, review: 0.5, block: 0.7 };
      case 'strict':
        return { flag: 0.1, review: 0.3, block: 0.5 };
      default:
        return { flag: 0.2, review: 0.5, block: 0.7 };
    }
  }

  private getImageThreshold(): number {
    switch (this.config.strictness) {
      case 'relaxed': return 0.7;
      case 'moderate': return 0.5;
      case 'strict': return 0.3;
      default: return 0.5;
    }
  }

  private adjustForGamingImage(result: ImageModerationResult, gameTitle: string): boolean {
    // Gaming images may contain violence - be more lenient
    if (result.categories.violence > 0.5 && result.categories.violence < 0.8) {
      return true; // Allow moderate gaming violence
    }
    
    return result.isAppropriate;
  }

  // Batch moderation for multiple messages
  async moderateBatch(contents: Array<{
    id: string;
    content: string;
    context?: any;
  }>): Promise<Map<string, ModerationResult>> {
    const results = new Map<string, ModerationResult>();
    
    // Process in parallel with rate limiting
    const batchSize = 10;
    for (let i = 0; i < contents.length; i += batchSize) {
      const batch = contents.slice(i, i + batchSize);
      const batchPromises = batch.map(async item => {
        const result = await this.moderateText(item.content, item.context);
        return { id: item.id, result };
      });
      
      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(({ id, result }) => {
        results.set(id, result);
      });
    }

    return results;
  }

  // Update configuration
  updateConfig(newConfig: Partial<ModerationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Reinitialize filters if needed
    if (newConfig.customWordList) {
      this.initializeProfanityFilters();
    }
  }

  // Get moderation statistics
  getStats(): {
    totalProcessed: number;
    flaggedCount: number;
    blockedCount: number;
    categories: Record<string, number>;
  } {
    // This would be tracked in a real implementation
    return {
      totalProcessed: 0,
      flaggedCount: 0,
      blockedCount: 0,
      categories: {},
    };
  }

  // Clean content suggestion
  suggestCleanContent(originalContent: string, detectedWords: string[]): string {
    let cleanContent = originalContent;
    
    detectedWords.forEach(word => {
      const replacement = '*'.repeat(word.length);
      cleanContent = cleanContent.replace(new RegExp(word, 'gi'), replacement);
    });

    return cleanContent;
  }
}

// Gaming-specific moderation presets
export const gamingModerationPresets = {
  competitive: {
    strictness: 'relaxed' as const,
    enableGamingContext: true,
    ageRating: 'teen' as const,
    whitelistedTerms: ['rekt', 'pwned', 'noob', 'ez', 'git gud'],
  },
  
  casual: {
    strictness: 'moderate' as const,
    enableGamingContext: true,
    ageRating: 'teen' as const,
    whitelistedTerms: ['kill', 'death', 'battle', 'war'],
  },
  
  family: {
    strictness: 'strict' as const,
    enableGamingContext: false,
    ageRating: 'teen' as const,
    whitelistedTerms: [],
  },
};

// Initialize content moderation system
export const contentModerationSystem = new ContentModerationSystem(
  gamingModerationPresets.competitive
);
