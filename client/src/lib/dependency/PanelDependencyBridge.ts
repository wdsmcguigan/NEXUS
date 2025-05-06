/**
 * PanelDependencyBridge
 * 
 * This component bridges the panel system and the dependency system,
 * allowing components in panels to register and communicate with
 * the dependency system.
 */

import { 
  DependencyDefinition, 
  DependencyStatus,
  DependencyDataTypes
} from './DependencyInterfaces';
import { EventEmitter } from '../utils/EventEmitter';
import { DependencyRegistryExtended } from './DependencyRegistryExtended';
import { DependencyManagerExtended } from './DependencyManagerExtended';

// Define the types of components supported in panels
export type PanelComponentType = 'EmailListPane' | 'EmailDetailPane' | 'TagPane' | 'SearchPane' | 'TemplatePane' | 'SettingsPane' | 'Other';

// Structure to store component/panel registration
export interface PanelComponentRegistration {
  tabId: string;
  panelId: string;
  componentType: PanelComponentType;
  componentId: string;
  isActive: boolean;
}

/**
 * Bridge between Panel system and Dependency system
 */
export class PanelDependencyBridge {
  private registry: DependencyRegistryExtended;
  private manager: DependencyManagerExtended;
  private eventEmitter: EventEmitter = new EventEmitter();
  
  // Maps to track component registrations
  private componentsByTab: Map<string, PanelComponentRegistration> = new Map();
  private componentsByPanel: Map<string, Set<string>> = new Map(); // panelId -> Set<tabId>
  private componentsByType: Map<PanelComponentType, Set<string>> = new Map(); // type -> Set<tabId>
  
  constructor(registry: DependencyRegistryExtended, manager: DependencyManagerExtended) {
    this.registry = registry;
    this.manager = manager;
    
    // Set up listeners for both systems
    this.setupListeners();
    
    console.log('[PanelDependencyBridge] Initialized');
  }
  
  /**
   * Set up event listeners for both the panel and dependency systems
   */
  private setupListeners(): void {
    // Listen for panel events
    this.on('panelTabActivated', this.handleTabActivated.bind(this));
    this.on('panelTabClosed', this.handleTabClosed.bind(this));
    this.on('panelClosed', this.handlePanelClosed.bind(this));
    this.on('componentRegister', this.handleComponentRegister.bind(this));
    this.on('componentUnregister', this.handleComponentUnregister.bind(this));
    this.on('componentFocus', this.handleComponentFocus.bind(this));
    this.on('componentBlur', this.handleComponentBlur.bind(this));
    
    // Listen for dependency system events
    this.registry.on('dependencyStatusChanged', (data: any) => {
      const { dependencyId, status } = data;
      this.emit('dependencyStatusChanged', { dependencyId, status });
      
      // If a connection is created or removed, schedule a sync
      if (status === DependencyStatus.CONNECTED || status === DependencyStatus.DISCONNECTED) {
        this.scheduleDependencySync();
      }
    });
    
    this.manager.on('dataUpdated', (data: any) => {
      const { componentId, dataType, dependencyId } = data;
      this.emit('dataUpdated', { componentId, dataType, dependencyId, data: data.data });
    });
    
    // Set up interval to check for compatible components
    setInterval(() => this.findCompatibleComponents(), 5000);
  }
  
  /**
   * Subscribe to bridge events
   */
  on<T>(eventName: string, callback: (data: T) => void): () => void {
    return this.eventEmitter.on(eventName, callback);
  }
  
  /**
   * Unsubscribe from bridge events
   */
  off(eventName: string, callback: Function): void {
    this.eventEmitter.off(eventName, callback);
  }
  
  /**
   * Emit an event from the bridge
   */
  emit<T>(eventName: string, data: T): void {
    this.eventEmitter.emit(eventName, data);
  }
  
  /**
   * Register a component with the bridge
   */
  registerComponent(
    tabId: string, 
    panelId: string, 
    componentType: PanelComponentType, 
    componentId: string
  ): void {
    // Store the registration
    this.componentsByTab.set(tabId, {
      tabId,
      panelId,
      componentType,
      componentId,
      isActive: false
    });
    
    // Add to the panel map
    if (!this.componentsByPanel.has(panelId)) {
      this.componentsByPanel.set(panelId, new Set());
    }
    this.componentsByPanel.get(panelId)!.add(tabId);
    
    // Add to the type map
    if (!this.componentsByType.has(componentType)) {
      this.componentsByType.set(componentType, new Set());
    }
    this.componentsByType.get(componentType)!.add(tabId);
    
    console.log(`[PanelDependencyBridge] Component ${componentId} registered in tab ${tabId}, panel ${panelId}`);
    
    // Emit event
    this.emit('componentRegistered', { tabId, panelId, componentType, componentId });
    
    // Schedule a check for compatible components
    this.scheduleDependencySync();
  }
  
