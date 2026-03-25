/**
 * Game Overlay Manager for IgnisStream
 * In-game overlay for quick posting without alt-tabbing
 */

interface OverlayConfig {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  theme: 'dark' | 'light' | 'transparent';
  size: 'compact' | 'normal' | 'expanded';
  opacity: number;
  hotkeys: {
    toggle: string[];
    quickPost: string[];
    screenshot: string[];
    recording: string[];
  };
  autoHide: boolean;
  hideInFullscreen: boolean;
}

interface QuickPost {
  content: string;
  screenshot?: string;
  game: string;
  timestamp: Date;
  privacy: 'public' | 'friends' | 'private';
}

interface OverlayNotification {
  id: string;
  type: 'achievement' | 'friend' | 'message' | 'match' | 'stream';
  title: string;
  content: string;
  icon?: string;
  duration: number;
  priority: number;
  actions: Array<{
    label: string;
    action: () => void;
  }>;
}

export class GameOverlayManager {
  private overlayElement: HTMLElement | null = null;
  private config: OverlayConfig;
  private isVisible = false;
  private currentGame: string | null = null;
  private notifications: OverlayNotification[] = [];
  private keyListeners: Map<string, () => void> = new Map();
  private dragState = { isDragging: false, startX: 0, startY: 0 };

  constructor(config: Partial<OverlayConfig> = {}) {
    this.config = {
      position: 'top-right',
      theme: 'dark',
      size: 'compact',
      opacity: 0.9,
      hotkeys: {
        toggle: ['Alt', 'Tab'],
        quickPost: ['Ctrl', 'Shift', 'P'],
        screenshot: ['F12'],
        recording: ['Ctrl', 'F12'],
      },
      autoHide: true,
      hideInFullscreen: false,
      ...config,
    };

    this.initialize();
  }

  private async initialize(): Promise<void> {
    await this.createOverlayDOM();
    this.setupEventListeners();
    this.startGameDetection();
    this.connectToRealTimeUpdates();
  }

  private async createOverlayDOM(): Promise<void> {
    // Create overlay container
    this.overlayElement = document.createElement('div');
    this.overlayElement.id = 'ignisstream-overlay';
    this.overlayElement.className = `overlay-${this.config.theme} overlay-${this.config.size}`;
    
    // Apply styles
    Object.assign(this.overlayElement.style, {
      position: 'fixed',
      zIndex: '999999',
      opacity: this.config.opacity.toString(),
      pointerEvents: 'auto',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '14px',
      background: this.getThemeBackground(),
      border: this.getThemeBorder(),
      borderRadius: '12px',
      padding: '16px',
      minWidth: '280px',
      maxWidth: '400px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      backdropFilter: 'blur(10px)',
      transition: 'all 0.3s ease',
      display: 'none',
      userSelect: 'none',
    });

    this.setOverlayPosition();
    
    // Create overlay content
    this.overlayElement.innerHTML = this.createOverlayHTML();
    
    // Append to body
    document.body.appendChild(this.overlayElement);
    
    // Setup overlay interactions
    this.setupOverlayInteractions();
  }

