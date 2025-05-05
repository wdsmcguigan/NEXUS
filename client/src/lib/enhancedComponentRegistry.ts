import React from 'react';
import { LucideIcon } from 'lucide-react';
import { nanoid } from 'nanoid';
import { dependencyRegistry } from './dependency/DependencyRegistry';
import { DependencySyncStrategy } from './dependency/DependencyInterfaces';
import { ComponentType } from './communication/ComponentCommunication';

/**
 * Component priority levels for sorting in menus and component selection interfaces
 */
export enum ComponentPriority {
  CRITICAL = 100,
  HIGH = 75,
  NORMAL = 50,
  LOW = 25,
}

/**
 * Panel types where components can be placed
 */
export type PanelType = 'main' | 'sidebar' | 'bottom' | 'any';

/**
 * Component categories for organization in the component selector
 */
export type ComponentCategory = 
  | 'email' 
  | 'productivity' 
  | 'settings' 
  | 'utility' 
  | 'tags'
  | 'calendar' 
  | 'tasks' 
  | 'contacts' 
  | 'notes' 
  | 'browser' 
  | 'files'
  | 'search'
  | 'tools';

/**
 * Visibility levels for components
 */
export enum ComponentVisibility {
  ALWAYS = 'always',    // Always shown in component lists
  DEFAULT = 'default',  // Shown by default
  ADVANCED = 'advanced' // Only shown in advanced or full component lists
}

/**
 * Component state persistence options
 */
export enum StatePersistence {
  NONE = 'none',      // State is not persisted
  SESSION = 'session', // State is persisted for the current session
  LOCAL = 'local',     // State is persisted in local storage
  SYNC = 'sync'        // State is synced with the server
}

/**
 * Search capability levels for components
 */
export enum SearchCapability {
  NONE = 'none',         // Component does not support search
  BASIC = 'basic',       // Component supports basic text search
  ADVANCED = 'advanced', // Component supports advanced search with filters
  FULL = 'full'          // Component supports full search capabilities including saved searches
}

/**
 * Component permission requirements
 */
export interface ComponentPermissions {
  read?: boolean;      // Can read data
  write?: boolean;     // Can write data
  delete?: boolean;    // Can delete data
  share?: boolean;     // Can share data
  admin?: boolean;     // Has admin privileges
  custom?: string[];   // Custom permissions
}

/**
 * Component integration points
 */
export interface IntegrationPoints {
  events: string[];          // Events this component emits or listens to
  dataProvider?: boolean;    // Component can provide data to others
  dataConsumer?: boolean;    // Component consumes data from others
  contextProvider?: boolean; // Component provides context to others
  contextConsumer?: boolean; // Component consumes context from others
  apis?: string[];           // External APIs this component interacts with
}

/**
 * Component dependency capabilities
 */
export interface DependencyCapabilities {
  // Component can act as a provider in the dependency system
  canBeSource: boolean;
  
  // Component can act as a consumer in the dependency system
  canBeDependent: boolean;
  
  // Types of data this component can provide to others
  providesData?: string[];
  
  // Types of data this component can consume from others
  consumesData?: string[];
  
  // Data transformers for different data types
  dataTransformers?: Record<string, (data: any) => any>;
  
  // Data validators for different data types
  dataValidators?: Record<string, (data: any) => boolean>;
  
  // Enable automatic dependency discovery for this component
  autoDiscoverDependencies?: boolean;
  
  // Enable automatic dependency resolution when compatible dependencies are found
  autoResolveDependencies?: boolean;
}

/**
 * Component update and notification settings
 */
export interface ComponentUpdateSettings {
  realtime?: boolean;           // Component supports real-time updates
  pollingInterval?: number;     // How often to poll for updates (in ms)
  notificationSupport?: boolean; // Component can display notifications
  suppressNotifications?: boolean; // Component should suppress notifications
}

/**
 * Extended component configuration options
 */
export interface ComponentConfig {
  autosave?: boolean;           // Automatically save component state
  saveInterval?: number;        // Interval for autosave (in ms)
  initializeWithData?: boolean; // Component should be initialized with data
  defaultFilters?: Record<string, any>; // Default filters to apply
  theme?: 'system' | 'light' | 'dark'; // Component theme override
  layout?: 'compact' | 'default' | 'extended'; // Component layout
  refreshOnMount?: boolean;     // Refresh data when component mounts
  refreshOnFocus?: boolean;     // Refresh data when component gets focus
  customOptions?: Record<string, any>; // Additional component-specific options
}