  /**
   * Unregister a component from the bridge
   */
  unregisterComponent(tabId: string): void {
    const registration = this.componentsByTab.get(tabId);
    
    if (!registration) {
      return;
    }
    
    const { panelId, componentType, componentId } = registration;
    
    // Remove from the tab map
    this.componentsByTab.delete(tabId);
    
    // Remove from the panel map
    if (this.componentsByPanel.has(panelId)) {
      this.componentsByPanel.get(panelId)!.delete(tabId);
      
      if (this.componentsByPanel.get(panelId)!.size === 0) {
        this.componentsByPanel.delete(panelId);
      }
    }
    
    // Remove from the type map
    if (this.componentsByType.has(componentType)) {
      this.componentsByType.get(componentType)!.delete(tabId);
      
      if (this.componentsByType.get(componentType)!.size === 0) {
        this.componentsByType.delete(componentType);
      }
    }
    
    console.log(`[PanelDependencyBridge] Component ${componentId} unregistered from tab ${tabId}`);
    
    // Emit event
    this.emit('componentUnregistered', { tabId, panelId, componentType, componentId });
  }
  
  /**
   * Handle a tab becoming active
   */
  private handleTabActivated(data: { tabId: string, panelId: string }): void {
    const { tabId, panelId } = data;
    const registration = this.componentsByTab.get(tabId);
    
    if (!registration) {
      console.warn(`[PanelDependencyBridge] Cannot activate tab ${tabId} in panel ${panelId}: Not registered`);
      return;
    }
    
    // Update active state
    registration.isActive = true;
    
    // Mark other tabs in the same panel as inactive
    if (this.componentsByPanel.has(panelId)) {
      for (const otherTabId of this.componentsByPanel.get(panelId)!) {
        if (otherTabId !== tabId) {
          const otherRegistration = this.componentsByTab.get(otherTabId);
          
          if (otherRegistration) {
            otherRegistration.isActive = false;
          }
        }
      }
    }
    
    console.log(`[PanelDependencyBridge] Tab ${tabId} activated in panel ${panelId}`);
    
    // Focus the component
    this.focusComponent(tabId);
  }
  
  /**
   * Handle a tab being closed
   */
  private handleTabClosed(data: { tabId: string }): void {
    const { tabId } = data;
    this.unregisterComponent(tabId);
  }
  
  /**
   * Handle a panel being closed
   */
  private handlePanelClosed(data: { panelId: string }): void {
    const { panelId } = data;
    
    if (!this.componentsByPanel.has(panelId)) {
      return;
    }
    
    // Copy the set to avoid modification during iteration
    const tabIds = Array.from(this.componentsByPanel.get(panelId)!);
    
    // Unregister all components in the panel
    for (const tabId of tabIds) {
      this.unregisterComponent(tabId);
    }
    
    console.log(`[PanelDependencyBridge] Panel ${panelId} closed`);
  }
  
  /**
   * Focus a component
   */
  private focusComponent(tabId: string): void {
    const registration = this.componentsByTab.get(tabId);
    
    if (!registration) {
      console.warn(`[PanelDependencyBridge] Cannot focus component for tabId ${tabId}: Not found`);
      return;
    }
    
    const { componentId } = registration;
    
    // Emit an event for this
    this.emit('componentFocused', { tabId, componentId });
    
    console.log(`[PanelDependencyBridge] Component ${componentId} focused`);
  }
  
  /**
   * Handle component registration from React component
   */
  private handleComponentRegister(data: { 
    tabId: string, 
    panelId: string, 
    componentType: PanelComponentType, 
    componentId: string 
  }): void {
    const { tabId, panelId, componentType, componentId } = data;
    this.registerComponent(tabId, panelId, componentType, componentId);
  }
  
  /**
   * Handle component unregistration from React component
   */
  private handleComponentUnregister(data: { tabId: string }): void {
    const { tabId } = data;
    this.unregisterComponent(tabId);
  }
  
  /**
   * Handle component focus from React component
   */
  private handleComponentFocus(data: { tabId: string }): void {
    const { tabId } = data;
    
    const registration = this.componentsByTab.get(tabId);
    
    if (!registration) {
      console.warn(`[PanelDependencyBridge] Cannot focus component for tabId ${tabId}: Not found`);
      return;
    }
    
    // Set as active
    registration.isActive = true;
    
    // Focus the component
    this.focusComponent(tabId);
  }
  
  /**
   * Handle component blur from React component
   */
  private handleComponentBlur(data: { tabId: string }): void {
    const { tabId } = data;
    
    const registration = this.componentsByTab.get(tabId);
    
    if (!registration) {
      return;
    }
    
    // Set as inactive
    registration.isActive = false;
    
    // Emit an event
    this.emit('componentBlurred', { tabId, componentId: registration.componentId });
  }
  
  /**
   * Schedule a check for compatible components
   */
  private scheduleDependencySync(): void {
    // Use setTimeout to debounce the operation
    setTimeout(() => this.findCompatibleComponents(), 500);
  }
  
