/**
 * Progressive Web App Manager for IgnisStream
 * Handles PWA installation, notifications, and offline functionality
 */

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWACapabilities {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  hasNotificationPermission: boolean;
  hasCameraPermission: boolean;
  hasBackgroundSync: boolean;
  hasWebShare: boolean;
  supportsWebRTC: boolean;
}

interface OfflineAction {
  id: string;
  type: 'post' | 'reaction' | 'message' | 'game_stat';
  action: string;
  data: any;
  timestamp: number;
  retryCount: number;
}

export class PWAManager {
  private installPrompt: BeforeInstallPromptEvent | null = null;
  private isInstalled = false;
  private db: IDBDatabase | null = null;
  private capabilities: PWACapabilities;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    this.capabilities = this.detectCapabilities();
    this.initializeDB();
    this.setupEventListeners();
  }
  
  private setupEventListeners() {}

  // Initialize PWA Manager
  async initialize() {
    await this.setupServiceWorker();
    await this.checkInstallationStatus();
    this.setupInstallPrompt();
    this.setupOnlineOfflineHandlers();
    this.setupNotificationHandlers();
    
    // Emit ready event
    this.emit('ready', this.capabilities);
  }

  // Service Worker Setup
  private async setupServiceWorker() {
    if ('serviceWorker' in navigator) {
      if (process.env.NODE_ENV !== 'production') {
        const regs = await navigator.serviceWorker.getRegistrations();
        regs.forEach((r) => r.unregister());
        return;
      }
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });

        console.log('Service Worker registered:', registration);

        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.emit('updateAvailable');
              }
            });
          }
        });

        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        throw error;
      }
    }
    
    throw new Error('Service Worker not supported');
  }

  // Install Prompt Handling
  private setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.installPrompt = e as BeforeInstallPromptEvent;
      this.emit('installable');
    });

    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.installPrompt = null;
      this.emit('installed');
      
      // Track installation
      this.trackEvent('pwa_installed', {
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
      });
    });
  }

  // Check if app is already installed
  private async checkInstallationStatus() {
    // Check if running in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone ||
                        document.referrer.includes('android-app://');
    
    this.isInstalled = isStandalone;
    this.capabilities.isInstalled = isStandalone;
    
    if (isStandalone) {
      this.emit('runningStandalone');
    }
  }

  // Prompt user to install PWA
  async promptInstall(): Promise<boolean> {
    if (!this.installPrompt) {
      throw new Error('No install prompt available');
    }

    await this.installPrompt.prompt();
    const choiceResult = await this.installPrompt.userChoice;

    this.trackEvent('install_prompt_result', {
      outcome: choiceResult.outcome,
      timestamp: Date.now(),
    });

    return choiceResult.outcome === 'accepted';
  }

  // Notification Management
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    const permission = await Notification.requestPermission();
    this.capabilities.hasNotificationPermission = permission === 'granted';
    
    this.trackEvent('notification_permission', {
      permission,
      timestamp: Date.now(),
    });

    return permission === 'granted';
  }

  async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    const registration = await navigator.serviceWorker.ready;
    
    if (!registration.pushManager) {
      return null;
    }

    try {
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
        ) as unknown as BufferSource,
      });

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);
      
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  // Gaming-specific notifications
  async showAchievementNotification(achievement: {
    title: string;
    description: string;
    icon?: string;
    game?: string;
  }) {
    if (!this.capabilities.hasNotificationPermission) {
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    
    await registration.showNotification(`🏆 ${achievement.title}`, {
      body: achievement.description,
      icon: achievement.icon || '/icons/achievement.png',
      badge: '/icons/badge.png',
      tag: 'achievement',
      requireInteraction: true,
      data: {
        type: 'achievement',
        achievement,
        vibrate: [200, 100, 200, 100, 200],
        actions: [
          { action: 'share', title: 'Share Achievement', icon: '/icons/share.png' },
          { action: 'view', title: 'View Profile', icon: '/icons/profile.png' },
        ],
        url: '/profile/achievements'
      }
    });

    // Play achievement sound if available
    this.playNotificationSound('/sounds/achievement.mp3');
  }

  async showFriendOnlineNotification(friend: {
    name: string;
    avatar?: string;
    game?: string;
  }) {
    if (!this.capabilities.hasNotificationPermission) {
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    
    await registration.showNotification(`🎮 ${friend.name} is online`, {
      body: friend.game ? `Playing ${friend.game}` : 'Available to play',
      icon: friend.avatar || '/icons/friend.png',
      badge: '/icons/badge.png',
      tag: 'friend-online',
      data: {
        type: 'friend_online',
        friend,
        actions: [
          { action: 'message', title: 'Send Message', icon: '/icons/message.png' },
          { action: 'invite', title: 'Invite to Game', icon: '/icons/game.png' },
        ],
        url: `/profile/${friend.name}`
      }
    });
  }

  // Offline Functionality
  async queueOfflineAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>) {
    if (!this.db) {
      await this.initializeDB();
    }

    const offlineAction: OfflineAction = {
      ...action,
      id: this.generateId(),
      timestamp: Date.now(),
      retryCount: 0,
    };

    const transaction = this.db!.transaction(['offline_actions'], 'readwrite');
    const store = transaction.objectStore('offline_actions');
    
    await new Promise((resolve, reject) => {
      const request = store.add(offlineAction);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    // Register background sync if available
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      const regAny: any = registration;
      if (regAny.sync && regAny.sync.register) {
        await regAny.sync.register('background-sync');
      }
    }
  }

  async getOfflineActions(): Promise<OfflineAction[]> {
    if (!this.db) {
      return [];
    }

    const transaction = this.db.transaction(['offline_actions'], 'readonly');
    const store = transaction.objectStore('offline_actions');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Web Share API
  async shareContent(content: {
    title?: string;
    text?: string;
    url?: string;
    files?: File[];
  }): Promise<boolean> {
    if (!this.capabilities.hasWebShare) {
      // Fallback to custom share dialog or clipboard
      return this.fallbackShare(content);
    }

    try {
      await navigator.share(content);
      return true;
    } catch (error) {
      console.error('Web Share failed:', error);
      return this.fallbackShare(content);
    }
  }

  async shareGameClip(clip: {
    title: string;
    description: string;
    videoFile?: File;
    imageFile?: File;
    gameTitle: string;
  }): Promise<boolean> {
    const files: File[] = [];
    if (clip.videoFile) files.push(clip.videoFile);
    if (clip.imageFile) files.push(clip.imageFile);

    return this.shareContent({
      title: `🎮 ${clip.title}`,
      text: `Check out my ${clip.gameTitle} clip: ${clip.description}`,
      url: window.location.href,
      files: files.length > 0 ? files : undefined,
    });
  }

  // Online/Offline Status
  private setupOnlineOfflineHandlers() {
    const updateOnlineStatus = () => {
      this.capabilities.isOnline = navigator.onLine;
      
      if (navigator.onLine) {
        this.emit('online');
        this.syncOfflineActions();
      } else {
        this.emit('offline');
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // Initial check
    updateOnlineStatus();
  }

  private async syncOfflineActions() {
    const actions = await this.getOfflineActions();
    
    for (const action of actions) {
      try {
        await this.executeOfflineAction(action);
        await this.removeOfflineAction(action.id);
      } catch (error) {
        console.error('Failed to sync offline action:', error);
        // Increment retry count and potentially remove after max retries
        await this.incrementRetryCount(action.id);
      }
    }
  }

  // Camera and Media Access
  async requestCameraPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop()); // Clean up
      this.capabilities.hasCameraPermission = true;
      return true;
    } catch (error) {
      console.error('Camera permission denied:', error);
      this.capabilities.hasCameraPermission = false;
      return false;
    }
  }

  async captureScreenshot(): Promise<File | null> {
    if (!this.capabilities.hasCameraPermission) {
      const granted = await this.requestCameraPermission();
      if (!granted) return null;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true
      });

      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      return new Promise((resolve) => {
        video.onloadedmetadata = () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(video, 0, 0);
          
          canvas.toBlob((blob) => {
            stream.getTracks().forEach(track => track.stop());
            
            if (blob) {
              const file = new File([blob], 'screenshot.png', { type: 'image/png' });
              resolve(file);
            } else {
              resolve(null);
            }
          }, 'image/png');
        };
      });
    } catch (error) {
      console.error('Screen capture failed:', error);
      return null;
    }
  }

  // Capability Detection
  private detectCapabilities(): PWACapabilities {
    return {
      isInstallable: false,
      isInstalled: false,
      isOnline: navigator.onLine,
      hasNotificationPermission: 'Notification' in window && Notification.permission === 'granted',
      hasCameraPermission: false,
      hasBackgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
      hasWebShare: 'share' in navigator,
      supportsWebRTC: 'RTCPeerConnection' in window,
    };
  }

  // Event System
  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  private emit(event: string, data?: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // Utility Functions
  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('IgnisStreamDB', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('offline_actions')) {
          const store = db.createObjectStore('offline_actions', { keyPath: 'id' });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription),
    });
  }

  private playNotificationSound(soundUrl: string): void {
    try {
      const audio = new Audio(soundUrl);
      audio.volume = 0.5;
      audio.play().catch(() => {}); // Ignore errors
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  }

  private async fallbackShare(content: any): Promise<boolean> {
    try {
      if (content.url) {
        await navigator.clipboard.writeText(content.url);
        // Show custom share dialog or toast
        this.emit('shareUrlCopied', content);
        return true;
      }
    } catch (error) {
      console.error('Fallback share failed:', error);
    }
    return false;
  }

  private async executeOfflineAction(action: OfflineAction): Promise<void> {
    // Implementation depends on your API structure
    const response = await fetch(action.action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action.data),
    });

    if (!response.ok) {
      throw new Error(`Action failed: ${response.statusText}`);
    }
  }

  private async removeOfflineAction(id: string): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['offline_actions'], 'readwrite');
    const store = transaction.objectStore('offline_actions');
    
    await new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async incrementRetryCount(id: string): Promise<void> {
    // Implementation for retry logic
  }

  private trackEvent(event: string, data: any): void {
    // Send analytics event
    console.log('PWA Event:', event, data);
  }

  private setupNotificationHandlers(): void {
    // Handle notification clicks from service worker
    navigator.serviceWorker?.addEventListener('message', (event) => {
      if (event.data?.type === 'notification-click') {
        this.emit('notificationClick', event.data);
      }
    });
  }
}

// Initialize PWA Manager
export const pwaManager = new PWAManager();