  private createOverlayHTML(): string {
    return `
      <div class="overlay-header">
        <div class="overlay-title">
          <img src="/logo-icon.png" alt="IgnisStream" width="20" height="20">
          <span>IgnisStream</span>
        </div>
        <div class="overlay-game-info">
          <span id="current-game">${this.currentGame || 'No Game Detected'}</span>
        </div>
        <div class="overlay-controls">
          <button id="overlay-minimize" title="Minimize">−</button>
          <button id="overlay-close" title="Close">×</button>
        </div>
      </div>
      
      <div class="overlay-content">
        <div class="quick-actions">
          <button id="quick-post-btn" class="action-btn primary">
            <span class="icon">📝</span>
            Quick Post
          </button>
          <button id="screenshot-btn" class="action-btn">
            <span class="icon">📷</span>
            Screenshot
          </button>
          <button id="record-btn" class="action-btn">
            <span class="icon">🎥</span>
            Record
          </button>
        </div>
        
        <div id="quick-post-form" class="quick-post-form" style="display: none;">
          <textarea id="post-content" placeholder="Share your gaming moment..." maxlength="280"></textarea>
          <div class="post-options">
            <select id="post-privacy">
              <option value="public">🌐 Public</option>
              <option value="friends">👥 Friends</option>
              <option value="private">🔒 Private</option>
            </select>
            <label class="checkbox-label">
              <input type="checkbox" id="include-screenshot"> Include Screenshot
            </label>
          </div>
          <div class="post-actions">
            <button id="cancel-post" class="btn-secondary">Cancel</button>
            <button id="submit-post" class="btn-primary">Post</button>
          </div>
        </div>
        
        <div class="notifications-section">
          <div class="section-header">
            <span>Notifications</span>
            <span id="notification-count" class="count">0</span>
          </div>
          <div id="notifications-list" class="notifications-list"></div>
        </div>
        
        <div class="performance-section">
          <div class="section-header">
            <span>Performance</span>
          </div>
          <div class="performance-stats">
            <div class="stat">
              <span class="label">FPS:</span>
              <span id="fps-counter" class="value">--</span>
            </div>
            <div class="stat">
              <span class="label">CPU:</span>
              <span id="cpu-usage" class="value">--</span>
            </div>
            <div class="stat">
              <span class="label">GPU:</span>
              <span id="gpu-usage" class="value">--</span>
            </div>
          </div>
        </div>
      </div>
      
      <style>
        .overlay-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          cursor: move;
        }
        
        .overlay-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: #fff;
        }
        
        .overlay-game-info {
          font-size: 12px;
          color: #888;
          text-align: center;
          flex: 1;
        }
        
        .overlay-controls {
          display: flex;
          gap: 4px;
        }
        
        .overlay-controls button {
          width: 24px;
          height: 24px;
          border: none;
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          line-height: 1;
        }
        
        .overlay-controls button:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        
        .quick-actions {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
        }
        
        .action-btn {
          flex: 1;
          padding: 8px 12px;
          border: none;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          cursor: pointer;
          font-size: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          transition: all 0.2s ease;
        }
        
        .action-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }
        
        .action-btn.primary {
          background: #007bff;
        }
        
        .action-btn.primary:hover {
          background: #0056b3;
        }
        
        .quick-post-form {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 16px;
        }
        
        .quick-post-form textarea {
          width: 100%;
          height: 60px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          color: #fff;
          padding: 8px;
          resize: none;
          font-family: inherit;
        }
        
        .post-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 8px 0;
        }
        
        .post-options select {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #fff;
          padding: 4px 8px;
          border-radius: 4px;
        }
        
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: #ccc;
        }
        
        .post-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }
        
        .btn-secondary, .btn-primary {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }
        
        .btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }
        
        .btn-primary {
          background: #007bff;
          color: #fff;
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          font-size: 12px;
          font-weight: 600;
          color: #ccc;
        }
        
        .count {
          background: #007bff;
          color: #fff;
          padding: 2px 6px;
          border-radius: 10px;
          font-size: 10px;
        }
        
        .notifications-list {
          max-height: 120px;
          overflow-y: auto;
          margin-bottom: 16px;
        }
        
        .notification-item {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
          padding: 8px;
          margin-bottom: 4px;
          font-size: 12px;
        }
        
        .notification-title {
          font-weight: 600;
          color: #fff;
          margin-bottom: 2px;
        }
        
        .notification-content {
          color: #ccc;
        }
        
        .performance-stats {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 8px;
        }
        
        .stat {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
          padding: 6px 8px;
          text-align: center;
        }
        
        .stat .label {
          display: block;
          font-size: 10px;
          color: #888;
          margin-bottom: 2px;
        }
        
        .stat .value {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #fff;
        }
      </style>
    `;
  }

  private setupOverlayInteractions(): void {
    if (!this.overlayElement) return;

    // Quick post functionality
    const quickPostBtn = this.overlayElement.querySelector('#quick-post-btn');
    const quickPostForm = this.overlayElement.querySelector('#quick-post-form');
    const cancelPost = this.overlayElement.querySelector('#cancel-post');
    const submitPost = this.overlayElement.querySelector('#submit-post');

    quickPostBtn?.addEventListener('click', () => {
      if (quickPostForm) {
        quickPostForm.style.display = quickPostForm.style.display === 'none' ? 'block' : 'none';
      }
    });

    cancelPost?.addEventListener('click', () => {
      if (quickPostForm) quickPostForm.style.display = 'none';
    });

    submitPost?.addEventListener('click', () => this.handleQuickPost());

    // Screenshot functionality
    const screenshotBtn = this.overlayElement.querySelector('#screenshot-btn');
    screenshotBtn?.addEventListener('click', () => this.takeScreenshot());

    // Recording functionality
    const recordBtn = this.overlayElement.querySelector('#record-btn');
    recordBtn?.addEventListener('click', () => this.toggleRecording());

    // Overlay controls
    const minimizeBtn = this.overlayElement.querySelector('#overlay-minimize');
    const closeBtn = this.overlayElement.querySelector('#overlay-close');

    minimizeBtn?.addEventListener('click', () => this.minimizeOverlay());
    closeBtn?.addEventListener('click', () => this.hideOverlay());

    // Dragging functionality
    const header = this.overlayElement.querySelector('.overlay-header');
    header?.addEventListener('mousedown', (e) => this.startDrag(e as MouseEvent));
  }