/**
 * Expanded definition of a component
 */
export interface EnhancedComponentDefinition {
  // Core properties
  id: string;                              // Unique identifier
  displayName: string;                     // User-friendly name
  description?: string;                    // Component description
  category: ComponentCategory;             // Component category
  tags?: string[];                         // Tags for filtering/search
  version?: string;                        // Component version
  
  // Visual properties
  icon?: LucideIcon;                       // Icon for display in UI
  color?: string;                          // Associated color
  
  // Component implementation
  component: React.ComponentType<any>;     // The actual component
  wrapper?: React.ComponentType<any>;      // Optional wrapper component
  
  // Placement and restrictions
  supportedPanelTypes?: PanelType[];       // Where component can be placed
  singleton?: boolean;                     // Only one instance can exist
  maxInstances?: number;                   // Maximum instances allowed
  minSize?: { width: number, height: number }; // Minimum size
  defaultSize?: { width: number, height: number }; // Default size
  
  // Priority and visibility
  priority?: ComponentPriority;            // Display priority
  visibility?: ComponentVisibility;        // Visibility in component lists
  
  // State management
  statePersistence?: StatePersistence;     // How state is persisted
  initialState?: Record<string, any>;      // Initial state
  
  // Search integration
  searchCapability?: SearchCapability;     // Search capabilities
  searchAdapter?: any;                     // Search adapter (if applicable)
  
  // Security and permissions
  permissions?: ComponentPermissions;      // Required permissions
  authentication?: boolean;                // Requires authentication
  
  // Integration capabilities
  integrations?: IntegrationPoints;        // Integration points
  
  // Dependency system capabilities
  dependencyCapabilities?: DependencyCapabilities; // Dependency system capabilities
  
  // Update and notification settings
  updateSettings?: ComponentUpdateSettings; // Update settings
  
  // Configuration
  defaultConfig?: ComponentConfig;         // Default configuration
  supportedConfig?: string[];              // Supported configuration options
  requiredConfig?: string[];               // Required configuration options
  
  // Lifecycle hooks
  onMount?: (instanceId: string, config?: any) => void;
  onUnmount?: (instanceId: string) => void;
  onFocus?: (instanceId: string) => void;
  onBlur?: (instanceId: string) => void;
  
  // Feature flags
  featureFlags?: string[];                 // Required feature flags
}

/**
 * Component instance with specific runtime information
 */
export interface ComponentInstance {
  instanceId: string;               // Unique instance identifier
  componentId: string;              // Component definition ID
  panelId: string;                  // Panel containing this component
  tabId: string;                    // Tab containing this component
  config?: ComponentConfig;         // Instance-specific configuration
  state?: Record<string, any>;      // Current component state
  context?: Record<string, any>;    // Context data for this instance
  lastActive?: Date;                // When this instance was last active
  created?: Date;                   // When this instance was created
}

/**
 * Expanded registry to store all available components
 */
class EnhancedComponentRegistry {
  private components: Map<string, EnhancedComponentDefinition> = new Map();
  private instances: Map<string, ComponentInstance> = new Map();
  private eventBus: Map<string, Set<(data?: any) => void>> = new Map();

  /**
   * Register a component that can be opened in tabs
   */
  register(componentDef: EnhancedComponentDefinition): void {
    if (this.components.has(componentDef.id)) {
      console.warn(`Component with ID ${componentDef.id} is already registered. It will be overwritten.`);
    }
    // Set default values for optional properties
    const componentWithDefaults: EnhancedComponentDefinition = {
      priority: ComponentPriority.NORMAL,
      visibility: ComponentVisibility.DEFAULT,
      statePersistence: StatePersistence.NONE,
      searchCapability: SearchCapability.NONE,
      ...componentDef
    };
    
    this.components.set(componentDef.id, componentWithDefaults);
    
    // Register component dependency capabilities if provided
    if (componentDef.dependencyCapabilities) {
      this.registerComponentDependencyCapabilities(componentDef);
    }
  }
  
