/**
 * Cross-Platform Cloud Save Manager for IgnisStream
 * Synchronize game saves across multiple devices and platforms
 */

interface SaveMetadata {
  gameId: string;
  platform: 'pc' | 'mobile' | 'console' | 'web';
  deviceId: string;
  version: number;
  timestamp: number;
  checksum: string;
  fileSize: number;
  compressed: boolean;
}

interface CloudSave {
  id: string;
  userId: string;
  gameId: string;
  slotName: string; // e.g., 'autosave', 'manual1', 'checkpoint_level5'
  data: ArrayBuffer | string;
  metadata: SaveMetadata;
  conflicts: SaveConflict[];
  syncStatus: 'synced' | 'pending' | 'failed' | 'conflict';
}

interface SaveConflict {
  deviceId: string;
  platform: string;
  timestamp: number;
  conflictType: 'newer_remote' | 'newer_local' | 'different_data';
  resolution?: 'use_local' | 'use_remote' | 'merge' | 'manual';
}

interface SyncProfile {
  userId: string;
  gameId: string;
  autoSync: boolean;
  syncInterval: number; // minutes
  compressionEnabled: boolean;
  conflictResolution: 'ask_user' | 'use_latest' | 'use_local' | 'use_remote';
  platforms: string[];
  maxSaveSlots: number;
  retentionDays: number;
}

export class CloudSaveManager {
  private saves: Map<string, CloudSave> = new Map();
  private syncProfiles: Map<string, SyncProfile> = new Map();
  private syncQueue: Map<string, CloudSave> = new Map();
  private isOnline = navigator.onLine;
  private syncInterval = 0;
  private eventListeners: Map<string, Function[]> = new Map();
  private compressionWorker: Worker | null = null;

  constructor() {
    this.initializeNetworkMonitoring();
    this.initializeCompressionWorker();
    this.startPeriodicSync();
  }