  private setupEventListeners(): void {
    // Global hotkey listeners
    document.addEventListener('keydown', (e) => this.handleGlobalKeydown(e));
    
    // Game focus detection
    window.addEventListener('focus', () => this.handleWindowFocus());
    window.addEventListener('blur', () => this.handleWindowBlur());
    
    // Fullscreen detection
    document.addEventListener('fullscreenchange', () => this.handleFullscreenChange());
  }

  private handleGlobalKeydown(event: KeyboardEvent): void {
    const { hotkeys } = this.config;
    
    // Check toggle hotkey
    if (this.isHotkeyPressed(event, hotkeys.toggle)) {
      event.preventDefault();
      this.toggleOverlay();
    }
    
    // Check quick post hotkey
    if (this.isHotkeyPressed(event, hotkeys.quickPost)) {
      event.preventDefault();
      this.showQuickPost();
    }
    
    // Check screenshot hotkey
    if (this.isHotkeyPressed(event, hotkeys.screenshot)) {
      event.preventDefault();
      this.takeScreenshot();
    }
    
    // Check recording hotkey
    if (this.isHotkeyPressed(event, hotkeys.recording)) {
      event.preventDefault();
      this.toggleRecording();
    }
  }

  private isHotkeyPressed(event: KeyboardEvent, hotkey: string[]): boolean {
    const modifiers = ['ctrl', 'shift', 'alt'];
    const eventModifiers = {
      ctrl: event.ctrlKey,
      shift: event.shiftKey,
      alt: event.altKey,
    };

    return hotkey.every(key => {
      const lowerKey = key.toLowerCase();
      if (modifiers.includes(lowerKey)) {
        return eventModifiers[lowerKey as keyof typeof eventModifiers];
      }
      return event.key.toLowerCase() === lowerKey;
    });
  }

  // Public API methods
  public showOverlay(): void {
    if (!this.overlayElement) return;
    
    this.overlayElement.style.display = 'block';
    this.isVisible = true;
    
    // Animate in
    setTimeout(() => {
      if (this.overlayElement) {
        this.overlayElement.style.transform = 'scale(1)';
        this.overlayElement.style.opacity = this.config.opacity.toString();
      }
    }, 10);
  }

  public hideOverlay(): void {
    if (!this.overlayElement) return;
    
    this.overlayElement.style.transform = 'scale(0.9)';
    this.overlayElement.style.opacity = '0';
    
    setTimeout(() => {
      if (this.overlayElement) {
        this.overlayElement.style.display = 'none';
        this.isVisible = false;
      }
    }, 300);
  }

  public toggleOverlay(): void {
    if (this.isVisible) {
      this.hideOverlay();
    } else {
      this.showOverlay();
    }
  }

  public showQuickPost(): void {
    this.showOverlay();
    const quickPostForm = this.overlayElement?.querySelector('#quick-post-form');
    if (quickPostForm) {
      quickPostForm.style.display = 'block';
      const textarea = quickPostForm.querySelector('#post-content') as HTMLTextAreaElement;
      textarea?.focus();
    }
  }

  public addNotification(notification: OverlayNotification): void {
    this.notifications.unshift(notification);
    this.updateNotificationsDisplay();
    
    // Auto-remove after duration
    setTimeout(() => {
      this.removeNotification(notification.id);
    }, notification.duration);
  }

  public updatePerformanceStats(stats: {
    fps?: number;
    cpu?: number;
    gpu?: number;
  }): void {
    if (!this.overlayElement) return;
    
    const fpsCounter = this.overlayElement.querySelector('#fps-counter');
    const cpuUsage = this.overlayElement.querySelector('#cpu-usage');
    const gpuUsage = this.overlayElement.querySelector('#gpu-usage');
    
    if (stats.fps !== undefined && fpsCounter) {
      fpsCounter.textContent = Math.round(stats.fps).toString();
    }
    
    if (stats.cpu !== undefined && cpuUsage) {
      cpuUsage.textContent = `${Math.round(stats.cpu)}%`;
    }
    
    if (stats.gpu !== undefined && gpuUsage) {
      gpuUsage.textContent = `${Math.round(stats.gpu)}%`;
    }
  }