  /**
   * Register component dependency capabilities with the dependency system
   */
  private registerComponentDependencyCapabilities(componentDef: EnhancedComponentDefinition): void {
    const capabilities = componentDef.dependencyCapabilities;
    
    if (!capabilities) return;
    
    // Register as a provider (source) if applicable
    if (capabilities.canBeSource && capabilities.providesData?.length) {
      capabilities.providesData.forEach(dataType => {
        // For each data type this component provides, register a dependency definition
        dependencyRegistry.defineComponentDependency({
          id: `${componentDef.id}-provider-${dataType}`,
          name: `${componentDef.displayName} ${dataType} Provider`,
          description: `${componentDef.displayName} can provide ${dataType} data to other components`,
          providerType: componentDef.id as ComponentType,
          consumerType: '*' as ComponentType, // Can provide to any compatible component
          dataType: dataType,
          syncStrategy: DependencySyncStrategy.PUSH, // Default to push strategy
          isRequired: false,
          isOneToMany: true, // One provider can serve many consumers
          isManyToOne: false,
          transformData: capabilities.dataTransformers?.[dataType],
          validateData: capabilities.dataValidators?.[dataType],
          createdAt: Date.now()
        });
      });
    }
    
    // Register as a consumer (dependent) if applicable
    if (capabilities.canBeDependent && capabilities.consumesData?.length) {
      capabilities.consumesData.forEach(dataType => {
        // For each data type this component consumes, register a dependency definition
        dependencyRegistry.defineComponentDependency({
          id: `${componentDef.id}-consumer-${dataType}`,
          name: `${componentDef.displayName} ${dataType} Consumer`,
          description: `${componentDef.displayName} can consume ${dataType} data from other components`,
          providerType: '*' as ComponentType, // Can consume from any compatible component
          consumerType: componentDef.id as ComponentType,
          dataType: dataType,
          syncStrategy: DependencySyncStrategy.PULL, // Default to pull strategy
          isRequired: false,
          isOneToMany: false,
          isManyToOne: true, // Many providers can serve one consumer
          transformData: capabilities.dataTransformers?.[dataType],
          validateData: capabilities.dataValidators?.[dataType],
          createdAt: Date.now()
        });
      });
    }
  }

  /**
   * Get a component by its ID
   */
  getComponent(id: string): EnhancedComponentDefinition | undefined {
    return this.components.get(id);
  }

  /**
   * Get all registered components
   */
  getAllComponents(): EnhancedComponentDefinition[] {
    return Array.from(this.components.values());
  }

  /**
   * Get components by category
   */
  getComponentsByCategory(category: ComponentCategory): EnhancedComponentDefinition[] {
    return this.getAllComponents().filter(comp => comp.category === category);
  }

  /**
   * Get components by tag
   */
  getComponentsByTag(tag: string): EnhancedComponentDefinition[] {
    return this.getAllComponents().filter(
      comp => comp.tags && comp.tags.includes(tag)
    );
  }

  /**
   * Get components suitable for a specific panel type
   */
  getComponentsForPanelType(panelType: PanelType): EnhancedComponentDefinition[] {
    return this.getAllComponents().filter(comp => {
      if (!comp.supportedPanelTypes) return true; // No restrictions
      return comp.supportedPanelTypes.includes(panelType) || comp.supportedPanelTypes.includes('any');
    });
  }

  /**
   * Get components by visibility level
   */
  getComponentsByVisibility(visibility: ComponentVisibility): EnhancedComponentDefinition[] {
    // When requesting DEFAULT, also include ALWAYS
    if (visibility === ComponentVisibility.DEFAULT) {
      return this.getAllComponents().filter(comp => 
        comp.visibility === ComponentVisibility.DEFAULT || 
        comp.visibility === ComponentVisibility.ALWAYS
      );
    }
    // When requesting ADVANCED, include all
    if (visibility === ComponentVisibility.ADVANCED) {
      return this.getAllComponents();
    }
    // Otherwise, just match exactly
    return this.getAllComponents().filter(comp => comp.visibility === visibility);
  }

  /**
   * Get components with specific search capability
   */
  getComponentsBySearchCapability(capability: SearchCapability): EnhancedComponentDefinition[] {
    return this.getAllComponents().filter(comp => comp.searchCapability === capability);
  }
  
  /**
   * Get components that can act as dependency sources
   */
  getSourceComponents(): EnhancedComponentDefinition[] {
    return this.getAllComponents().filter(comp => 
      comp.dependencyCapabilities?.canBeSource === true
    );
  }
  
  /**
   * Get components that can act as dependency consumers
   */
  getDependentComponents(): EnhancedComponentDefinition[] {
    return this.getAllComponents().filter(comp => 
      comp.dependencyCapabilities?.canBeDependent === true
    );
  }
  
  /**
   * Get components that can provide a specific data type
   */
  getComponentsByProvidedDataType(dataType: string): EnhancedComponentDefinition[] {
    return this.getAllComponents().filter(comp => 
      comp.dependencyCapabilities?.providesData?.includes(dataType)
    );
  }
  