  /**
   * Find compatible components that could be connected
   * Public method that can be called from PanelDependencyContext
   */
  findCompatibleComponents(): void {
    // Scan for potential email pane pairs to connect
    const emailListPanes = Array.from(this.componentsByType.get('EmailListPane') || [])
      .map(tabId => this.componentsByTab.get(tabId))
      .filter(Boolean) as PanelComponentRegistration[];
    
    const emailDetailPanes = Array.from(this.componentsByType.get('EmailDetailPane') || [])
      .map(tabId => this.componentsByTab.get(tabId))
      .filter(Boolean) as PanelComponentRegistration[];
    
    // Look for active pairs
    const activePairs: Array<[PanelComponentRegistration, PanelComponentRegistration]> = [];
    
    for (const listPane of emailListPanes) {
      for (const detailPane of emailDetailPanes) {
        if (listPane.isActive && detailPane.isActive) {
          activePairs.push([listPane, detailPane]);
        }
      }
    }
    
    console.log(`[PanelDependencyBridge] Found ${activePairs.length} compatible pairs`);
    
    // Suggest connections for these pairs
    for (const [listPane, detailPane] of activePairs) {
      // Check if they're already connected
      const existingDependencies = this.registry.getDependenciesByProvider(listPane.componentId)
        .filter(dep => dep.consumerId === detailPane.componentId && dep.dataType === DependencyDataTypes.EMAIL);
      
      if (existingDependencies.length === 0) {
        // No existing connection, suggest one
        this.suggestConnection(listPane.componentId, detailPane.componentId);
        
        // Automatically create the connection after suggesting it
        // This is more aggressive than just suggesting but ensures data flows
        console.log(`[PanelDependencyBridge] Auto-creating connection from ${listPane.componentId} to ${detailPane.componentId}`);
        this.createConnection(listPane.componentId, detailPane.componentId, DependencyDataTypes.EMAIL);
      }
    }
    
    // Update UI to reflect connection status
    this.emit('compatibleComponentsUpdated', { pairs: activePairs });
  }
  
  /**
   * Suggest a connection between two components
   * Public so it can be called from PanelDependencyContext
   */
  suggestConnection(providerId: string, consumerId: string): void {
    // Emit event to suggest a connection
    this.emit('connectionSuggested', { 
      providerId, 
      consumerId, 
      dataType: DependencyDataTypes.EMAIL 
    });
    
    console.log(`[PanelDependencyBridge] Suggesting connection from ${providerId} to ${consumerId}`);
  }
  
  /**
   * Create a connection between components
   */
  createConnection(
    providerId: string, 
    consumerId: string, 
    dataType: DependencyDataTypes = DependencyDataTypes.EMAIL
  ): void {
    // Check if the components exist
    const providerRegistration = Array.from(this.componentsByTab.values())
      .find(reg => reg.componentId === providerId);
    
    const consumerRegistration = Array.from(this.componentsByTab.values())
      .find(reg => reg.componentId === consumerId);
    
    if (!providerRegistration || !consumerRegistration) {
      console.warn(`[PanelDependencyBridge] Cannot create connection: Component not found`);
      return;
    }
    
    // Find matching definitions
    const providerDefinitions = this.registry.getDefinitionsByComponent(providerId)
      .filter(def => def.role === 'provider' && def.dataType === dataType);
    
    const consumerDefinitions = this.registry.getDefinitionsByComponent(consumerId)
      .filter(def => def.role === 'consumer' && def.dataType === dataType);
    
    if (providerDefinitions.length === 0 || consumerDefinitions.length === 0) {
      console.warn(`[PanelDependencyBridge] Cannot create connection: No matching definitions found`);
      return;
    }
    
    // Create the dependency
    const dependency = this.registry.createDependency(providerDefinitions[0].id, consumerDefinitions[0].id);
    
    console.log(`[PanelDependencyBridge] Created connection: ${dependency.id}`);
    
    // Emit event
    this.emit('connectionCreated', { 
      dependencyId: dependency.id, 
      providerId, 
      consumerId, 
      dataType 
    });
  }
  
  /**
   * Get active components by type
   */
  getActiveComponentsByType(type: PanelComponentType): string[] {
    const components: string[] = [];
    
    if (this.componentsByType.has(type)) {
      for (const tabId of this.componentsByType.get(type)!) {
        const registration = this.componentsByTab.get(tabId);
        
        if (registration && registration.isActive) {
          components.push(registration.componentId);
        }
      }
    }
    
    return components;
  }
  
  /**
   * Get all registered component IDs
   */
  getAllComponentIds(): string[] {
    return Array.from(this.componentsByTab.values()).map(reg => reg.componentId);
  }
  
  /**
   * Debug - get registration info for a tab
   */
  getRegistrationForTab(tabId: string): PanelComponentRegistration | undefined {
    return this.componentsByTab.get(tabId);
  }
  
  /**
   * Debug - get registration info for a component
   */
  getRegistrationForComponent(componentId: string): PanelComponentRegistration | undefined {
    return Array.from(this.componentsByTab.values())
      .find(reg => reg.componentId === componentId);
  }
  
  /**
   * Debug - get all registrations
   */
  getAllRegistrations(): PanelComponentRegistration[] {
    return Array.from(this.componentsByTab.values());
  }
}