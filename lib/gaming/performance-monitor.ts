/**
 * Performance Analytics System for IgnisStream
 * Advanced FPS tracking and system performance monitoring
 */

interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  cpuUsage: number;
  gpuUsage: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  networkLatency: number;
  temperature: {
    cpu: number;
    gpu: number;
  };
  powerUsage: number;
  timestamp: number;
}

interface PerformanceAlert {
  id: string;
  type: 'fps_drop' | 'high_cpu' | 'high_gpu' | 'high_temp' | 'memory_leak' | 'network_lag';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: number;
  suggestions: string[];
}

interface GameProfile {
  gameId: string;
  gameName: string;
  optimalSettings: {
    targetFPS: number;
    maxCPUUsage: number;
    maxGPUUsage: number;
    maxMemoryUsage: number;
  };
  benchmarkData: {
    averageFPS: number;
    minFPS: number;
    maxFPS: number;
    frameTimeVariance: number;
  };
  recommendedSettings: Record<string, any>;
}

interface HardwareInfo {
  cpu: {
    name: string;
    cores: number;
    threads: number;
    baseFrequency: number;
    maxFrequency: number;
  };
  gpu: {
    name: string;
    memory: number;
    driverVersion: string;
  };
  memory: {
    total: number;
    speed: number;
    type: string;
  };
  storage: Array<{
    name: string;
    size: number;
    type: 'SSD' | 'HDD' | 'NVMe';
    available: number;
  }>;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private gameProfiles: Map<string, GameProfile> = new Map();
  private hardwareInfo: HardwareInfo | null = null;
  private isMonitoring = false;
  private monitoringInterval: number = 0;
  private fpsCounter = new FPSCounter();
  private performanceObserver: PerformanceObserver | null = null;
  private eventListeners: Map<string, Function[]> = new Map();

  // Thresholds for performance alerts
  private thresholds = {
    minFPS: 30,
    maxCPUUsage: 80,
    maxGPUUsage: 90,
    maxMemoryUsage: 85,
    maxTemperature: 85,
    maxNetworkLatency: 100,
  };

  constructor() {
    this.initializeHardwareDetection();
    this.setupPerformanceObserver();
  }

  // Start performance monitoring
  public async startMonitoring(interval = 1000): Promise<void> {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.fpsCounter.start();

    // Collect metrics at specified interval
    this.monitoringInterval = window.setInterval(async () => {
      const metrics = await this.collectMetrics();
      this.processMetrics(metrics);
    }, interval);

    this.emit('monitoringStarted');
  }