  /**
   * Get components that can consume a specific data type
   */
  getComponentsByConsumedDataType(dataType: string): EnhancedComponentDefinition[] {
    return this.getAllComponents().filter(comp => 
      comp.dependencyCapabilities?.consumesData?.includes(dataType)
    );
  }
  
  /**
   * Check if a component exists
   */
  hasComponent(id: string): boolean {
    return this.components.has(id);
  }

  /**
   * Create a new instance of a component
   */
  createInstance(componentId: string, panelId: string, tabId: string, config?: ComponentConfig): ComponentInstance | undefined {
    const component = this.getComponent(componentId);
    if (!component) {
      console.error(`Cannot create instance: Component ${componentId} not found`);
      return undefined;
    }

    // Check if component is singleton and already has instances
    if (component.singleton) {
      const instances = this.getInstancesByComponentId(componentId);
      if (instances.length > 0) {
        console.warn(`Singleton component ${componentId} already has an instance. Returning existing instance.`);
        return instances[0];
      }
    }

    // Check if component has reached max instances
    if (component.maxInstances !== undefined) {
      const instances = this.getInstancesByComponentId(componentId);
      if (instances.length >= component.maxInstances) {
        console.error(`Cannot create instance: Component ${componentId} has reached maximum instances (${component.maxInstances})`);
        return undefined;
      }
    }

    // Create instance with merged configuration
    const instanceConfig = {
      ...component.defaultConfig,
      ...config
    };

    const instance: ComponentInstance = {
      instanceId: `${componentId}-${nanoid(8)}`,
      componentId,
      panelId,
      tabId,
      config: instanceConfig,
      created: new Date(),
      lastActive: new Date()
    };

    this.instances.set(instance.instanceId, instance);

    // Call mount hook if available
    if (component.onMount) {
      component.onMount(instance.instanceId, instanceConfig);
    }

    // Auto-discover dependencies if supported by the component
    if (component.dependencyCapabilities?.autoDiscoverDependencies) {
      this.setupAutomaticDependencies(instance);
    }

    return instance;
  }
  
  /**
   * Setup automatic dependencies for a new component instance
   */
  private setupAutomaticDependencies(instance: ComponentInstance): void {
    const component = this.getComponent(instance.componentId);
    
    if (!component || !component.dependencyCapabilities) {
      return;
    }
    
    // If component is a dependency consumer, try to find matching providers
    if (component.dependencyCapabilities.canBeDependent && 
        component.dependencyCapabilities.consumesData) {
      
      for (const dataType of component.dependencyCapabilities.consumesData) {
        // Find potential provider instances for this data type
        this.findAndConnectProvider(instance, dataType);
      }
    }
  }
  
  /**
   * Find a suitable provider for a consumer instance for a specific data type
   */
  private findAndConnectProvider(consumerInstance: ComponentInstance, dataType: string): void {
    // Get all potential provider component types
    const providerComponents = this.getComponentsByProvidedDataType(dataType);
    
    if (!providerComponents.length) {
      return; // No provider components available
    }
    
    // Find active instances of potential providers (currently in tabs)
    const potentialProviderInstances: ComponentInstance[] = [];
    
    for (const providerComponent of providerComponents) {
      const instances = this.getInstancesByComponentId(providerComponent.id);
      potentialProviderInstances.push(...instances);
    }
    
    if (!potentialProviderInstances.length) {
      return; // No provider instances available
    }
    
    // Select the most appropriate provider
    // For now, just take the first available provider
    // In a more sophisticated implementation, we could:
    // - Prefer providers in the same panel
    // - Prefer recently active providers
    // - Use component-specific rules for selection
    const providerInstance = potentialProviderInstances[0];
    
    // Create a dependency relationship in the registry
    dependencyRegistry.createDependency(
      providerInstance.instanceId,
      consumerInstance.instanceId,
      dataType,
      {
        isActive: true,
        autoUpdate: true,
        notifyOnChange: true,
        options: {}
      }
    );
  }

  /**
   * Get a component instance by its ID
   */
  getInstance(instanceId: string): ComponentInstance | undefined {
    return this.instances.get(instanceId);
  }

  /**
   * Get all instances for a specific component
   */
  getInstancesByComponentId(componentId: string): ComponentInstance[] {
    return Array.from(this.instances.values()).filter(
      instance => instance.componentId === componentId
    );
  }