  // Helper methods
  private getThemeBackground(): string {
    switch (this.config.theme) {
      case 'light':
        return 'rgba(255, 255, 255, 0.95)';
      case 'transparent':
        return 'rgba(0, 0, 0, 0.3)';
      default:
        return 'rgba(26, 32, 44, 0.95)';
    }
  }

  private getThemeBorder(): string {
    switch (this.config.theme) {
      case 'light':
        return '1px solid rgba(0, 0, 0, 0.1)';
      case 'transparent':
        return '1px solid rgba(255, 255, 255, 0.2)';
      default:
        return '1px solid rgba(255, 255, 255, 0.1)';
    }
  }

  private setOverlayPosition(): void {
    if (!this.overlayElement) return;
    
    const positions = {
      'top-left': { top: '20px', left: '20px' },
      'top-right': { top: '20px', right: '20px' },
      'bottom-left': { bottom: '20px', left: '20px' },
      'bottom-right': { bottom: '20px', right: '20px' },
    };
    
    const pos = positions[this.config.position];
    Object.assign(this.overlayElement.style, pos);
  }

  private async handleQuickPost(): Promise<void> {
    const textarea = this.overlayElement?.querySelector('#post-content') as HTMLTextAreaElement;
    const privacySelect = this.overlayElement?.querySelector('#post-privacy') as HTMLSelectElement;
    const includeScreenshot = this.overlayElement?.querySelector('#include-screenshot') as HTMLInputElement;
    
    if (!textarea || !privacySelect) return;
    
    const content = textarea.value.trim();
    if (!content) return;
    
    const post: QuickPost = {
      content,
      game: this.currentGame || 'Unknown',
      timestamp: new Date(),
      privacy: privacySelect.value as QuickPost['privacy'],
    };
    
    if (includeScreenshot?.checked) {
      post.screenshot = await this.captureScreenshot();
    }
    
    try {
      await this.submitPost(post);
      textarea.value = '';
      const quickPostForm = this.overlayElement?.querySelector('#quick-post-form');
      if (quickPostForm) quickPostForm.style.display = 'none';
      
      this.addNotification({
        id: `post_${Date.now()}`,
        type: 'message',
        title: 'Post Shared!',
        content: 'Your gaming moment has been shared successfully',
        duration: 3000,
        priority: 1,
        actions: [],
      });
    } catch (error) {
      console.error('Failed to submit post:', error);
    }
  }

  private async takeScreenshot(): Promise<void> {
    try {
      const screenshot = await this.captureScreenshot();
      if (screenshot) {
        // Save screenshot locally or upload
        const link = document.createElement('a');
        link.download = `ignisstream-screenshot-${Date.now()}.png`;
        link.href = screenshot;
        link.click();
        
        this.addNotification({
          id: `screenshot_${Date.now()}`,
          type: 'achievement',
          title: 'Screenshot Captured!',
          content: 'Screenshot saved successfully',
          duration: 2000,
          priority: 1,
          actions: [],
        });
      }
    } catch (error) {
      console.error('Failed to take screenshot:', error);
    }
  }

