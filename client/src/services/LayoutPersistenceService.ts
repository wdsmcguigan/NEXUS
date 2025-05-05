import { PanelConfig } from '../context/PanelContext';
import { 
  SerializedLayout,
  serializeLayout,
  deserializeLayout,
  validateSerializedLayout,
  migrateLayout,
  CURRENT_LAYOUT_VERSION,
  LayoutTemplateType
} from '../lib/layoutSerialization';
import { enhancedComponentRegistry, ComponentInstance } from '../lib/enhancedComponentRegistry';
import { debounce } from 'lodash';

// Local storage keys
const LAYOUT_KEY_PREFIX = 'nexus-layout-';
const CURRENT_LAYOUT_KEY = 'nexus-current-layout';
const LAYOUT_LIST_KEY = 'nexus-layout-list';
const DEFAULT_LAYOUT_KEY = 'nexus-default-layout';
const LAYOUT_SYNC_STATE_KEY = 'nexus-layout-sync-state';

/**
 * Types of storage for layouts
 */
export enum StorageType {
  LOCAL = 'local',    // Stored in browser's localStorage
  SERVER = 'server',  // Stored on the server
  CLOUD = 'cloud',    // Stored in cloud storage
  FILE = 'file'       // Stored in a file (export/import)
}

/**
 * Layout summary for listings
 */
export interface LayoutSummary {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  isDefault?: boolean;
  isBuiltIn?: boolean;
  deviceType?: 'desktop' | 'tablet' | 'mobile' | 'any';
  category?: string;
  tags?: string[];
  created: string;
  modified: string;
  storageType: StorageType;
  version: string;
}

/**
 * Layout sync state
 */
interface LayoutSyncState {
  lastSyncedTimestamp?: string;
  pendingSyncLayouts: string[]; // IDs of layouts waiting to be synced
  syncInProgress: boolean;
  lastSyncError?: string;
}

/**
 * Service for persisting and managing layouts
 */
export class LayoutPersistenceService {
  private savedLayouts: Map<string, SerializedLayout> = new Map();
  private layoutSummaries: LayoutSummary[] = [];
  private currentLayoutId: string | null = null;
  private defaultLayoutId: string | null = null;
  private autoSaveEnabled: boolean = true;
  private syncState: LayoutSyncState = {
    pendingSyncLayouts: [],
    syncInProgress: false
  };
  
  // Event callbacks
  private layoutChangedCallbacks: ((layout: SerializedLayout) => void)[] = [];
  private layoutListChangedCallbacks: ((layouts: LayoutSummary[]) => void)[] = [];
  private syncStateChangedCallbacks: ((state: LayoutSyncState) => void)[] = [];
  
  // Debounced functions
  private debouncedAutoSave = debounce(this.saveCurrentLayout.bind(this), 5000);
  
  /**
   * Initialize the service
   */
  async init(options: { autoSave?: boolean } = {}): Promise<boolean> {
    this.autoSaveEnabled = options.autoSave ?? true;
    
    try {
      // Load saved layouts from storage
      await this.loadSavedLayouts();
      
      // Load layout sync state
      this.loadSyncState();
      
      return true;
    } catch (error) {
      console.error('Error initializing layout persistence service:', error);
      return false;
    }
  }
  