  private initializeNetworkMonitoring(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processOfflineQueue();
      this.emit('networkStatusChanged', { online: true });
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.emit('networkStatusChanged', { online: false });
    });
  }

  private initializeCompressionWorker(): void {
    try {
      // Create compression worker for large save files
      const workerCode = `
        self.addEventListener('message', function(e) {
          const { action, data } = e.data;
          
          if (action === 'compress') {
            // Simple compression using gzip-like algorithm
            const compressed = compressData(data);
            self.postMessage({ action: 'compressed', data: compressed });
          } else if (action === 'decompress') {
            const decompressed = decompressData(data);
            self.postMessage({ action: 'decompressed', data: decompressed });
          }
        });
        
        function compressData(data) {
          // Mock compression - in real implementation use proper compression
          return data;
        }
        
        function decompressData(data) {
          // Mock decompression
          return data;
        }
      `;
      
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      this.compressionWorker = new Worker(URL.createObjectURL(blob));
    } catch (error) {
      console.warn('Compression worker not available:', error);
    }
  }

  // Upload save data to cloud
  public async uploadSave(
    userId: string,
    gameId: string,
    slotName: string,
    saveData: ArrayBuffer | string,
    platform: SaveMetadata['platform'] = 'pc'
  ): Promise<void> {
    try {
      const deviceId = this.getDeviceId();
      const checksum = await this.calculateChecksum(saveData);
      
      // Check for existing save
      const existingSave = this.findSave(userId, gameId, slotName);
      
      const metadata: SaveMetadata = {
        gameId,
        platform,
        deviceId,
        version: existingSave ? existingSave.metadata.version + 1 : 1,
        timestamp: Date.now(),
        checksum,
        fileSize: this.getDataSize(saveData),
        compressed: false,
      };

      // Compress if enabled and file is large
      let finalData = saveData;
      const profile = this.getSyncProfile(userId, gameId);
      if (profile?.compressionEnabled && metadata.fileSize > 100000) { // 100KB threshold
        finalData = await this.compressData(saveData);
        metadata.compressed = true;
      }

      const cloudSave: CloudSave = {
        id: this.generateSaveId(userId, gameId, slotName),
        userId,
        gameId,
        slotName,
        data: finalData,
        metadata,
        conflicts: [],
        syncStatus: 'pending',
      };

      // Check for conflicts
      if (existingSave) {
        const conflicts = await this.detectConflicts(cloudSave, existingSave);
        if (conflicts.length > 0) {
          cloudSave.conflicts = conflicts;
          cloudSave.syncStatus = 'conflict';
          
          // Handle conflict resolution
          const resolved = await this.resolveConflicts(cloudSave, profile);
          if (!resolved) {
            this.emit('conflictDetected', cloudSave);
            return;
          }
        }
      }

      // Store locally first
      this.saves.set(cloudSave.id, cloudSave);

      // Upload to cloud if online
      if (this.isOnline) {
        await this.performCloudUpload(cloudSave);
        cloudSave.syncStatus = 'synced';
        this.emit('saveUploaded', cloudSave);
      } else {
        // Queue for later sync
        this.syncQueue.set(cloudSave.id, cloudSave);
        this.emit('saveQueued', cloudSave);
      }

    } catch (error) {
      console.error('Save upload failed:', error);
      throw new Error(`Failed to upload save: ${error}`);
    }
  }

  // Download save data from cloud
  public async downloadSave(
    userId: string,
    gameId: string,
    slotName: string
  ): Promise<ArrayBuffer | string | null> {
    try {
      const saveId = this.generateSaveId(userId, gameId, slotName);
      
      // Check local cache first
      let cloudSave = this.saves.get(saveId);
      
      if (!cloudSave && this.isOnline) {
        // Download from cloud
        cloudSave = await this.performCloudDownload(userId, gameId, slotName);
        
        if (cloudSave) {
          this.saves.set(saveId, cloudSave);
        }
      }

      if (!cloudSave) {
        return null;
      }

      // Decompress if needed
      let saveData = cloudSave.data;
      if (cloudSave.metadata.compressed) {
        saveData = await this.decompressData(saveData);
      }

      // Verify integrity
      const expectedChecksum = cloudSave.metadata.checksum;
      const actualChecksum = await this.calculateChecksum(saveData);
      
      if (expectedChecksum !== actualChecksum) {
        throw new Error('Save data integrity check failed');
      }

      this.emit('saveDownloaded', cloudSave);
      return saveData;
      
    } catch (error) {
      console.error('Save download failed:', error);
      throw new Error(`Failed to download save: ${error}`);
    }
  }

  // Synchronize all saves for a game
  public async syncGameSaves(userId: string, gameId: string): Promise<void> {
    try {
      if (!this.isOnline) {
        throw new Error('Cannot sync while offline');
      }

      const profile = this.getSyncProfile(userId, gameId);
      if (!profile || !profile.autoSync) {
        return;
      }

      // Get all local saves for this game
      const localSaves = Array.from(this.saves.values()).filter(
        save => save.userId === userId && save.gameId === gameId
      );

      // Get all cloud saves for this game
      const cloudSaves = await this.getCloudSaves(userId, gameId);

      // Sync each save slot
      const allSlots = new Set([
        ...localSaves.map(s => s.slotName),
        ...cloudSaves.map(s => s.slotName),
      ]);

      for (const slotName of allSlots) {
        await this.syncSaveSlot(userId, gameId, slotName);
      }

      this.emit('gameSync', { userId, gameId, slotCount: allSlots.size });
      
    } catch (error) {
      console.error('Game sync failed:', error);
      this.emit('syncFailed', { userId, gameId, error });
    }
  }

  private async syncSaveSlot(
    userId: string,
    gameId: string,
    slotName: string
  ): Promise<void> {
    const saveId = this.generateSaveId(userId, gameId, slotName);
    const localSave = this.saves.get(saveId);
    const cloudSave = await this.performCloudDownload(userId, gameId, slotName);

    if (!localSave && !cloudSave) {
      return; // No save data exists
    }

    if (localSave && !cloudSave) {
      // Upload local save to cloud
      await this.performCloudUpload(localSave);
      localSave.syncStatus = 'synced';
    } else if (!localSave && cloudSave) {
      // Download cloud save locally
      this.saves.set(saveId, cloudSave);
      cloudSave.syncStatus = 'synced';
    } else if (localSave && cloudSave) {
      // Both exist, check for conflicts
      const conflicts = await this.detectConflicts(localSave, cloudSave);
      
      if (conflicts.length === 0) {
        // No conflicts, use the newer version
        if (localSave.metadata.timestamp > cloudSave.metadata.timestamp) {
          await this.performCloudUpload(localSave);
        } else if (cloudSave.metadata.timestamp > localSave.metadata.timestamp) {
          this.saves.set(saveId, cloudSave);
        }
      } else {
        // Handle conflicts
        const profile = this.getSyncProfile(userId, gameId);
        await this.resolveConflicts(localSave, profile, cloudSave);
      }
    }
  }

  // Manage sync profiles
  public createSyncProfile(
    userId: string,
    gameId: string,
    options: Partial<SyncProfile> = {}
  ): void {
    const profileId = `${userId}_${gameId}`;
    
    const profile: SyncProfile = {
      userId,
      gameId,
      autoSync: true,
      syncInterval: 15, // 15 minutes
      compressionEnabled: true,
      conflictResolution: 'ask_user',
      platforms: ['pc', 'mobile', 'web'],
      maxSaveSlots: 10,
      retentionDays: 30,
      ...options,
    };

    this.syncProfiles.set(profileId, profile);
    this.emit('profileCreated', profile);
  }

  public updateSyncProfile(
    userId: string,
    gameId: string,
    updates: Partial<SyncProfile>
  ): void {
    const profileId = `${userId}_${gameId}`;
    const profile = this.syncProfiles.get(profileId);
    
    if (profile) {
      const updatedProfile = { ...profile, ...updates };
      this.syncProfiles.set(profileId, updatedProfile);
      this.emit('profileUpdated', updatedProfile);
    }
  }

  // Conflict detection and resolution
  private async detectConflicts(
    save1: CloudSave,
    save2: CloudSave
  ): Promise<SaveConflict[]> {
    const conflicts: SaveConflict[] = [];

    // Different checksums indicate data conflicts
    if (save1.metadata.checksum !== save2.metadata.checksum) {
      const conflictType = save1.metadata.timestamp > save2.metadata.timestamp
        ? 'newer_local'
        : save1.metadata.timestamp < save2.metadata.timestamp
        ? 'newer_remote'
        : 'different_data';

      conflicts.push({
        deviceId: save2.metadata.deviceId,
        platform: save2.metadata.platform,
        timestamp: save2.metadata.timestamp,
        conflictType: conflictType as SaveConflict['conflictType'],
      });
    }

    return conflicts;
  }

  private async resolveConflicts(
    save: CloudSave,
    profile?: SyncProfile,
    remoteSave?: CloudSave
  ): Promise<boolean> {
    if (!profile) return false;

    switch (profile.conflictResolution) {
      case 'use_latest':
        if (remoteSave && remoteSave.metadata.timestamp > save.metadata.timestamp) {
          // Use remote save
          this.saves.set(save.id, remoteSave);
        }
        return true;

      case 'use_local':
        // Keep local save, upload to overwrite remote
        return true;

      case 'use_remote':
        if (remoteSave) {
          this.saves.set(save.id, remoteSave);
        }
        return true;

      case 'ask_user':
        // Emit conflict event for user resolution
        this.emit('conflictRequiresResolution', {
          save,
          remoteSave,
          conflicts: save.conflicts,
        });
        return false;

      default:
        return false;
    }
  }

  // Manual conflict resolution
  public resolveConflictManually(
    saveId: string,
    resolution: SaveConflict['resolution']
  ): void {
    const save = this.saves.get(saveId);
    if (!save) return;

    save.conflicts.forEach(conflict => {
      conflict.resolution = resolution;
    });

    switch (resolution) {
      case 'use_local':
        save.syncStatus = 'pending';
        if (this.isOnline) {
          this.performCloudUpload(save);
        }
        break;

      case 'use_remote':
        // Re-download from cloud
        const [userId, gameId, slotName] = this.parseSaveId(saveId);
        this.downloadSave(userId, gameId, slotName);
        break;
    }

    this.emit('conflictResolved', { saveId, resolution });
  }

  // Cloud storage operations (mock implementation)
  private async performCloudUpload(save: CloudSave): Promise<void> {
    // Simulate API call to cloud storage
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.95) { // 5% failure rate
          reject(new Error('Cloud upload failed'));
        } else {
          resolve();
        }
      }, 1000 + Math.random() * 2000); // 1-3 second delay
    });
  }

  private async performCloudDownload(
    userId: string,
    gameId: string,
    slotName: string
  ): Promise<CloudSave | null> {
    // Simulate API call to cloud storage
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock: 80% chance of finding a save
        if (Math.random() < 0.8) {
          const mockSave: CloudSave = {
            id: this.generateSaveId(userId, gameId, slotName),
            userId,
            gameId,
            slotName,
            data: new ArrayBuffer(1024), // Mock save data
            metadata: {
              gameId,
              platform: 'pc',
              deviceId: 'cloud_device',
              version: 1,
              timestamp: Date.now() - Math.random() * 86400000, // Random time in last day
              checksum: 'mock_checksum',
              fileSize: 1024,
              compressed: false,
            },
            conflicts: [],
            syncStatus: 'synced',
          };
          resolve(mockSave);
        } else {
          resolve(null);
        }
      }, 500 + Math.random() * 1000); // 0.5-1.5 second delay
    });
  }

  private async getCloudSaves(userId: string, gameId: string): Promise<CloudSave[]> {
    // Mock implementation - would query cloud API
    return [];
  }

  // Utility methods
  private async compressData(data: ArrayBuffer | string): Promise<ArrayBuffer | string> {
    if (this.compressionWorker) {
      return new Promise((resolve) => {
        this.compressionWorker!.postMessage({ action: 'compress', data });
        this.compressionWorker!.onmessage = (e) => {
          if (e.data.action === 'compressed') {
            resolve(e.data.data);
          }
        };
      });
    }
    return data; // Fallback: no compression
  }

  private async decompressData(data: ArrayBuffer | string): Promise<ArrayBuffer | string> {
    if (this.compressionWorker) {
      return new Promise((resolve) => {
        this.compressionWorker!.postMessage({ action: 'decompress', data });
        this.compressionWorker!.onmessage = (e) => {
          if (e.data.action === 'decompressed') {
            resolve(e.data.data);
          }
        };
      });
    }
    return data; // Fallback: no decompression
  }

  private async calculateChecksum(data: ArrayBuffer | string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBytes = typeof data === 'string' ? encoder.encode(data) : new Uint8Array(data);
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBytes);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private getDataSize(data: ArrayBuffer | string): number {
    return typeof data === 'string' ? new Blob([data]).size : data.byteLength;
  }

  private getDeviceId(): string {
    // Generate or retrieve persistent device ID
    let deviceId = localStorage.getItem('ignisstream_device_id');
    if (!deviceId) {
      deviceId = 'device_' + Math.random().toString(36).substr(2, 12);
      localStorage.setItem('ignisstream_device_id', deviceId);
    }
    return deviceId;
  }

  private generateSaveId(userId: string, gameId: string, slotName: string): string {
    return `${userId}_${gameId}_${slotName}`;
  }

  private parseSaveId(saveId: string): [string, string, string] {
    const parts = saveId.split('_');
    return [parts[0], parts[1], parts.slice(2).join('_')];
  }

  private findSave(userId: string, gameId: string, slotName: string): CloudSave | undefined {
    const saveId = this.generateSaveId(userId, gameId, slotName);
    return this.saves.get(saveId);
  }

  private getSyncProfile(userId: string, gameId: string): SyncProfile | undefined {
    return this.syncProfiles.get(`${userId}_${gameId}`);
  }

  private startPeriodicSync(): void {
    this.syncInterval = window.setInterval(async () => {
      if (!this.isOnline) return;

      // Sync all profiles that have auto-sync enabled
      for (const profile of this.syncProfiles.values()) {
        if (profile.autoSync) {
          try {
            await this.syncGameSaves(profile.userId, profile.gameId);
          } catch (error) {
            console.error('Periodic sync failed:', error);
          }
        }
      }
    }, 60000); // Check every minute
  }

  private async processOfflineQueue(): Promise<void> {
    if (!this.isOnline) return;

    const queuedSaves = Array.from(this.syncQueue.values());
    this.syncQueue.clear();

    for (const save of queuedSaves) {
      try {
        await this.performCloudUpload(save);
        save.syncStatus = 'synced';
        this.emit('queuedSaveUploaded', save);
      } catch (error) {
        // Re-queue failed uploads
        this.syncQueue.set(save.id, save);
        save.syncStatus = 'failed';
        console.error('Queued save upload failed:', error);
      }
    }
  }

  // Public API methods
  public listSaves(userId: string, gameId?: string): CloudSave[] {
    return Array.from(this.saves.values()).filter(save => {
      return save.userId === userId && (gameId ? save.gameId === gameId : true);
    });
  }

  public deleteSave(userId: string, gameId: string, slotName: string): boolean {
    const saveId = this.generateSaveId(userId, gameId, slotName);
    const deleted = this.saves.delete(saveId);
    
    if (deleted) {
      this.emit('saveDeleted', { userId, gameId, slotName });
    }
    
    return deleted;
  }

  public getSaveInfo(userId: string, gameId: string, slotName: string): CloudSave | null {
    const saveId = this.generateSaveId(userId, gameId, slotName);
    return this.saves.get(saveId) || null;
  }

  public isOnlineMode(): boolean {
    return this.isOnline;
  }

  public getQueuedSaves(): CloudSave[] {
    return Array.from(this.syncQueue.values());
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

  // Cleanup
  public cleanup(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    if (this.compressionWorker) {
      this.compressionWorker.terminate();
    }
    
    this.eventListeners.clear();
  }
}

// Export utilities
export const CloudSaveUtils = {
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  },

  formatSyncStatus: (status: CloudSave['syncStatus']): string => {
    const statusMap = {
      'synced': '✅ Synced',
      'pending': '⏳ Pending',
      'failed': '❌ Failed',
      'conflict': '⚠️ Conflict',
    };
    return statusMap[status] || status;
  },

  getConflictSeverity: (conflicts: SaveConflict[]): 'low' | 'medium' | 'high' => {
    if (conflicts.length === 0) return 'low';
    if (conflicts.some(c => c.conflictType === 'different_data')) return 'high';
    return 'medium';
  },
};

// Export manager instance
export const cloudSaveManager = new CloudSaveManager();