  private async captureScreenshot(): Promise<string | null> {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' },
      });
      
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      
      return new Promise((resolve) => {
        video.onloadedmetadata = () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(video, 0, 0);
          
          stream.getTracks().forEach(track => track.stop());
          resolve(canvas.toDataURL('image/png'));
        };
      });
    } catch (error) {
      console.error('Screenshot capture failed:', error);
      return null;
    }
  }

  private async submitPost(post: QuickPost): Promise<void> {
    // Integration with existing IgnisStream API
    const response = await fetch('/api/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(post),
    });
    
    if (!response.ok) {
      throw new Error('Failed to submit post');
    }
  }

  private startGameDetection(): void {
    // Detect current game using window title or process detection
    this.detectCurrentGame();
    
    // Update game detection every 5 seconds
    setInterval(() => {
      this.detectCurrentGame();
    }, 5000);
  }

  private async detectCurrentGame(): Promise<void> {
    try {
      // In a real implementation, this would use native APIs or electron
      // For web, we can detect based on page title or URL
      const gameTitle = this.extractGameFromTitle(document.title);
      
      if (gameTitle !== this.currentGame) {
        this.currentGame = gameTitle;
        this.updateCurrentGameDisplay();
      }
    } catch (error) {
      console.error('Game detection failed:', error);
    }
  }

  private extractGameFromTitle(title: string): string | null {
    // Simple game detection from window title
    const gamePatterns = [
      /VALORANT/i,
      /Counter-Strike/i,
      /CS:GO/i,
      /Apex Legends/i,
      /League of Legends/i,
      /Overwatch/i,
      /Fortnite/i,
    ];
    
    for (const pattern of gamePatterns) {
      const match = title.match(pattern);
      if (match) {
        return match[0];
      }
    }
    
    return null;
  }

  private updateCurrentGameDisplay(): void {
    const gameElement = this.overlayElement?.querySelector('#current-game');
    if (gameElement) {
      gameElement.textContent = this.currentGame || 'No Game Detected';
    }
  }

  private connectToRealTimeUpdates(): void {
    // Connect to existing WebSocket system for real-time notifications
    // This would integrate with the existing real-time system
  }

  private updateNotificationsDisplay(): void {
    const notificationsList = this.overlayElement?.querySelector('#notifications-list');
    const notificationCount = this.overlayElement?.querySelector('#notification-count');
    
    if (!notificationsList || !notificationCount) return;
    
    notificationCount.textContent = this.notifications.length.toString();
    
    notificationsList.innerHTML = this.notifications
      .slice(0, 5) // Show max 5 notifications
      .map(notification => `
        <div class="notification-item">
          <div class="notification-title">${notification.title}</div>
          <div class="notification-content">${notification.content}</div>
        </div>
      `).join('');
  }

  private removeNotification(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.updateNotificationsDisplay();
  }

  private startDrag(event: MouseEvent): void {
    this.dragState.isDragging = true;
    this.dragState.startX = event.clientX;
    this.dragState.startY = event.clientY;
    
    document.addEventListener('mousemove', this.handleDrag);
    document.addEventListener('mouseup', this.endDrag);
  }

  private handleDrag = (event: MouseEvent): void => {
    if (!this.dragState.isDragging || !this.overlayElement) return;
    
    const deltaX = event.clientX - this.dragState.startX;
    const deltaY = event.clientY - this.dragState.startY;
    
    const rect = this.overlayElement.getBoundingClientRect();
    const newLeft = rect.left + deltaX;
    const newTop = rect.top + deltaY;
    
    this.overlayElement.style.left = `${newLeft}px`;
    this.overlayElement.style.top = `${newTop}px`;
    this.overlayElement.style.right = 'auto';
    this.overlayElement.style.bottom = 'auto';
    
    this.dragState.startX = event.clientX;
    this.dragState.startY = event.clientY;
  };

  private endDrag = (): void => {
    this.dragState.isDragging = false;
    document.removeEventListener('mousemove', this.handleDrag);
    document.removeEventListener('mouseup', this.endDrag);
  };

  private minimizeOverlay(): void {
    // Minimize to a small icon
    if (this.overlayElement) {
      this.overlayElement.style.transform = 'scale(0.3)';
      this.overlayElement.style.opacity = '0.5';
    }
  }

  private toggleRecording(): void {
    // Integration with game recording system
    console.log('Toggle recording');
  }

  private handleWindowFocus(): void {
    if (this.config.autoHide && this.isVisible) {
      this.showOverlay();
    }
  }

  private handleWindowBlur(): void {
    if (this.config.autoHide) {
      this.hideOverlay();
    }
  }

  private handleFullscreenChange(): void {
    if (this.config.hideInFullscreen) {
      if (document.fullscreenElement) {
        this.hideOverlay();
      } else {
        this.showOverlay();
      }
    }
  }

  // Public configuration methods
  public updateConfig(newConfig: Partial<OverlayConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.overlayElement) {
      this.overlayElement.style.opacity = this.config.opacity.toString();
      this.setOverlayPosition();
    }
  }

  public isOverlayVisible(): boolean {
    return this.isVisible;
  }

  public getCurrentGame(): string | null {
    return this.currentGame;
  }

  public cleanup(): void {
    if (this.overlayElement) {
      this.overlayElement.remove();
      this.overlayElement = null;
    }
    
    document.removeEventListener('keydown', this.handleGlobalKeydown);
    document.removeEventListener('mousemove', this.handleDrag);
    document.removeEventListener('mouseup', this.endDrag);
  }
}

// Initialize global overlay manager
export const gameOverlayManager = new GameOverlayManager();