  /**
   * Load all saved layouts from storage
   */
  private async loadSavedLayouts(): Promise<void> {
    // Clear existing layouts
    this.savedLayouts.clear();
    this.layoutSummaries = [];
    
    // Load the layout list
    const layoutListJson = localStorage.getItem(LAYOUT_LIST_KEY);
    if (layoutListJson) {
      try {
        const layoutList = JSON.parse(layoutListJson) as LayoutSummary[];
        this.layoutSummaries = layoutList;
        
        // Load each layout
        for (const summary of layoutList) {
          const layoutKey = `${LAYOUT_KEY_PREFIX}${summary.id}`;
          const layoutJson = localStorage.getItem(layoutKey);
          
          if (layoutJson) {
            try {
              const layout = JSON.parse(layoutJson) as SerializedLayout;
              
              // Validate and migrate if needed
              if (validateSerializedLayout(layout)) {
                const migratedLayout = migrateLayout(layout);
                if (migratedLayout) {
                  this.savedLayouts.set(summary.id, migratedLayout);
                }
              }
            } catch (error) {
              console.error(`Error parsing layout ${summary.id}:`, error);
            }
          }
        }
      } catch (error) {
        console.error('Error parsing layout list:', error);
      }
    }
    
    // Load current layout
    this.currentLayoutId = localStorage.getItem(CURRENT_LAYOUT_KEY);
    
    // Load default layout
    this.defaultLayoutId = localStorage.getItem(DEFAULT_LAYOUT_KEY);
  }
  
  /**
   * Load layout sync state
   */
  private loadSyncState(): void {
    const syncStateJson = localStorage.getItem(LAYOUT_SYNC_STATE_KEY);
    if (syncStateJson) {
      try {
        this.syncState = JSON.parse(syncStateJson);
      } catch (error) {
        console.error('Error parsing layout sync state:', error);
        this.syncState = {
          pendingSyncLayouts: [],
          syncInProgress: false
        };
      }
    }
  }
  
  /**
   * Save the sync state
   */
  private saveSyncState(): void {
    try {
      localStorage.setItem(LAYOUT_SYNC_STATE_KEY, JSON.stringify(this.syncState));
      this.notifySyncStateChanged();
    } catch (error) {
      console.error('Error saving layout sync state:', error);
    }
  }
  
  /**
   * Get all saved layout summaries
   */
  getLayoutSummaries(): LayoutSummary[] {
    return [...this.layoutSummaries];
  }
  
  /**
   * Get layout summaries by category
   */
  getLayoutSummariesByCategory(category: string): LayoutSummary[] {
    return this.layoutSummaries.filter(summary => summary.category === category);
  }
  
  /**
   * Get layout summaries by tag
   */
  getLayoutSummariesByTag(tag: string): LayoutSummary[] {
    return this.layoutSummaries.filter(summary => 
      summary.tags && summary.tags.includes(tag)
    );
  }
  
  /**
   * Get a layout by ID
   */
  getLayout(id: string): SerializedLayout | null {
    return this.savedLayouts.get(id) || null;
  }
  
  /**
   * Get the current layout
   */
  getCurrentLayout(): SerializedLayout | null {
    if (!this.currentLayoutId) return null;
    return this.getLayout(this.currentLayoutId);
  }
  
  /**
   * Get the default layout
   */
  getDefaultLayout(): SerializedLayout | null {
    if (!this.defaultLayoutId) return null;
    return this.getLayout(this.defaultLayoutId);
  }
  
  /**
   * Set the current layout
   */
  setCurrentLayout(id: string): boolean {
    if (!this.savedLayouts.has(id)) return false;
    
    this.currentLayoutId = id;
    localStorage.setItem(CURRENT_LAYOUT_KEY, id);
    
    const layout = this.getLayout(id);
    if (layout) {
      this.notifyLayoutChanged(layout);
      return true;
    }
    
    return false;
  }
  