  /**
   * Get all instances in a specific panel
   */
  getInstancesByPanelId(panelId: string): ComponentInstance[] {
    return Array.from(this.instances.values()).filter(
      instance => instance.panelId === panelId
    );
  }

  /**
   * Get the instance in a specific tab
   */
  getInstanceByTabId(tabId: string): ComponentInstance | undefined {
    return Array.from(this.instances.values()).find(
      instance => instance.tabId === tabId
    );
  }

  /**
   * Update an instance's configuration
   */
  updateInstanceConfig(instanceId: string, config: Partial<ComponentConfig>): boolean {
    const instance = this.getInstance(instanceId);
    if (!instance) {
      console.error(`Cannot update config: Instance ${instanceId} not found`);
      return false;
    }

    instance.config = {
      ...instance.config,
      ...config
    };

    instance.lastActive = new Date();
    this.instances.set(instanceId, instance);
    return true;
  }

  /**
   * Update an instance's state
   */
  updateInstanceState(instanceId: string, state: Record<string, any>): boolean {
    const instance = this.getInstance(instanceId);
    if (!instance) {
      console.error(`Cannot update state: Instance ${instanceId} not found`);
      return false;
    }

    instance.state = {
      ...instance.state,
      ...state
    };

    instance.lastActive = new Date();
    this.instances.set(instanceId, instance);
    return true;
  }

  /**
   * Delete a component instance
   */
  deleteInstance(instanceId: string): boolean {
    const instance = this.getInstance(instanceId);
    if (!instance) {
      console.error(`Cannot delete instance: Instance ${instanceId} not found`);
      return false;
    }

    // Call unmount hook if available
    const component = this.getComponent(instance.componentId);
    if (component?.onUnmount) {
      component.onUnmount(instanceId);
    }

    this.instances.delete(instanceId);
    return true;
  }

  /**
   * Focus a component instance
   */
  focusInstance(instanceId: string): boolean {
    const instance = this.getInstance(instanceId);
    if (!instance) {
      console.error(`Cannot focus instance: Instance ${instanceId} not found`);
      return false;
    }

    // Call focus hook if available
    const component = this.getComponent(instance.componentId);
    if (component?.onFocus) {
      component.onFocus(instanceId);
    }

    instance.lastActive = new Date();
    this.instances.set(instanceId, instance);
    return true;
  }

  /**
   * Blur a component instance
   */
  blurInstance(instanceId: string): boolean {
    const instance = this.getInstance(instanceId);
    if (!instance) {
      console.error(`Cannot blur instance: Instance ${instanceId} not found`);
      return false;
    }

    // Call blur hook if available
    const component = this.getComponent(instance.componentId);
    if (component?.onBlur) {
      component.onBlur(instanceId);
    }

    return true;
  }

  /**
   * Subscribe to an event
   */
  subscribe(eventName: string, callback: (data?: any) => void): () => void {
    if (!this.eventBus.has(eventName)) {
      this.eventBus.set(eventName, new Set());
    }

    this.eventBus.get(eventName)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.eventBus.get(eventName);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.eventBus.delete(eventName);
        }
      }
    };
  }

  /**
   * Publish an event
   */
  publish(eventName: string, data?: any): void {
    const callbacks = this.eventBus.get(eventName);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event handler for ${eventName}:`, error);
        }
      });
    }
  }

  /**
   * Get a list of all supported events across all components
   */
  getSupportedEvents(): string[] {
    const events = new Set<string>();
    
    this.getAllComponents().forEach(component => {
      if (component.integrations?.events) {
        component.integrations.events.forEach(event => {
          events.add(event);
        });
      }
    });
    
    return Array.from(events);
  }
}

// Create and export a singleton instance
export const enhancedComponentRegistry = new EnhancedComponentRegistry();

// Helper function to create a component definition with standard parameters
export function defineEnhancedComponent(
  componentDef: EnhancedComponentDefinition
): EnhancedComponentDefinition {
  enhancedComponentRegistry.register(componentDef);
  return componentDef;
}

/**
 * HOC to create a wrapped component with standard panel features
 */
export function withComponentWrapper<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    id: string;
    displayName: string;
    supportSearch?: boolean;
    supportToolbar?: boolean;
    persistState?: StatePersistence;
  }
): React.FC<P & { instanceId: string }> {
  // This would be a proper implementation in a real app
  // For now, we'll just return the component itself
  return (props: P & { instanceId: string }) => {
    return <Component {...props} />;
  };
}

export default enhancedComponentRegistry;