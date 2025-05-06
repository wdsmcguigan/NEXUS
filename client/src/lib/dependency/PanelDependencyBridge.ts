/**
 * PanelDependencyBridge.ts
 * 
 * This file creates a bridge between the Panel/Tab system and the Dependency system.
 * It maps TabIDs to ComponentIDs consistently, handles component lifecycle events,
 * and ensures proper communication between the two systems.
 */

import { DependencyManager } from './DependencyManager';
import { DependencyRegistry } from './DependencyRegistry';
import { DependencyDataTypes, DependencyStatus } from './DependencyInterfaces';
import { EventEmitter } from '../utils/EventEmitter';

// Events that the bridge will emit or listen for
export enum PanelDependencyEvents {
  COMPONENT_MOUNTED = 'component_mounted',
  COMPONENT_UNMOUNTED = 'component_unmounted',
  COMPONENT_FOCUSED = 'component_focused',
  COMPONENT_BLURRED = 'component_blurred',
  DATA_UPDATED = 'data_updated',
  DEPENDENCY_CREATED = 'dependency_created',
  DEPENDENCY_REMOVED = 'dependency_removed',
  DEPENDENCY_STATUS_CHANGED = 'dependency_status_changed',
}

// The component type (matches our email components)
export enum PanelComponentType {
  EMAIL_LIST = 'EMAIL_LIST',
  EMAIL_DETAIL = 'EMAIL_DETAIL',
}

// The shape of the component registration data
export interface ComponentRegistrationData {
  tabId: string;
  panelId: string;
  instanceId: string; // May be different from tabId due to React component lifecycle
  componentType: PanelComponentType;
  metadata?: Record<string, any>;
}

/**
 * PanelDependencyBridge class handles communication between the Panel system and Dependency system
 */
export class PanelDependencyBridge {
  private static instance: PanelDependencyBridge;
  private registry: DependencyRegistry;
  private manager: DependencyManager;
  private eventEmitter: EventEmitter;
  
  // Maps tab IDs to component IDs for consistent lookup
  private tabToComponentMap: Map<string, string> = new Map();
  
  // Maps component types to their tab IDs for quick lookup
  private componentTypeMap: Map<PanelComponentType, Set<string>> = new Map();
  
  // Track active component state
  private activeComponents: Set<string> = new Set();
  