  // Stop performance monitoring
  public stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    this.fpsCounter.stop();

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = 0;
    }

    this.emit('monitoringStopped');
  }

  // Collect comprehensive performance metrics
  private async collectMetrics(): Promise<PerformanceMetrics> {
    const timestamp = Date.now();

    // FPS and frame timing
    const fps = this.fpsCounter.getCurrentFPS();
    const frameTime = fps > 0 ? 1000 / fps : 0;

    // System resources
    const cpuUsage = await this.getCPUUsage();
    const gpuUsage = await this.getGPUUsage();
    const memoryUsage = await this.getMemoryUsage();
    const networkLatency = await this.getNetworkLatency();
    const temperature = await this.getTemperature();
    const powerUsage = await this.getPowerUsage();

    return {
      fps,
      frameTime,
      cpuUsage,
      gpuUsage,
      memoryUsage,
      networkLatency,
      temperature,
      powerUsage,
      timestamp,
    };
  }

  // Process metrics and check for alerts
  private processMetrics(metrics: PerformanceMetrics): void {
    // Store metrics (keep last 1000 entries)
    this.metrics.push(metrics);
    if (this.metrics.length > 1000) {
      this.metrics.shift();
    }

    // Check for performance alerts
    this.checkAlerts(metrics);

    // Emit metrics update
    this.emit('metricsUpdated', metrics);
  }

  // Check for performance issues and generate alerts
  private checkAlerts(metrics: PerformanceMetrics): void {
    const alerts: PerformanceAlert[] = [];

    // FPS drop alert
    if (metrics.fps < this.thresholds.minFPS) {
      alerts.push({
        id: `fps_${Date.now()}`,
        type: 'fps_drop',
        severity: metrics.fps < 15 ? 'critical' : metrics.fps < 25 ? 'high' : 'medium',
        message: `Low FPS detected: ${Math.round(metrics.fps)} FPS`,
        value: metrics.fps,
        threshold: this.thresholds.minFPS,
        timestamp: metrics.timestamp,
        suggestions: [
          'Lower graphics settings',
          'Close background applications',
          'Update graphics drivers',
          'Check for overheating',
        ],
      });
    }

    // High CPU usage alert
    if (metrics.cpuUsage > this.thresholds.maxCPUUsage) {
      alerts.push({
        id: `cpu_${Date.now()}`,
        type: 'high_cpu',
        severity: metrics.cpuUsage > 95 ? 'critical' : metrics.cpuUsage > 90 ? 'high' : 'medium',
        message: `High CPU usage: ${Math.round(metrics.cpuUsage)}%`,
        value: metrics.cpuUsage,
        threshold: this.thresholds.maxCPUUsage,
        timestamp: metrics.timestamp,
        suggestions: [
          'Close unnecessary applications',
          'Lower CPU-intensive settings',
          'Check for background processes',
          'Consider upgrading CPU',
        ],
      });
    }

    // High GPU usage alert
    if (metrics.gpuUsage > this.thresholds.maxGPUUsage) {
      alerts.push({
        id: `gpu_${Date.now()}`,
        type: 'high_gpu',
        severity: metrics.gpuUsage > 98 ? 'critical' : 'medium',
        message: `High GPU usage: ${Math.round(metrics.gpuUsage)}%`,
        value: metrics.gpuUsage,
        threshold: this.thresholds.maxGPUUsage,
        timestamp: metrics.timestamp,
        suggestions: [
          'Lower graphics quality',
          'Reduce resolution',
          'Disable ray tracing',
          'Update GPU drivers',
        ],
      });
    }

    // High memory usage alert
    if (metrics.memoryUsage.percentage > this.thresholds.maxMemoryUsage) {
      alerts.push({
        id: `memory_${Date.now()}`,
        type: 'memory_leak',
        severity: metrics.memoryUsage.percentage > 95 ? 'critical' : 'high',
        message: `High memory usage: ${Math.round(metrics.memoryUsage.percentage)}%`,
        value: metrics.memoryUsage.percentage,
        threshold: this.thresholds.maxMemoryUsage,
        timestamp: metrics.timestamp,
        suggestions: [
          'Close unused applications',
          'Restart the game',
          'Check for memory leaks',
          'Consider more RAM',
        ],
      });
    }

    // High temperature alert
    const maxTemp = Math.max(metrics.temperature.cpu, metrics.temperature.gpu);
    if (maxTemp > this.thresholds.maxTemperature) {
      alerts.push({
        id: `temp_${Date.now()}`,
        type: 'high_temp',
        severity: maxTemp > 90 ? 'critical' : 'high',
        message: `High temperature: ${Math.round(maxTemp)}°C`,
        value: maxTemp,
        threshold: this.thresholds.maxTemperature,
        timestamp: metrics.timestamp,
        suggestions: [
          'Check cooling system',
          'Clean dust from components',
          'Lower performance settings',
          'Improve case airflow',
        ],
      });
    }

    // Network latency alert
    if (metrics.networkLatency > this.thresholds.maxNetworkLatency) {
      alerts.push({
        id: `network_${Date.now()}`,
        type: 'network_lag',
        severity: metrics.networkLatency > 200 ? 'high' : 'medium',
        message: `High network latency: ${Math.round(metrics.networkLatency)}ms`,
        value: metrics.networkLatency,
        threshold: this.thresholds.maxNetworkLatency,
        timestamp: metrics.timestamp,
        suggestions: [
          'Check internet connection',
          'Use wired connection',
          'Close bandwidth-heavy apps',
          'Contact ISP if persistent',
        ],
      });
    }

    // Add new alerts
    alerts.forEach(alert => this.addAlert(alert));
  }

  // Hardware detection and information gathering
  private async initializeHardwareDetection(): Promise<void> {
    try {
      // Get basic hardware info through available web APIs
      const hardwareInfo: HardwareInfo = {
        cpu: await this.getCPUInfo(),
        gpu: await this.getGPUInfo(),
        memory: await this.getMemoryInfo(),
        storage: await this.getStorageInfo(),
      };

      this.hardwareInfo = hardwareInfo;
      this.emit('hardwareDetected', hardwareInfo);
    } catch (error) {
      console.error('Hardware detection failed:', error);
    }
  }

  // Individual metric collection methods
  private async getCPUUsage(): Promise<number> {
    try {
      // Use Performance API for CPU estimation
      const startTime = performance.now();
      const startCPU = this.getCPUTime();
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const endTime = performance.now();
      const endCPU = this.getCPUTime();
      
      const timeDiff = endTime - startTime;
      const cpuDiff = endCPU - startCPU;
      
      return Math.min(100, (cpuDiff / timeDiff) * 100);
    } catch {
      return Math.random() * 20 + 40; // Mock fallback
    }
  }

  private getCPUTime(): number {
    // Estimate CPU time based on available APIs
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1000000;
    }
    return performance.now();
  }

  private async getGPUUsage(): Promise<number> {
    try {
      // Estimate GPU usage based on rendering performance
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      
      if (!gl) return 0;
      
      const startTime = performance.now();
      
      // Perform a small rendering test
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.finish();
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Estimate GPU usage based on render time
      return Math.min(100, renderTime * 10);
    } catch {
      return Math.random() * 30 + 50; // Mock fallback
    }
  }

  private async getMemoryUsage(): Promise<PerformanceMetrics['memoryUsage']> {
    try {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        return {
          used: memory.usedJSHeapSize,
          total: memory.jsHeapSizeLimit,
          percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
        };
      }
    } catch {}
    
    // Mock fallback
    const used = Math.random() * 4000000000 + 2000000000;
    const total = 8000000000;
    return {
      used,
      total,
      percentage: (used / total) * 100,
    };
  }

  private async getNetworkLatency(): Promise<number> {
    try {
      const startTime = performance.now();
      
      await fetch('/api/ping', {
        method: 'HEAD',
        cache: 'no-cache',
      });
      
      return performance.now() - startTime;
    } catch {
      return Math.random() * 50 + 20; // Mock fallback
    }
  }

  private async getTemperature(): Promise<PerformanceMetrics['temperature']> {
    // Temperature data would require native APIs or hardware monitoring
    // Provide mock data for demonstration
    return {
      cpu: Math.random() * 20 + 50,
      gpu: Math.random() * 25 + 60,
    };
  }

  private async getPowerUsage(): Promise<number> {
    // Power usage would require native APIs
    // Provide mock data for demonstration
    return Math.random() * 100 + 150; // Watts
  }

  // Hardware info collection methods
  private async getCPUInfo(): Promise<HardwareInfo['cpu']> {
    return {
      name: 'Intel Core i7-10700K', // Mock data
      cores: navigator.hardwareConcurrency || 8,
      threads: navigator.hardwareConcurrency || 16,
      baseFrequency: 3800,
      maxFrequency: 5100,
    };
  }

  private async getGPUInfo(): Promise<HardwareInfo['gpu']> {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown';
        
        return {
          name: renderer,
          memory: 8192, // Mock VRAM
          driverVersion: '471.96',
        };
      }
    } catch {}
    
    return {
      name: 'NVIDIA GeForce RTX 3070',
      memory: 8192,
      driverVersion: '471.96',
    };
  }

  private async getMemoryInfo(): Promise<HardwareInfo['memory']> {
    return {
      total: 16384, // MB
      speed: 3200, // MHz
      type: 'DDR4',
    };
  }

  private async getStorageInfo(): Promise<HardwareInfo['storage']> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return [{
          name: 'Primary Drive',
          size: estimate.quota || 1000000000000,
          type: 'NVMe',
          available: (estimate.quota || 1000000000000) - (estimate.usage || 0),
        }];
      }
    } catch {}
    
    return [{
      name: 'Samsung 980 PRO 1TB',
      size: 1000000000000,
      type: 'NVMe',
      available: 500000000000,
    }];
  }

  // Setup performance observer for detailed timing
  private setupPerformanceObserver(): void {
    try {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure' || entry.entryType === 'navigation') {
            this.processPerformanceEntry(entry);
          }
        }
      });
      
      this.performanceObserver.observe({ 
        entryTypes: ['measure', 'navigation', 'resource'] 
      });
    } catch (error) {
      console.warn('Performance Observer not supported:', error);
    }
  }

  private processPerformanceEntry(entry: PerformanceEntry): void {
    // Process performance entries for additional insights
    this.emit('performanceEntry', entry);
  }

  // Alert management
  private addAlert(alert: PerformanceAlert): void {
    this.alerts.unshift(alert);
    
    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this.alerts.pop();
    }
    
    this.emit('alertAdded', alert);
  }

  // Game-specific performance profiling
  public createGameProfile(gameId: string, gameName: string): void {
    const profile: GameProfile = {
      gameId,
      gameName,
      optimalSettings: {
        targetFPS: 60,
        maxCPUUsage: 70,
        maxGPUUsage: 80,
        maxMemoryUsage: 75,
      },
      benchmarkData: {
        averageFPS: 0,
        minFPS: 0,
        maxFPS: 0,
        frameTimeVariance: 0,
      },
      recommendedSettings: {},
    };
    
    this.gameProfiles.set(gameId, profile);
    this.emit('gameProfileCreated', profile);
  }

  public updateGameProfile(gameId: string, metrics: PerformanceMetrics[]): void {
    const profile = this.gameProfiles.get(gameId);
    if (!profile) return;
    
    const fpsValues = metrics.map(m => m.fps);
    profile.benchmarkData = {
      averageFPS: fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length,
      minFPS: Math.min(...fpsValues),
      maxFPS: Math.max(...fpsValues),
      frameTimeVariance: this.calculateVariance(metrics.map(m => m.frameTime)),
    };
    
    this.emit('gameProfileUpdated', profile);
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  // Performance optimization suggestions
  public getOptimizationSuggestions(): string[] {
    const suggestions: string[] = [];
    const recentMetrics = this.metrics.slice(-10);
    
    if (recentMetrics.length === 0) return suggestions;
    
    const avgFps = recentMetrics.reduce((sum, m) => sum + m.fps, 0) / recentMetrics.length;
    const avgCpu = recentMetrics.reduce((sum, m) => sum + m.cpuUsage, 0) / recentMetrics.length;
    const avgGpu = recentMetrics.reduce((sum, m) => sum + m.gpuUsage, 0) / recentMetrics.length;
    
    if (avgFps < 30) {
      suggestions.push('Consider lowering graphics settings for better performance');
    }
    
    if (avgCpu > 80) {
      suggestions.push('Close background applications to reduce CPU usage');
    }
    
    if (avgGpu > 90) {
      suggestions.push('Lower resolution or graphics quality to reduce GPU load');
    }
    
    return suggestions;
  }

  // Public API methods
  public getCurrentMetrics(): PerformanceMetrics | null {
    return this.metrics[this.metrics.length - 1] || null;
  }

  public getMetricsHistory(duration = 300000): PerformanceMetrics[] {
    const cutoff = Date.now() - duration;
    return this.metrics.filter(m => m.timestamp > cutoff);
  }

  public getActiveAlerts(): PerformanceAlert[] {
    const cutoff = Date.now() - 300000; // Last 5 minutes
    return this.alerts.filter(a => a.timestamp > cutoff);
  }

  public getHardwareInfo(): HardwareInfo | null {
    return this.hardwareInfo;
  }

  public isMonitoringActive(): boolean {
    return this.isMonitoring;
  }

  public updateThresholds(newThresholds: Partial<typeof this.thresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
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
    this.stopMonitoring();
    
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = null;
    }
    
    this.eventListeners.clear();
  }
}