  /**
   * Set the default layout
   */
  setDefaultLayout(id: string): boolean {
    if (!this.savedLayouts.has(id)) return false;
    
    this.defaultLayoutId = id;
    localStorage.setItem(DEFAULT_LAYOUT_KEY, id);
    
    // Update the summary
    const summary = this.layoutSummaries.find(s => s.id === id);
    if (summary) {
      // Reset all default flags
      this.layoutSummaries.forEach(s => {
        s.isDefault = s.id === id;
      });
      
      // Update the layout
      const layout = this.getLayout(id);
      if (layout) {
        layout.isDefault = true;
        this.saveLayout(layout);
      }
      
      // Save the updated summaries
      this.saveLayoutSummaries();
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Save layout summaries to storage
   */
  private saveLayoutSummaries(): void {
    try {
      localStorage.setItem(LAYOUT_LIST_KEY, JSON.stringify(this.layoutSummaries));
      this.notifyLayoutListChanged();
    } catch (error) {
      console.error('Error saving layout summaries:', error);
    }
  }
  
  /**
   * Save a layout
   */
  saveLayout(layout: SerializedLayout): boolean {
    try {
      // Update modified timestamp
      layout.modified = new Date().toISOString();
      
      // Save to memory
      this.savedLayouts.set(layout.name, layout);
      
      // Save to localStorage
      const layoutKey = `${LAYOUT_KEY_PREFIX}${layout.name}`;
      localStorage.setItem(layoutKey, JSON.stringify(layout));
      
      // Update or add summary
      const existingSummaryIndex = this.layoutSummaries.findIndex(s => s.id === layout.name);
      const summary: LayoutSummary = {
        id: layout.name,
        name: layout.name,
        description: layout.description,
        thumbnail: layout.thumbnail,
        isDefault: layout.isDefault,
        isBuiltIn: layout.isBuiltIn,
        deviceType: layout.deviceType,
        category: layout.category,
        tags: layout.tags,
        created: layout.created,
        modified: layout.modified,
        storageType: StorageType.LOCAL,
        version: layout.version
      };
      
      if (existingSummaryIndex >= 0) {
        this.layoutSummaries[existingSummaryIndex] = summary;
      } else {
        this.layoutSummaries.push(summary);
      }
      
      // Save the updated summaries
      this.saveLayoutSummaries();
      
      // Add to pending sync if needed
      if (!layout.isBuiltIn) {
        this.addToPendingSync(layout.name);
      }
      
      return true;
    } catch (error) {
      console.error('Error saving layout:', error);
      return false;
    }
  }
  
  /**
   * Add a layout to the pending sync list
   */
  private addToPendingSync(layoutId: string): void {
    if (!this.syncState.pendingSyncLayouts.includes(layoutId)) {
      this.syncState.pendingSyncLayouts.push(layoutId);
      this.saveSyncState();
    }
  }
  
  /**
   * Save the current application layout
   */
  saveCurrentLayout(name?: string): boolean {
    // This would be called by the application when the layout changes
    if (!name && !this.currentLayoutId) {
      console.warn('Cannot save current layout: no current layout and no name provided');
      return false;
    }
    
    const layoutId = name || this.currentLayoutId!;
    
    // Get the current layout from the application
    // Note: In a real implementation, this would come from the PanelContext
    const currentPanelLayout: PanelConfig = {
      id: 'mockLayout',
      type: 'panel',
      tabs: []
    };
    
    // Serialize the layout
    const serializedLayout = serializeLayout(
      currentPanelLayout,
      layoutId,
      {
        description: 'Automatically saved layout',
        isDefault: layoutId === this.defaultLayoutId
      }
    );
    
    // Save the layout
    const success = this.saveLayout(serializedLayout);
    
    // Update current layout ID if needed
    if (success && name && name !== this.currentLayoutId) {
      this.setCurrentLayout(name);
    }
    
    return success;
  }
  
  /**
   * Load a layout into the application
   */
  loadLayout(id: string): boolean {
    const layout = this.getLayout(id);
    if (!layout) return false;
    
    try {
      // Deserialize the layout
      const { layout: panelLayout, componentInstances } = deserializeLayout(layout);
      
      // Update component instances in the registry
      for (const instance of componentInstances) {
        // In a real implementation, this would register the instances with the registry
        // or another appropriate mechanism
        console.log('Loaded component instance:', instance);
      }
      
      // Set the current layout ID
      this.setCurrentLayout(id);
      
      return true;
    } catch (error) {
      console.error('Error loading layout:', error);
      return false;
    }
  }
  
  /**
   * Delete a layout
   */
  deleteLayout(id: string): boolean {
    // Check if this is the default layout
    if (id === this.defaultLayoutId) {
      console.warn('Cannot delete the default layout');
      return false;
    }
    
    // Remove from memory
    this.savedLayouts.delete(id);
    
    // Remove from localStorage
    const layoutKey = `${LAYOUT_KEY_PREFIX}${id}`;
    localStorage.removeItem(layoutKey);
    
    // Update summaries
    this.layoutSummaries = this.layoutSummaries.filter(s => s.id !== id);
    this.saveLayoutSummaries();
    
    // If this was the current layout, reset to default
    if (id === this.currentLayoutId) {
      if (this.defaultLayoutId) {
        this.setCurrentLayout(this.defaultLayoutId);
      } else {
        this.currentLayoutId = null;
        localStorage.removeItem(CURRENT_LAYOUT_KEY);
      }
    }
    
    return true;
  }
  
  /**
   * Create a new layout from the current state
   */
  createLayoutFromCurrent(
    name: string,
    options: { 
      description?: string;
      category?: string;
      tags?: string[];
      isDefault?: boolean;
    } = {}
  ): string | null {
    // Save the current layout with the new name
    const success = this.saveCurrentLayout(name);
    
    if (success) {
      // Get the saved layout and update its properties
      const layout = this.getLayout(name);
      if (layout) {
        layout.description = options.description || layout.description;
        layout.category = options.category || layout.category;
        layout.tags = options.tags || layout.tags;
        
        // Save the updated layout
        this.saveLayout(layout);
        
        // Set as default if requested
        if (options.isDefault) {
          this.setDefaultLayout(name);
        }
        
        return name;
      }
    }
    
    return null;
  }
  
  /**
   * Create a layout from a template
   */
  createLayoutFromTemplate(
    templateType: LayoutTemplateType,
    name: string,
    options: { 
      description?: string;
      category?: string;
      tags?: string[];
      isDefault?: boolean;
    } = {}
  ): string | null {
    // In a real implementation, this would create a layout based on a predefined template
    // For now, we'll just create a simple layout with placeholder data
    
    const layout: SerializedLayout = {
      version: CURRENT_LAYOUT_VERSION,
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      name,
      description: options.description || `${templateType} layout`,
      category: options.category || templateType,
      tags: options.tags || [templateType],
      isDefault: options.isDefault,
      isBuiltIn: false,
      deviceType: 'any',
      rootPanel: {
        id: 'root',
        type: 'panel',
        tabs: []
      },
      componentInstances: []
    };
    
    // Save the layout
    const success = this.saveLayout(layout);
    
    // Set as default if requested
    if (success && options.isDefault) {
      this.setDefaultLayout(name);
    }
    
    return success ? name : null;
  }
  
  /**
   * Import a layout from a JSON string
   */
  importLayout(jsonString: string): string | null {
    try {
      const layout = JSON.parse(jsonString);
      
      // Validate the layout
      if (!validateSerializedLayout(layout)) {
        console.error('Invalid layout format');
        return null;
      }
      
      // Add a timestamp to the name to ensure uniqueness
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const originalName = layout.name;
      layout.name = `${originalName} (Imported ${timestamp})`;
      layout.isBuiltIn = false;
      layout.modified = new Date().toISOString();
      
      // Save the layout
      const success = this.saveLayout(layout);
      
      return success ? layout.name : null;
    } catch (error) {
      console.error('Error importing layout:', error);
      return null;
    }
  }
  
  /**
   * Export a layout to a JSON string
   */
  exportLayout(id: string): string | null {
    const layout = this.getLayout(id);
    if (!layout) return null;
    
    try {
      return JSON.stringify(layout, null, 2);
    } catch (error) {
      console.error('Error exporting layout:', error);
      return null;
    }
  }
  
  /**
   * Duplicate a layout
   */
  duplicateLayout(id: string, newName?: string): string | null {
    const layout = this.getLayout(id);
    if (!layout) return null;
    
    // Create a copy with a new name
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const name = newName || `${layout.name} (Copy ${timestamp})`;
    
    const newLayout: SerializedLayout = {
      ...layout,
      name,
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      isDefault: false,
      isBuiltIn: false
    };
    
    // Save the new layout
    const success = this.saveLayout(newLayout);
    
    return success ? name : null;
  }
  
  /**
   * Reset to the default layout
   */
  resetToDefault(): boolean {
    if (!this.defaultLayoutId) {
      console.warn('No default layout set');
      return false;
    }
    
    return this.loadLayout(this.defaultLayoutId);
  }
  
  /**
   * Enable or disable auto-save
   */
  setAutoSave(enabled: boolean): void {
    this.autoSaveEnabled = enabled;
  }
  
  /**
   * Trigger auto-save (debounced)
   */
  triggerAutoSave(): void {
    if (this.autoSaveEnabled && this.currentLayoutId) {
      this.debouncedAutoSave();
    }
  }
  
  /**
   * Sync layouts with the server
   */
  async syncWithServer(): Promise<boolean> {
    if (this.syncState.syncInProgress) {
      console.warn('Sync already in progress');
      return false;
    }
    
    try {
      this.syncState.syncInProgress = true;
      this.syncState.lastSyncError = undefined;
      this.saveSyncState();
      
      // In a real implementation, this would sync with a server
      // For now, we'll just simulate a successful sync
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.syncState.pendingSyncLayouts = [];
      this.syncState.lastSyncedTimestamp = new Date().toISOString();
      this.syncState.syncInProgress = false;
      this.saveSyncState();
      
      return true;
    } catch (error) {
      console.error('Error syncing with server:', error);
      
      this.syncState.syncInProgress = false;
      this.syncState.lastSyncError = error instanceof Error ? error.message : String(error);
      this.saveSyncState();
      
      return false;
    }
  }
  
  /**
   * Subscribe to layout changes
   */
  subscribeToLayoutChanges(callback: (layout: SerializedLayout) => void): () => void {
    this.layoutChangedCallbacks.push(callback);
    return () => {
      this.layoutChangedCallbacks = this.layoutChangedCallbacks.filter(cb => cb !== callback);
    };
  }
  
  /**
   * Subscribe to layout list changes
   */
  subscribeToLayoutListChanges(callback: (layouts: LayoutSummary[]) => void): () => void {
    this.layoutListChangedCallbacks.push(callback);
    return () => {
      this.layoutListChangedCallbacks = this.layoutListChangedCallbacks.filter(cb => cb !== callback);
    };
  }
  
  /**
   * Subscribe to sync state changes
   */
  subscribeToSyncStateChanges(callback: (state: LayoutSyncState) => void): () => void {
    this.syncStateChangedCallbacks.push(callback);
    return () => {
      this.syncStateChangedCallbacks = this.syncStateChangedCallbacks.filter(cb => cb !== callback);
    };
  }
  
  /**
   * Notify listeners of layout changes
   */
  private notifyLayoutChanged(layout: SerializedLayout): void {
    this.layoutChangedCallbacks.forEach(callback => {
      try {
        callback(layout);
      } catch (error) {
        console.error('Error in layout change callback:', error);
      }
    });
  }
  
  /**
   * Notify listeners of layout list changes
   */
  private notifyLayoutListChanged(): void {
    this.layoutListChangedCallbacks.forEach(callback => {
      try {
        callback(this.layoutSummaries);
      } catch (error) {
        console.error('Error in layout list change callback:', error);
      }
    });
  }
  
  /**
   * Notify listeners of sync state changes
   */
  private notifySyncStateChanged(): void {
    this.syncStateChangedCallbacks.forEach(callback => {
      try {
        callback(this.syncState);
      } catch (error) {
        console.error('Error in sync state change callback:', error);
      }
    });
  }
}

// Create a singleton instance
export const layoutPersistenceService = new LayoutPersistenceService();

export default layoutPersistenceService;