  // Track registered components
  private registeredComponents: Map<string, ComponentRegistrationData> = new Map();

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor(registry: DependencyRegistry, manager: DependencyManager) {
    this.registry = registry;
    this.manager = manager;
    this.eventEmitter = new EventEmitter();
    
    // Initialize component type map
    Object.values(PanelComponentType).forEach(type => {
      this.componentTypeMap.set(type, new Set());
    });
    
    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Get the singleton instance of the bridge
   */
  public static getInstance(registry: DependencyRegistry, manager: DependencyManager): PanelDependencyBridge {
    if (!PanelDependencyBridge.instance) {
      PanelDependencyBridge.instance = new PanelDependencyBridge(registry, manager);
    }
    return PanelDependencyBridge.instance;
  }

  /**
   * Set up event listeners for the bridge
   */
  private setupEventListeners() {
    // Listen for dependency status changes from the registry
    this.registry.on('dependencyStatusChanged', (dependencyId: string, status: DependencyStatus) => {
      // Emit event to listeners
      this.eventEmitter.emit(PanelDependencyEvents.DEPENDENCY_STATUS_CHANGED, { dependencyId, status });
      
      console.log(`[PanelDependencyBridge] Dependency ${dependencyId} status changed to ${status}`);
    });
    
    // Listen for data updates from the manager
    this.manager.on('dataUpdated', (dependencyId: string, data: any) => {
      // Emit event to listeners
      this.eventEmitter.emit(PanelDependencyEvents.DATA_UPDATED, { dependencyId, data });
      
      console.log(`[PanelDependencyBridge] Data updated for dependency ${dependencyId}`);
    });
  }

  /**
   * Register a component with the bridge
   */
  public registerComponent(data: ComponentRegistrationData): void {
    const { tabId, panelId, instanceId, componentType } = data;
    
    // Normalize the component ID to ensure consistency across the component lifecycle
    // Format: _COMPONENT_TYPE_-tabId 
    // This allows components to be recreated with different instance IDs (React) but still be recognized
    const normalizedComponentId = `_${componentType}_-${tabId}`;
    
    console.log(`[PanelDependencyBridge] Registering component: ${normalizedComponentId} (tabId: ${tabId}, type: ${componentType})`);
    
    // Store the mapping
    this.tabToComponentMap.set(tabId, normalizedComponentId);
    this.componentTypeMap.get(componentType)?.add(tabId);
    this.registeredComponents.set(normalizedComponentId, {
      ...data,
      instanceId: normalizedComponentId // Override the instance ID with our normalized ID
    });
    
    // Emit component mounted event
    this.eventEmitter.emit(PanelDependencyEvents.COMPONENT_MOUNTED, {
      tabId,
      panelId,
      componentId: normalizedComponentId,
      componentType
    });
    
    console.log(`[PanelDependencyBridge] Component registered successfully: ${normalizedComponentId}`);
  }

  /**
   * Unregister a component from the bridge
   */
  public unregisterComponent(tabId: string): void {
    const componentId = this.tabToComponentMap.get(tabId);
    
    if (!componentId) {
      console.warn(`[PanelDependencyBridge] Cannot unregister component for tabId ${tabId}: Not found`);
      return;
    }
    
    console.log(`[PanelDependencyBridge] Unregistering component: ${componentId} (tabId: ${tabId})`);
    
    // Get component data before removal
    const componentData = this.registeredComponents.get(componentId);
    if (!componentData) {
      console.warn(`[PanelDependencyBridge] Component data not found for ${componentId}`);
      return;
    }
    
    // Remove from maps
    this.tabToComponentMap.delete(tabId);
    this.componentTypeMap.get(componentData.componentType)?.delete(tabId);
    this.registeredComponents.delete(componentId);
    this.activeComponents.delete(componentId);
    
    // Emit component unmounted event
    this.eventEmitter.emit(PanelDependencyEvents.COMPONENT_UNMOUNTED, {
      tabId,
      componentId,
      componentType: componentData.componentType
    });
    
    console.log(`[PanelDependencyBridge] Component unregistered successfully: ${componentId}`);
  }

  /**
   * Focus a component (tab activated)
   */
  public focusComponent(tabId: string): void {
    const componentId = this.tabToComponentMap.get(tabId);
    
    if (!componentId) {
      console.warn(`[PanelDependencyBridge] Cannot focus component for tabId ${tabId}: Not found`);
      return;
    }
    
    console.log(`[PanelDependencyBridge] Focusing component: ${componentId} (tabId: ${tabId})`);
    
    // Add to active components
    this.activeComponents.add(componentId);
    
    // Emit component focused event
    this.eventEmitter.emit(PanelDependencyEvents.COMPONENT_FOCUSED, {
      tabId,
      componentId
    });
  }

  /**
   * Blur a component (tab deactivated)
   */
  public blurComponent(tabId: string): void {
    const componentId = this.tabToComponentMap.get(tabId);
    
    if (!componentId) {
      console.warn(`[PanelDependencyBridge] Cannot blur component for tabId ${tabId}: Not found`);
      return;
    }
    
    console.log(`[PanelDependencyBridge] Blurring component: ${componentId} (tabId: ${tabId})`);
    
    // Remove from active components
    this.activeComponents.delete(componentId);
    
    // Emit component blurred event
    this.eventEmitter.emit(PanelDependencyEvents.COMPONENT_BLURRED, {
      tabId,
      componentId
    });
  }

  /**
   * Get the normalized component ID for a tab ID
   */
  public getComponentIdForTab(tabId: string): string | undefined {
    return this.tabToComponentMap.get(tabId);
  }

  /**
   * Find compatible dependency pairs (EMAIL_LIST -> EMAIL_DETAIL)
   */
  public findCompatiblePairs(): { providerId: string, consumerId: string }[] {
    const pairs: { providerId: string, consumerId: string }[] = [];
    
    // Get all registered EMAIL_LIST components
    const listTabs = Array.from(this.componentTypeMap.get(PanelComponentType.EMAIL_LIST) || []);
    const detailTabs = Array.from(this.componentTypeMap.get(PanelComponentType.EMAIL_DETAIL) || []);
    
    // Match each list with each detail
    for (const listTabId of listTabs) {
      const providerId = this.tabToComponentMap.get(listTabId);
      if (!providerId) continue;
      
      for (const detailTabId of detailTabs) {
        const consumerId = this.tabToComponentMap.get(detailTabId);
        if (!consumerId) continue;
        
        pairs.push({ providerId, consumerId });
      }
    }
    
    return pairs;
  }

  /**
   * Create dependencies between compatible components
   */
  public createDependenciesBetweenCompatibleComponents(): void {
    const pairs = this.findCompatiblePairs();
    console.log(`[PanelDependencyBridge] Found ${pairs.length} compatible pairs`);
    
    for (const { providerId, consumerId } of pairs) {
      // Check if dependency already exists
      const existingDeps = this.registry.getDependenciesByProvider(providerId)
        .filter(dep => dep.consumerId === consumerId);
      
      if (existingDeps.length > 0) {
        console.log(`[PanelDependencyBridge] Dependency already exists between ${providerId} and ${consumerId}`);
        continue;
      }
      
      // Create a new dependency
      const dependency = this.registry.createDependency(
        providerId,
        consumerId,
        DependencyDataTypes.EMAIL_DATA
      );
      
      if (dependency) {
        console.log(`[PanelDependencyBridge] Created new dependency: ${dependency.id}`);
        
        // Set dependency to READY state
        this.registry.updateDependencyStatus(dependency.id, DependencyStatus.READY);
        
        // Emit dependency created event
        this.eventEmitter.emit(PanelDependencyEvents.DEPENDENCY_CREATED, {
          dependencyId: dependency.id,
          providerId,
          consumerId
        });
      } else {
        console.error(`[PanelDependencyBridge] Failed to create dependency between ${providerId} and ${consumerId}`);
      }
    }
  }

  /**
   * Subscribe to bridge events
   */
  public on<T>(event: PanelDependencyEvents, callback: (data: T) => void): () => void {
    return this.eventEmitter.on(event, callback);
  }

  /**
   * Unsubscribe from bridge events
   */
  public off(event: PanelDependencyEvents, callback: Function): void {
    this.eventEmitter.off(event, callback);
  }

  /**
   * Update data for a component
   */
  public updateComponentData(tabId: string, dataType: DependencyDataTypes, data: any): void {
    const componentId = this.tabToComponentMap.get(tabId);
    
    if (!componentId) {
      console.warn(`[PanelDependencyBridge] Cannot update data for tabId ${tabId}: Not found`);
      return;
    }
    
    console.log(`[PanelDependencyBridge] Updating data for component: ${componentId} (tabId: ${tabId})`);
    
    // Update data through manager
    this.manager.updateData(componentId, dataType, data);
  }

  /**
   * DEBUG: Print the current state of the bridge
   */
  public debugState(): void {
    console.log('======= PanelDependencyBridge Debug State =======');
    console.log('Tab to Component Map:', Array.from(this.tabToComponentMap.entries()));
    
    for (const [type, tabs] of this.componentTypeMap.entries()) {
      console.log(`Component Type ${type}:`, Array.from(tabs));
    }
    
    console.log('Active Components:', Array.from(this.activeComponents));
    console.log('Registered Components:', Array.from(this.registeredComponents.entries()));
    console.log('===============================================');
  }
}

/**
 * Helper function to create a new event emitter
 */
export function createPanelDependencyBridge(registry: DependencyRegistry, manager: DependencyManager): PanelDependencyBridge {
  return PanelDependencyBridge.getInstance(registry, manager);
}