// FPS Counter utility class
class FPSCounter {
  private fps = 0;
  private frameCount = 0;
  private lastTime = 0;
  private isRunning = false;
  private animationId = 0;

  public start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastTime = performance.now();
    this.frameCount = 0;
    this.loop();
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }
  }

  private loop = (): void => {
    if (!this.isRunning) return;
    
    this.frameCount++;
    const currentTime = performance.now();
    
    if (currentTime >= this.lastTime + 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
      this.frameCount = 0;
      this.lastTime = currentTime;
    }
    
    this.animationId = requestAnimationFrame(this.loop);
  };

  public getCurrentFPS(): number {
    return this.fps;
  }
}

// Export utilities
export const PerformanceUtils = {
  formatBytes: (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  },

  formatFrequency: (hz: number): string => {
    if (hz >= 1000000000) {
      return `${(hz / 1000000000).toFixed(1)} GHz`;
    } else if (hz >= 1000000) {
      return `${(hz / 1000000).toFixed(1)} MHz`;
    } else if (hz >= 1000) {
      return `${(hz / 1000).toFixed(1)} kHz`;
    }
    return `${hz} Hz`;
  },

  getPerformanceGrade: (fps: number): string => {
    if (fps >= 60) return 'Excellent';
    if (fps >= 45) return 'Good';
    if (fps >= 30) return 'Fair';
    return 'Poor';
  },

  getUsageColor: (percentage: number): string => {
    if (percentage >= 90) return '#ff4444';
    if (percentage >= 70) return '#ffaa00';
    if (percentage >= 50) return '#ffdd00';
    return '#44ff44';
  },
};

// Initialize performance monitor
export const performanceMonitor = new PerformanceMonitor();
