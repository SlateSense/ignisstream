/**
 * Advanced Haptic Feedback Manager for IgnisStream
 * Controller-style vibrations and gaming haptic patterns
 */

interface HapticPattern {
  id: string;
  name: string;
  description: string;
  category: 'ui' | 'gaming' | 'notification' | 'achievement';
  pattern: number[]; // Array of [duration_ms, intensity_0-1] pairs
  repeat?: number;
  intensity?: number; // Global intensity modifier
}

interface HapticEvent {
  type: 'success' | 'error' | 'warning' | 'achievement' | 'level_up' | 'match_found' | 'kill' | 'death' | 'damage' | 'reload' | 'interaction';
  intensity?: number;
  duration?: number;
  customPattern?: number[];
}

interface HapticCapabilities {
  hasVibration: boolean;
  hasGamepadVibration: boolean;
  hasAdvancedHaptics: boolean;
  maxIntensity: number;
  supportedPatterns: string[];
}

interface GamepadVibration {
  startDelay?: number;
  duration: number;
  weakMagnitude: number;
  strongMagnitude: number;
}

export class HapticManager {
  private isEnabled = true;
  private masterIntensity = 1.0;
  private capabilities: HapticCapabilities;
  private connectedGamepads: Map<number, Gamepad> = new Map();
  private hapticQueue: Array<{
    pattern: HapticPattern;
    timestamp: number;
    priority: number;
  }> = [];
  private isPlaying = false;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    this.capabilities = this.detectCapabilities();
    this.setupGamepadDetection();
    this.loadUserPreferences();
  }

  // Initialize haptic system
  async initialize(): Promise<boolean> {
    try {
      // Test basic vibration capability
      if (this.capabilities.hasVibration) {
        await this.testVibration();
      }

      // Set up gamepad vibration if available
      if (this.capabilities.hasGamepadVibration) {
        this.startGamepadMonitoring();
      }

      console.log('Haptic system initialized with capabilities:', this.capabilities);
      this.emit('initialized', this.capabilities);
      return true;
    } catch (error) {
      console.error('Failed to initialize haptic system:', error);
      return false;
    }
  }

  private detectCapabilities(): HapticCapabilities {
    const capabilities: HapticCapabilities = {
      hasVibration: 'vibrate' in navigator,
      hasGamepadVibration: 'getGamepads' in navigator,
      hasAdvancedHaptics: false,
      maxIntensity: 1.0,
      supportedPatterns: [],
    };

    // Check for advanced haptics (iOS/Android)
    if ('DeviceMotionEvent' in window && typeof DeviceMotionEvent.requestPermission === 'function') {
      capabilities.hasAdvancedHaptics = true;
    }

    // Check for Web Gamepad API vibration support
    try {
      const gamepads = navigator.getGamepads?.();
      if (gamepads) {
        for (const gamepad of gamepads) {
          if (gamepad?.vibrationActuator) {
            capabilities.hasGamepadVibration = true;
            break;
          }
        }
      }
    } catch (error) {
      console.warn('Gamepad API not available:', error);
    }

    // Supported pattern types
    capabilities.supportedPatterns = [
      'pulse', 'double_pulse', 'triple_pulse', 'long_buzz', 'short_buzz',
      'success', 'error', 'achievement', 'notification', 'gaming_hit',
      'gaming_reload', 'gaming_level_up', 'gaming_death'
    ];

    return capabilities;
  }

  // Gaming-specific haptic feedback
  async triggerGameEvent(event: HapticEvent): Promise<void> {
    if (!this.isEnabled) return;

    let pattern: HapticPattern;

    switch (event.type) {
      case 'achievement':
        pattern = this.getPattern('achievement_unlock');
        break;
      case 'level_up':
        pattern = this.getPattern('level_up');
        break;
      case 'match_found':
        pattern = this.getPattern('match_found');
        break;
      case 'kill':
        pattern = this.getPattern('gaming_kill');
        break;
      case 'death':
        pattern = this.getPattern('gaming_death');
        break;
      case 'damage':
        pattern = this.getPattern('gaming_damage');
        break;
      case 'reload':
        pattern = this.getPattern('gaming_reload');
        break;
      case 'success':
        pattern = this.getPattern('success');
        break;
      case 'error':
        pattern = this.getPattern('error');
        break;
      default:
        pattern = this.getPattern('default_pulse');
    }

    // Apply intensity modifier
    if (event.intensity !== undefined) {
      pattern = { ...pattern };
      pattern.intensity = event.intensity;
    }

    await this.playPattern(pattern);
  }

  // UI interaction haptics
  async triggerUIFeedback(type: 'button_tap' | 'toggle' | 'swipe' | 'long_press' | 'selection'): Promise<void> {
    if (!this.isEnabled) return;

    const patterns = {
      button_tap: this.getPattern('light_tap'),
      toggle: this.getPattern('toggle_switch'),
      swipe: this.getPattern('swipe_feedback'),
      long_press: this.getPattern('long_press'),
      selection: this.getPattern('selection_tick'),
    };

    await this.playPattern(patterns[type]);
  }

  // Achievement and notification haptics
  async triggerNotificationHaptic(type: 'message' | 'friend_request' | 'tournament' | 'stream' | 'urgent'): Promise<void> {
    if (!this.isEnabled) return;

    const patterns = {
      message: this.getPattern('message_notification'),
      friend_request: this.getPattern('friend_request'),
      tournament: this.getPattern('tournament_update'),
      stream: this.getPattern('stream_notification'),
      urgent: this.getPattern('urgent_notification'),
    };

    await this.playPattern(patterns[type]);
  }

  // Custom pattern playback
  async playCustomPattern(pattern: number[], intensity = 1.0): Promise<void> {
    if (!this.isEnabled) return;

    const customPattern: HapticPattern = {
      id: 'custom',
      name: 'Custom Pattern',
      description: 'User-defined haptic pattern',
      category: 'ui',
      pattern,
      intensity,
    };

    await this.playPattern(customPattern);
  }

  // Main pattern playback method
  private async playPattern(pattern: HapticPattern): Promise<void> {
    const priority = this.getPatternPriority(pattern);
    
    // Add to queue with priority
    this.hapticQueue.push({
      pattern,
      timestamp: Date.now(),
      priority,
    });

    // Sort queue by priority (higher priority first)
    this.hapticQueue.sort((a, b) => b.priority - a.priority);

    // Play if not already playing
    if (!this.isPlaying) {
      await this.processHapticQueue();
    }
  }

  private async processHapticQueue(): Promise<void> {
    if (this.hapticQueue.length === 0 || this.isPlaying) return;

    this.isPlaying = true;

    while (this.hapticQueue.length > 0) {
      const { pattern } = this.hapticQueue.shift()!;
      
      try {
        await this.executePattern(pattern);
      } catch (error) {
        console.error('Error executing haptic pattern:', error);
      }
    }

    this.isPlaying = false;
  }

  private async executePattern(pattern: HapticPattern): Promise<void> {
    const intensity = (pattern.intensity || 1.0) * this.masterIntensity;
    const repeat = pattern.repeat || 1;

    for (let i = 0; i < repeat; i++) {
      // Try gamepad vibration first (more precise)
      if (this.capabilities.hasGamepadVibration && this.connectedGamepads.size > 0) {
        await this.executeGamepadPattern(pattern, intensity);
      }
      
      // Fallback to device vibration
      else if (this.capabilities.hasVibration) {
        await this.executeDevicePattern(pattern, intensity);
      }

      // Wait between repeats
      if (i < repeat - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  private async executeGamepadPattern(pattern: HapticPattern, intensity: number): Promise<void> {
    for (const gamepad of this.connectedGamepads.values()) {
      if (gamepad.vibrationActuator) {
        for (let i = 0; i < pattern.pattern.length; i += 2) {
          const duration = pattern.pattern[i];
          const vibrationIntensity = pattern.pattern[i + 1] * intensity;

          try {
            await gamepad.vibrationActuator.playEffect('dual-rumble', {
              startDelay: 0,
              duration,
              weakMagnitude: vibrationIntensity * 0.5,
              strongMagnitude: vibrationIntensity,
            });
          } catch (error) {
            console.warn('Gamepad vibration error:', error);
          }
        }
      }
    }
  }

  private async executeDevicePattern(pattern: HapticPattern, intensity: number): Promise<void> {
    const vibrationPattern: number[] = [];

    for (let i = 0; i < pattern.pattern.length; i += 2) {
      const duration = pattern.pattern[i];
      const vibrationIntensity = pattern.pattern[i + 1] * intensity;

      // Convert intensity to duration (simple approximation)
      const adjustedDuration = Math.round(duration * vibrationIntensity);
      
      vibrationPattern.push(adjustedDuration);
      
      // Add pause between pulses
      if (i + 2 < pattern.pattern.length) {
        vibrationPattern.push(50); // 50ms pause
      }
    }

    if (vibrationPattern.length > 0 && navigator.vibrate) {
      navigator.vibrate(vibrationPattern);
    }
  }

  // Gamepad management
  private setupGamepadDetection(): void {
    window.addEventListener('gamepadconnected', (event: GamepadEvent) => {
      console.log('Gamepad connected:', event.gamepad);
      this.connectedGamepads.set(event.gamepad.index, event.gamepad);
      this.emit('gamepadConnected', { gamepad: event.gamepad });
    });

    window.addEventListener('gamepaddisconnected', (event: GamepadEvent) => {
      console.log('Gamepad disconnected:', event.gamepad);
      this.connectedGamepads.delete(event.gamepad.index);
      this.emit('gamepadDisconnected', { gamepad: event.gamepad });
    });
  }

  private startGamepadMonitoring(): void {
    // Update gamepad states periodically
    setInterval(() => {
      const gamepads = navigator.getGamepads?.();
      if (gamepads) {
        for (let i = 0; i < gamepads.length; i++) {
          const gamepad = gamepads[i];
          if (gamepad) {
            this.connectedGamepads.set(i, gamepad);
          }
        }
      }
    }, 1000);
  }

  // Pattern definitions
  private getPattern(id: string): HapticPattern {
    const patterns: Record<string, HapticPattern> = {
      // Basic UI patterns
      light_tap: {
        id: 'light_tap',
        name: 'Light Tap',
        description: 'Subtle feedback for button taps',
        category: 'ui',
        pattern: [30, 0.3],
      },
      
      toggle_switch: {
        id: 'toggle_switch',
        name: 'Toggle Switch',
        description: 'Distinctive feedback for toggles',
        category: 'ui',
        pattern: [50, 0.6, 30, 0.2],
      },

      selection_tick: {
        id: 'selection_tick',
        name: 'Selection Tick',
        description: 'Crisp feedback for selections',
        category: 'ui',
        pattern: [25, 0.4],
      },

      long_press: {
        id: 'long_press',
        name: 'Long Press',
        description: 'Extended feedback for long press',
        category: 'ui',
        pattern: [200, 0.3, 50, 0.0, 200, 0.3],
      },

      swipe_feedback: {
        id: 'swipe_feedback',
        name: 'Swipe Feedback',
        description: 'Smooth feedback for swipe gestures',
        category: 'ui',
        pattern: [80, 0.2, 0, 0.0, 60, 0.4],
      },

      // Notification patterns
      message_notification: {
        id: 'message_notification',
        name: 'Message Notification',
        description: 'Gentle notification for messages',
        category: 'notification',
        pattern: [100, 0.4, 50, 0.0, 100, 0.4],
      },

      friend_request: {
        id: 'friend_request',
        name: 'Friend Request',
        description: 'Friendly notification pattern',
        category: 'notification',
        pattern: [150, 0.5, 75, 0.0, 150, 0.5, 75, 0.0, 150, 0.5],
      },

      urgent_notification: {
        id: 'urgent_notification',
        name: 'Urgent Notification',
        description: 'Strong pattern for urgent alerts',
        category: 'notification',
        pattern: [200, 0.8, 100, 0.0, 200, 0.8, 100, 0.0, 200, 0.8],
      },

      // Gaming patterns
      achievement_unlock: {
        id: 'achievement_unlock',
        name: 'Achievement Unlocked',
        description: 'Celebration pattern for achievements',
        category: 'achievement',
        pattern: [100, 0.3, 50, 0.0, 150, 0.6, 50, 0.0, 200, 0.8, 50, 0.0, 100, 0.4],
      },

      level_up: {
        id: 'level_up',
        name: 'Level Up',
        description: 'Triumphant pattern for leveling up',
        category: 'gaming',
        pattern: [80, 0.4, 40, 0.0, 120, 0.6, 40, 0.0, 160, 0.8, 40, 0.0, 200, 1.0],
      },

      match_found: {
        id: 'match_found',
        name: 'Match Found',
        description: 'Alert pattern for matchmaking success',
        category: 'gaming',
        pattern: [250, 0.7, 100, 0.0, 250, 0.7],
      },

      gaming_kill: {
        id: 'gaming_kill',
        name: 'Kill Confirmed',
        description: 'Sharp feedback for eliminations',
        category: 'gaming',
        pattern: [80, 0.8, 40, 0.0, 60, 0.6],
      },

      gaming_death: {
        id: 'gaming_death',
        name: 'Death',
        description: 'Heavy feedback for player death',
        category: 'gaming',
        pattern: [300, 0.9, 200, 0.5, 400, 0.7],
      },

      gaming_damage: {
        id: 'gaming_damage',
        name: 'Damage Taken',
        description: 'Quick feedback for taking damage',
        category: 'gaming',
        pattern: [60, 0.5],
      },

      gaming_reload: {
        id: 'gaming_reload',
        name: 'Weapon Reload',
        description: 'Mechanical feedback for reloading',
        category: 'gaming',
        pattern: [40, 0.3, 20, 0.0, 40, 0.3, 20, 0.0, 80, 0.5],
      },

      // Status patterns
      success: {
        id: 'success',
        name: 'Success',
        description: 'Positive feedback for successful actions',
        category: 'ui',
        pattern: [120, 0.5, 60, 0.0, 120, 0.5],
      },

      error: {
        id: 'error',
        name: 'Error',
        description: 'Warning feedback for errors',
        category: 'ui',
        pattern: [200, 0.7, 100, 0.0, 200, 0.7, 100, 0.0, 200, 0.7],
      },

      default_pulse: {
        id: 'default_pulse',
        name: 'Default Pulse',
        description: 'Standard feedback pattern',
        category: 'ui',
        pattern: [100, 0.5],
      },
    };

    return patterns[id] || patterns.default_pulse;
  }

  private getPatternPriority(pattern: HapticPattern): number {
    const priorities = {
      urgent: 100,
      achievement: 90,
      gaming: 80,
      notification: 70,
      ui: 50,
    };

    if (pattern.id.includes('urgent')) return priorities.urgent;
    if (pattern.category === 'achievement') return priorities.achievement;
    if (pattern.category === 'gaming') return priorities.gaming;
    if (pattern.category === 'notification') return priorities.notification;
    return priorities.ui;
  }

  // Settings management
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    this.saveUserPreferences();
    this.emit('enabledChanged', { enabled });
  }

  setMasterIntensity(intensity: number): void {
    this.masterIntensity = Math.max(0, Math.min(1, intensity));
    this.saveUserPreferences();
    this.emit('intensityChanged', { intensity: this.masterIntensity });
  }

  private loadUserPreferences(): void {
    try {
      const preferences = localStorage.getItem('ignisstream-haptic-preferences');
      if (preferences) {
        const parsed = JSON.parse(preferences);
        this.isEnabled = parsed.enabled !== false; // Default to enabled
        this.masterIntensity = parsed.intensity || 1.0;
      }
    } catch (error) {
      console.warn('Failed to load haptic preferences:', error);
    }
  }

  private saveUserPreferences(): void {
    try {
      const preferences = {
        enabled: this.isEnabled,
        intensity: this.masterIntensity,
      };
      localStorage.setItem('ignisstream-haptic-preferences', JSON.stringify(preferences));
    } catch (error) {
      console.warn('Failed to save haptic preferences:', error);
    }
  }

  // Utility methods
  private async testVibration(): Promise<void> {
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
  }

  async testPattern(patternId: string): Promise<void> {
    const pattern = this.getPattern(patternId);
    await this.playPattern(pattern);
  }

  // Getters
  getCapabilities(): HapticCapabilities {
    return this.capabilities;
  }

  isHapticEnabled(): boolean {
    return this.isEnabled;
  }

  getMasterIntensity(): number {
    return this.masterIntensity;
  }

  getConnectedGamepads(): Gamepad[] {
    return Array.from(this.connectedGamepads.values());
  }

  getAvailablePatterns(): HapticPattern[] {
    return this.capabilities.supportedPatterns.map(id => this.getPattern(id));
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
  cleanup(): void {
    this.hapticQueue = [];
    this.isPlaying = false;
    this.connectedGamepads.clear();
    this.eventListeners.clear();
  }
}

// Gaming haptic utility functions
export const HapticUtils = {
  // Quick gaming feedback shortcuts
  killFeedback: () => hapticManager.triggerGameEvent({ type: 'kill' }),
  deathFeedback: () => hapticManager.triggerGameEvent({ type: 'death' }),
  damageFeedback: (intensity = 0.5) => hapticManager.triggerGameEvent({ type: 'damage', intensity }),
  reloadFeedback: () => hapticManager.triggerGameEvent({ type: 'reload' }),
  achievementFeedback: () => hapticManager.triggerGameEvent({ type: 'achievement' }),
  levelUpFeedback: () => hapticManager.triggerGameEvent({ type: 'level_up' }),
  matchFoundFeedback: () => hapticManager.triggerGameEvent({ type: 'match_found' }),
  
  // UI feedback shortcuts
  buttonTap: () => hapticManager.triggerUIFeedback('button_tap'),
  toggle: () => hapticManager.triggerUIFeedback('toggle'),
  swipe: () => hapticManager.triggerUIFeedback('swipe'),
  select: () => hapticManager.triggerUIFeedback('selection'),
  longPress: () => hapticManager.triggerUIFeedback('long_press'),
  
  // Status feedback shortcuts
  success: () => hapticManager.triggerGameEvent({ type: 'success' }),
  error: () => hapticManager.triggerGameEvent({ type: 'error' }),
};

// Initialize global haptic manager
export const hapticManager = new HapticManager();
