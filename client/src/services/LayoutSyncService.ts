import { layoutPersistenceService, LayoutSummary } from './LayoutPersistenceService';
import { SerializedLayout } from '../lib/layoutSerialization';

/**
 * Sync status response
 */
export interface SyncStatusResponse {
  success: boolean;
  message: string;
  lastSynced?: string;
  layoutCount?: number;
}

/**
 * Device information for multi-device sync
 */
export interface DeviceInfo {
  id: string;
  name: string;
  type: 'desktop' | 'tablet' | 'mobile' | 'other';
  lastSynced?: string;
  lastActive?: string;
}

/**
 * Service for handling synchronization of layouts between devices
 */
export class LayoutSyncService {
  private deviceId: string;
  private deviceName: string;
  private deviceType: 'desktop' | 'tablet' | 'mobile' | 'other';
  private syncEnabled: boolean = true;
  private autoSyncInterval: number = 5 * 60 * 1000; // 5 minutes
  private syncIntervalId: number | null = null;
  private lastSyncTimestamp: string | null = null;
  
  // Event callbacks
  private syncStatusCallbacks: ((status: SyncStatusResponse) => void)[] = [];
  
  constructor() {
    // Generate or load device ID
    this.deviceId = localStorage.getItem('nexus-device-id') || this.generateDeviceId();
    localStorage.setItem('nexus-device-id', this.deviceId);
    
    // Determine device type and name
    this.deviceType = this.detectDeviceType();
    this.deviceName = localStorage.getItem('nexus-device-name') || this.generateDeviceName();
    localStorage.setItem('nexus-device-name', this.deviceName);
    
    // Load sync settings
    this.syncEnabled = localStorage.getItem('nexus-sync-enabled') !== 'false';
    const savedInterval = localStorage.getItem('nexus-sync-interval');
    if (savedInterval) {
      this.autoSyncInterval = parseInt(savedInterval, 10);
    }
    
    // Load last sync timestamp
    this.lastSyncTimestamp = localStorage.getItem('nexus-last-sync');
  }
  
  /**
   * Initialize the sync service
   */
  init(options: { autoSync?: boolean, interval?: number } = {}): void {
    // Update options if provided
    if (options.autoSync !== undefined) {
      this.syncEnabled = options.autoSync;
      localStorage.setItem('nexus-sync-enabled', String(this.syncEnabled));
    }
    
    if (options.interval) {
      this.autoSyncInterval = options.interval;
      localStorage.setItem('nexus-sync-interval', String(this.autoSyncInterval));
    }
    
    // Start auto-sync if enabled
    this.startAutoSync();
    
    // Register with server to receive push notifications for sync events
    this.registerDevice();
  }
  
  /**
   * Start automatic synchronization
   */
  startAutoSync(): void {
    // Clear any existing interval
    this.stopAutoSync();
    
    if (this.syncEnabled) {
      // Set up new interval
      this.syncIntervalId = window.setInterval(() => {
        this.syncLayouts();
      }, this.autoSyncInterval);
      
      // Do an initial sync
      this.syncLayouts();
    }
  }
  
  /**
   * Stop automatic synchronization
   */
  stopAutoSync(): void {
    if (this.syncIntervalId !== null) {
      window.clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }
  }
  
  /**
   * Generate a unique device ID
   */
  private generateDeviceId(): string {
    return 'device_' + Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
  
  /**
   * Generate a descriptive device name
   */
  private generateDeviceName(): string {
    const browserInfo = this.getBrowserInfo();
    const osInfo = this.getOSInfo();
    return `${osInfo} ${browserInfo}`;
  }
  
  /**
   * Get browser information
   */
  private getBrowserInfo(): string {
    const userAgent = navigator.userAgent;
    let browserName = 'Unknown Browser';
    
    if (userAgent.indexOf('Firefox') > -1) {
      browserName = 'Firefox';
    } else if (userAgent.indexOf('Chrome') > -1) {
      browserName = 'Chrome';
    } else if (userAgent.indexOf('Safari') > -1) {
      browserName = 'Safari';
    } else if (userAgent.indexOf('Edge') > -1) {
      browserName = 'Edge';
    } else if (userAgent.indexOf('MSIE') > -1 || userAgent.indexOf('Trident/') > -1) {
      browserName = 'Internet Explorer';
    }
    
    return browserName;
  }
  
  /**
   * Get OS information
   */
  private getOSInfo(): string {
    const userAgent = navigator.userAgent;
    let osName = 'Unknown OS';
    
    if (userAgent.indexOf('Windows') > -1) {
      osName = 'Windows';
    } else if (userAgent.indexOf('Mac') > -1) {
      osName = 'MacOS';
    } else if (userAgent.indexOf('Linux') > -1) {
      osName = 'Linux';
    } else if (userAgent.indexOf('Android') > -1) {
      osName = 'Android';
    } else if (userAgent.indexOf('iOS') > -1 || /iPhone|iPad|iPod/.test(userAgent)) {
      osName = 'iOS';
    }
    
    return osName;
  }
  
  /**
   * Detect device type based on screen size and user agent
   */
  private detectDeviceType(): 'desktop' | 'tablet' | 'mobile' | 'other' {
    const userAgent = navigator.userAgent.toLowerCase();
    const width = window.innerWidth;
    
    // Check for mobile devices
    if (/android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
      return 'mobile';
    }
    
    // Check for tablets
    if (/ipad|tablet/i.test(userAgent) || (width >= 768 && width < 1024)) {
      return 'tablet';
    }
    
    // Default to desktop for larger screens
    if (width >= 1024) {
      return 'desktop';
    }
    
    return 'other';
  }
  
  /**
   * Register this device with the server
   */
  private async registerDevice(): Promise<boolean> {
    try {
      // In a real implementation, this would make an API call to register the device
      // For now, we'll simulate a successful registration
      console.log('Device registered for sync:', {
        id: this.deviceId,
        name: this.deviceName,
        type: this.deviceType
      });
      
      return true;
    } catch (error) {
      console.error('Error registering device:', error);
      return false;
    }
  }
  
  /**
   * Sync layouts with the server
   */
  async syncLayouts(): Promise<SyncStatusResponse> {
    try {
      // In a real implementation, this would:
      // 1. Pull layouts from server that are newer than last sync
      // 2. Push local layouts that have been modified since last sync
      // 3. Handle merge conflicts
      
      // For now, we'll use the existing sync implementation
      const syncSuccess = await layoutPersistenceService.syncWithServer();
      
      const response: SyncStatusResponse = {
        success: syncSuccess,
        message: syncSuccess ? 'Layouts synchronized successfully' : 'Failed to synchronize layouts',
        lastSynced: new Date().toISOString(),
        layoutCount: layoutPersistenceService.getLayoutSummaries().length
      };
      
      if (syncSuccess) {
        this.lastSyncTimestamp = response.lastSynced;
        localStorage.setItem('nexus-last-sync', this.lastSyncTimestamp);
      }
      
      // Notify listeners
      this.notifySyncStatus(response);
      
      return response;
    } catch (error) {
      console.error('Error syncing layouts:', error);
      
      const errorResponse: SyncStatusResponse = {
        success: false,
        message: `Error syncing layouts: ${error instanceof Error ? error.message : String(error)}`
      };
      
      this.notifySyncStatus(errorResponse);
      
      return errorResponse;
    }
  }
  
  /**
   * Force sync a specific layout
   */
  async syncLayout(layoutId: string): Promise<boolean> {
    try {
      // In a real implementation, this would push a specific layout to the server
      // For now, we'll simulate a successful sync
      console.log(`Syncing layout ${layoutId}`);
      
      // Trigger a full sync as a fallback
      await this.syncLayouts();
      
      return true;
    } catch (error) {
      console.error(`Error syncing layout ${layoutId}:`, error);
      return false;
    }
  }
  
  /**
   * Get all devices registered for this account
   */
  async getRegisteredDevices(): Promise<DeviceInfo[]> {
    try {
      // In a real implementation, this would fetch devices from the server
      // For now, we'll return a static list including this device
      const thisDevice: DeviceInfo = {
        id: this.deviceId,
        name: this.deviceName,
        type: this.deviceType,
        lastSynced: this.lastSyncTimestamp || undefined,
        lastActive: new Date().toISOString()
      };
      
      return [thisDevice];
    } catch (error) {
      console.error('Error getting registered devices:', error);
      return [];
    }
  }
  
  /**
   * Update device name
   */
  updateDeviceName(name: string): void {
    this.deviceName = name;
    localStorage.setItem('nexus-device-name', name);
    
    // Update the registration with the server
    this.registerDevice();
  }
  
  /**
   * Set sync enabled/disabled
   */
  setSyncEnabled(enabled: boolean): void {
    this.syncEnabled = enabled;
    localStorage.setItem('nexus-sync-enabled', String(enabled));
    
    if (enabled) {
      this.startAutoSync();
    } else {
      this.stopAutoSync();
    }
  }
  
  /**
   * Set the auto-sync interval
   */
  setAutoSyncInterval(intervalMs: number): void {
    this.autoSyncInterval = intervalMs;
    localStorage.setItem('nexus-sync-interval', String(intervalMs));
    
    // Restart sync with new interval if enabled
    if (this.syncEnabled) {
      this.startAutoSync();
    }
  }
  
  /**
   * Check if sync is enabled
   */
  isSyncEnabled(): boolean {
    return this.syncEnabled;
  }
  
  /**
   * Get the auto-sync interval
   */
  getAutoSyncInterval(): number {
    return this.autoSyncInterval;
  }
  
  /**
   * Get the device ID
   */
  getDeviceId(): string {
    return this.deviceId;
  }
  
  /**
   * Get the device name
   */
  getDeviceName(): string {
    return this.deviceName;
  }
  
  /**
   * Get the device type
   */
  getDeviceType(): 'desktop' | 'tablet' | 'mobile' | 'other' {
    return this.deviceType;
  }
  
  /**
   * Get the last sync timestamp
   */
  getLastSyncTimestamp(): string | null {
    return this.lastSyncTimestamp;
  }
  
  /**
   * Subscribe to sync status updates
   */
  subscribeSyncStatus(callback: (status: SyncStatusResponse) => void): () => void {
    this.syncStatusCallbacks.push(callback);
    return () => {
      this.syncStatusCallbacks = this.syncStatusCallbacks.filter(cb => cb !== callback);
    };
  }
  
  /**
   * Notify listeners of sync status updates
   */
  private notifySyncStatus(status: SyncStatusResponse): void {
    this.syncStatusCallbacks.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error in sync status callback:', error);
      }
    });
  }
}

// Create a singleton instance
export const layoutSyncService = new LayoutSyncService();

export default layoutSyncService;