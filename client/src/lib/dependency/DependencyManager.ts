/**
 * DependencyManager class for the Component Dependency System
 * 
 * This class handles runtime dependency instances between components,
 * manages their lifecycle, and facilitates data flow between components.
 */

import { nanoid } from 'nanoid';
import { eventBus } from '../communication/EventBus';
import { componentCommunication, ComponentType } from '../communication/ComponentCommunication';
import { 
  DependencyInstance, 
  DependencyDefinition,
  DependencyConfig,
  DependencyDataUpdateEvent,
  DependencyDataRequest,
  DependencyStatus,
  DependencySyncStrategy
} from './DependencyInterfaces';
import { dependencyRegistry } from './DependencyRegistry';

/**
 * Events emitted by the DependencyManager
 */
export enum DependencyManagerEvent {
  DEPENDENCY_CREATED = 'dependency-instance:created',
  DEPENDENCY_UPDATED = 'dependency-instance:updated',
  DEPENDENCY_REMOVED = 'dependency-instance:removed',
  DEPENDENCY_DATA_UPDATED = 'dependency-instance:data-updated',
  DEPENDENCY_DATA_REQUESTED = 'dependency-instance:data-requested',
  DEPENDENCY_STATUS_CHANGED = 'dependency-instance:status-changed',
  DEPENDENCY_ERROR = 'dependency-instance:error'
}

/**
 * Manager for runtime dependency instances
 */
export class DependencyManager {
  private static instance: DependencyManager;
  
  /**
   * Map of dependency instances by ID
   */
  private instances: Map<string, DependencyInstance> = new Map();
  
  /**
   * Map of provider component IDs to dependency instance IDs
   */
  private providerToDependencyMap: Map<string, Set<string>> = new Map();
  
  /**
   * Map of consumer component IDs to dependency instance IDs
   */
  private consumerToDependencyMap: Map<string, Set<string>> = new Map();
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {}
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): DependencyManager {
    if (!DependencyManager.instance) {
      DependencyManager.instance = new DependencyManager();
    }
    
    return DependencyManager.instance;
  }
  
  /**
   * Initialize the manager
   */
  public initialize(): void {
    this.setupEventListeners();
  }
  
  /**
   * Create a dependency between a provider and consumer component
   * 
   * @param definitionId ID of the dependency definition
   * @param providerId ID of the provider component instance
   * @param consumerId ID of the consumer component instance
   * @param config Configuration for the dependency
   * @returns The ID of the created dependency instance
   */
  public createDependency(
    definitionId: string,
    providerId: string,
    consumerId: string,
    config?: Partial<DependencyConfig>
  ): string {
    // Get dependency definition
    const definition = dependencyRegistry.getDependency(definitionId);
    
    if (!definition) {
      throw new Error(`Dependency definition not found: ${definitionId}`);
    }
    
    // Get component metadata
    const providerMetadata = componentCommunication.getComponent(providerId);
    const consumerMetadata = componentCommunication.getComponent(consumerId);
    
    if (!providerMetadata) {
      throw new Error(`Provider component not found: ${providerId}`);
    }
    
    if (!consumerMetadata) {
      throw new Error(`Consumer component not found: ${consumerId}`);
    }
    
    // Verify component types match the dependency definition
    if (providerMetadata.componentType !== definition.providerType) {
      throw new Error(
        `Provider component type mismatch: expected ${definition.providerType}, ` +
        `got ${providerMetadata.componentType}`
      );
    }
    
    if (consumerMetadata.componentType !== definition.consumerType) {
      throw new Error(
        `Consumer component type mismatch: expected ${definition.consumerType}, ` +
        `got ${consumerMetadata.componentType}`
      );
    }
    
    // Create default configuration
    const defaultConfig: DependencyConfig = {
      definitionId,
      options: {},
      autoUpdate: true
    };
    
    // Apply default values from definition configuration options
    if (definition.configOptions) {
      for (const option of definition.configOptions) {
        if (option.defaultValue !== undefined) {
          defaultConfig.options[option.key] = option.defaultValue;
        }
      }
    }
    
    // Merge with provided configuration
    const mergedConfig: DependencyConfig = {
      ...defaultConfig,
      ...config,
      options: {
        ...defaultConfig.options,
        ...(config?.options || {})
      }
    };
    
    // Validate configuration
    this.validateDependencyConfig(definition, mergedConfig);
    
    // Check if the dependency already exists
    const existingDependency = this.findDependency(providerId, consumerId, definitionId);
    
    if (existingDependency) {
      // Update the existing dependency
      this.updateDependencyConfig(existingDependency.id, mergedConfig);
      return existingDependency.id;
    }
    
    // Generate an ID for the new dependency
    const id = nanoid();
    
    // Create the dependency instance
    const instance: DependencyInstance = {
      id,
      definitionId,
      providerId,
      consumerId,
      providerType: definition.providerType,
      consumerType: definition.consumerType,
      config: mergedConfig,
      isActive: true,
      isReady: true,
      lastUpdated: Date.now()
    };
    
    // Store the instance
    this.instances.set(id, instance);
    
    // Update lookup maps
    this.addToProviderMap(providerId, id);
    this.addToConsumerMap(consumerId, id);
    
    // Emit creation event
    eventBus.publish(
      DependencyManagerEvent.DEPENDENCY_CREATED,
      { instance }
    );
    
    // If the provider should push data, set up a data handler
    if (
      definition.syncStrategy === DependencySyncStrategy.PUSH || 
      definition.syncStrategy === DependencySyncStrategy.BOTH
    ) {
      this.setupDataPushHandler(instance);
    }
    
    // If initial data is needed, request it
    this.requestInitialData(instance);
    
    return id;
  }
  
  /**
   * Update a dependency instance's configuration
   * 
   * @param id ID of the dependency instance
   * @param config New configuration
   * @returns Whether the update was successful
   */
  public updateDependencyConfig(
    id: string, 
    config: Partial<DependencyConfig>
  ): boolean {
    const instance = this.instances.get(id);
    
    if (!instance) {
      console.error(`Cannot update dependency instance: ID ${id} not found`);
      return false;
    }
    
    const definition = dependencyRegistry.getDependency(instance.definitionId);
    
    if (!definition) {
      console.error(`Cannot update dependency instance: definition ${instance.definitionId} not found`);
      return false;
    }
    
    // Create updated configuration
    const updatedConfig: DependencyConfig = {
      ...instance.config,
      ...config,
      options: {
        ...instance.config.options,
        ...(config.options || {})
      }
    };
    
    // Validate the updated configuration
    try {
      this.validateDependencyConfig(definition, updatedConfig);
    } catch (error) {
      console.error('Invalid dependency configuration update:', error);
      return false;
    }
    
    // Update the instance
    const updatedInstance: DependencyInstance = {
      ...instance,
      config: updatedConfig,
      lastUpdated: Date.now()
    };
    
    // Store the updated instance
    this.instances.set(id, updatedInstance);
    
    // Emit update event
    eventBus.publish(
      DependencyManagerEvent.DEPENDENCY_UPDATED,
      { 
        instance: updatedInstance,
        previousInstance: instance,
        configChanged: true
      }
    );
    
    return true;
  }
  
  /**
   * Remove a dependency instance
   * 
   * @param id ID of the dependency instance to remove
   * @returns Whether the removal was successful
   */
  public removeDependency(id: string): boolean {
    const instance = this.instances.get(id);
    
    if (!instance) {
      console.error(`Cannot remove dependency instance: ID ${id} not found`);
      return false;
    }
    
    // Remove from lookup maps
    this.removeFromProviderMap(instance.providerId, id);
    this.removeFromConsumerMap(instance.consumerId, id);
    
    // Remove from instances map
    this.instances.delete(id);
    
    // Emit removal event
    eventBus.publish(
      DependencyManagerEvent.DEPENDENCY_REMOVED,
      { instance }
    );
    
    return true;
  }
  
  /**
   * Get a dependency instance by ID
   * 
   * @param id The ID of the dependency instance
   * @returns The dependency instance, or undefined if not found
   */
  public getDependency(id: string): DependencyInstance | undefined {
    return this.instances.get(id);
  }
  
  /**
   * Get all dependency instances
   * 
   * @returns Array of all dependency instances
   */
  public getAllDependencies(): DependencyInstance[] {
    return Array.from(this.instances.values());
  }
  
  /**
   * Get all dependency instances for a provider component
   * 
   * @param providerId ID of the provider component
   * @returns Array of dependency instances
   */
  public getDependenciesForProvider(providerId: string): DependencyInstance[] {
    const dependencyIds = this.providerToDependencyMap.get(providerId);
    
    if (!dependencyIds) {
      return [];
    }
    
    return Array.from(dependencyIds)
      .map(id => this.instances.get(id))
      .filter(Boolean) as DependencyInstance[];
  }
  
  /**
   * Get all dependency instances for a consumer component
   * 
   * @param consumerId ID of the consumer component
   * @returns Array of dependency instances
   */
  public getDependenciesForConsumer(consumerId: string): DependencyInstance[] {
    const dependencyIds = this.consumerToDependencyMap.get(consumerId);
    
    if (!dependencyIds) {
      return [];
    }
    
    return Array.from(dependencyIds)
      .map(id => this.instances.get(id))
      .filter(Boolean) as DependencyInstance[];
  }
  
  /**
   * Find a dependency instance between a provider and consumer
   * 
   * @param providerId ID of the provider component
   * @param consumerId ID of the consumer component
   * @param definitionId Optional dependency definition ID to filter by
   * @returns The dependency instance, or undefined if not found
   */
  public findDependency(
    providerId: string, 
    consumerId: string,
    definitionId?: string
  ): DependencyInstance | undefined {
    // Get all dependencies for the provider
    const providerDependencies = this.getDependenciesForProvider(providerId);
    
    // Filter by consumer ID and optionally by definition ID
    return providerDependencies.find(dep => 
      dep.consumerId === consumerId && 
      (definitionId ? dep.definitionId === definitionId : true)
    );
  }
  
  /**
   * Update the data for a dependency instance
   * 
   * @param id ID of the dependency instance
   * @param data New data
   * @returns Whether the update was successful
   */
  public updateDependencyData(id: string, data: any): boolean {
    const instance = this.instances.get(id);
    
    if (!instance) {
      console.error(`Cannot update dependency data: instance ID ${id} not found`);
      return false;
    }
    
    const definition = dependencyRegistry.getDependency(instance.definitionId);
    
    if (!definition) {
      console.error(`Cannot update dependency data: definition ${instance.definitionId} not found`);
      return false;
    }
    
    // Validate data if a validator is provided
    if (definition.validateData && !definition.validateData(data)) {
      console.error(`Invalid data for dependency ${id}`);
      return false;
    }
    
    // Apply filter if configured
    if (instance.config.filter && !instance.config.filter(data)) {
      // Data filtered out, do not update
      return false;
    }
    
    // Apply data transformation
    let transformedData = data;
    
    // Apply custom transform if provided
    if (instance.config.customTransform) {
      transformedData = instance.config.customTransform(data);
    }
    // Apply default transform if provided in definition
    else if (definition.transformData) {
      transformedData = definition.transformData(data);
    }
    
    // Update the instance
    const updatedInstance: DependencyInstance = {
      ...instance,
      currentData: transformedData,
      lastUpdated: Date.now()
    };
    
    // Store the updated instance
    this.instances.set(id, updatedInstance);
    
    // Create data update event
    const updateEvent: DependencyDataUpdateEvent = {
      dependencyId: id,
      providerId: instance.providerId,
      consumerId: instance.consumerId,
      dataType: definition.dataType,
      data: transformedData,
      timestamp: Date.now()
    };
    
    // Emit data update event
    eventBus.publish(
      DependencyManagerEvent.DEPENDENCY_DATA_UPDATED,
      updateEvent
    );
    
    // If auto-update is enabled, notify the consumer component
    if (instance.config.autoUpdate !== false) {
      this.notifyConsumer(instance, transformedData);
    }
    
    return true;
  }
  
  /**
   * Request data from a provider component
   * 
   * @param id ID of the dependency instance
   * @param params Additional parameters for the request
   * @returns Promise that resolves when data is received
   */
  public async requestData(id: string, params?: any): Promise<any> {
    const instance = this.instances.get(id);
    
    if (!instance) {
      throw new Error(`Cannot request data: dependency instance ID ${id} not found`);
    }
    
    const definition = dependencyRegistry.getDependency(instance.definitionId);
    
    if (!definition) {
      throw new Error(`Cannot request data: definition ${instance.definitionId} not found`);
    }
    
    // Ensure the dependency supports pull strategy
    if (
      definition.syncStrategy !== DependencySyncStrategy.PULL && 
      definition.syncStrategy !== DependencySyncStrategy.BOTH
    ) {
      throw new Error(`Dependency ${id} does not support pull synchronization`);
    }
    
    // Create data request event
    const requestEvent: DependencyDataRequest = {
      dependencyId: id,
      providerId: instance.providerId,
      consumerId: instance.consumerId,
      dataType: definition.dataType,
      timestamp: Date.now(),
      params
    };
    
    // Emit data request event
    eventBus.publish(
      DependencyManagerEvent.DEPENDENCY_DATA_REQUESTED,
      requestEvent
    );
    
    try {
      // Request data from provider component
      const data = await componentCommunication.sendRequest(
        instance.consumerId,
        instance.providerId,
        'getDependencyData',
        {
          dependencyId: id,
          dataType: definition.dataType,
          params
        }
      );
      
      // Update dependency data with the response
      this.updateDependencyData(id, data);
      
      return data;
    } catch (error) {
      console.error(`Failed to request data for dependency ${id}:`, error);
      
      // Update instance with error
      const updatedInstance: DependencyInstance = {
        ...instance,
        error: error.message,
        lastUpdated: Date.now()
      };
      
      // Store the updated instance
      this.instances.set(id, updatedInstance);
      
      // Emit error event
      eventBus.publish(
        DependencyManagerEvent.DEPENDENCY_ERROR,
        { 
          instance: updatedInstance,
          error
        }
      );
      
      throw error;
    }
  }
  
  /**
   * Set the status of a dependency instance
   * 
   * @param id ID of the dependency instance
   * @param status New status
   * @param error Optional error message
   * @returns Whether the update was successful
   */
  public setDependencyStatus(
    id: string, 
    status: DependencyStatus,
    error?: string
  ): boolean {
    const instance = this.instances.get(id);
    
    if (!instance) {
      console.error(`Cannot set dependency status: instance ID ${id} not found`);
      return false;
    }
    
    // Determine if this is an active change
    const isActiveChange = 
      (status === DependencyStatus.ACTIVE && !instance.isActive) ||
      (status === DependencyStatus.INACTIVE && instance.isActive);
    
    // Determine if this is a ready change
    const isReadyChange = 
      (status === DependencyStatus.ACTIVE && !instance.isReady) ||
      (status === DependencyStatus.PENDING && instance.isReady);
    
    // Update the instance
    const updatedInstance: DependencyInstance = {
      ...instance,
      isActive: status === DependencyStatus.ACTIVE,
      isReady: status !== DependencyStatus.PENDING,
      error: status === DependencyStatus.ERROR ? (error || 'Unknown error') : undefined,
      lastUpdated: Date.now()
    };
    
    // Store the updated instance
    this.instances.set(id, updatedInstance);
    
    // Emit status change event
    eventBus.publish(
      DependencyManagerEvent.DEPENDENCY_STATUS_CHANGED,
      { 
        instance: updatedInstance,
        previousStatus: instance.isActive ? 
          (instance.isReady ? DependencyStatus.ACTIVE : DependencyStatus.PENDING) : 
          (instance.error ? DependencyStatus.ERROR : DependencyStatus.INACTIVE),
        newStatus: status,
        isActiveChange,
        isReadyChange
      }
    );
    
    // If the dependency is becoming active, request initial data
    if (isActiveChange && status === DependencyStatus.ACTIVE) {
      this.requestInitialData(updatedInstance);
    }
    
    return true;
  }
  
  /**
   * Notify a component about its dependencies
   * 
   * @param componentId ID of the component to notify
   * @returns Whether any notifications were sent
   */
  public notifyComponentDependencies(componentId: string): boolean {
    // Get all dependencies where this component is a consumer
    const dependencies = this.getDependenciesForConsumer(componentId);
    
    if (dependencies.length === 0) {
      return false;
    }
    
    // Notify the component about each dependency
    for (const dependency of dependencies) {
      if (dependency.isActive && dependency.currentData) {
        this.notifyConsumer(dependency, dependency.currentData);
      }
    }
    
    return true;
  }
  
  /**
   * Reset all dependency data for a component
   * 
   * @param componentId ID of the component
   * @param clearProvided Whether to clear data provided by this component
   * @param clearConsumed Whether to clear data consumed by this component
   * @returns Number of dependencies reset
   */
  public resetComponentDependencies(
    componentId: string,
    clearProvided: boolean = true,
    clearConsumed: boolean = true
  ): number {
    let resetCount = 0;
    
    if (clearProvided) {
      // Reset dependencies where this component is a provider
      const providerDependencies = this.getDependenciesForProvider(componentId);
      
      for (const dependency of providerDependencies) {
        const updatedInstance: DependencyInstance = {
          ...dependency,
          currentData: undefined,
          lastUpdated: Date.now()
        };
        
        this.instances.set(dependency.id, updatedInstance);
        resetCount++;
      }
    }
    
    if (clearConsumed) {
      // Reset dependencies where this component is a consumer
      const consumerDependencies = this.getDependenciesForConsumer(componentId);
      
      for (const dependency of consumerDependencies) {
        const updatedInstance: DependencyInstance = {
          ...dependency,
          currentData: undefined,
          lastUpdated: Date.now()
        };
        
        this.instances.set(dependency.id, updatedInstance);
        resetCount++;
      }
    }
    
    return resetCount;
  }
  
  /**
   * Validate a dependency configuration against its definition
   * 
   * @param definition The dependency definition
   * @param config The configuration to validate
   * @throws Error if the configuration is invalid
   */
  private validateDependencyConfig(
    definition: DependencyDefinition, 
    config: DependencyConfig
  ): void {
    // Verify definitionId matches
    if (config.definitionId !== definition.id) {
      throw new Error(
        `Configuration definitionId ${config.definitionId} does not match ` +
        `definition ID ${definition.id}`
      );
    }
    
    // Check configuration options
    if (definition.configOptions) {
      for (const option of definition.configOptions) {
        // Check required options
        if (option.required && 
            (config.options[option.key] === undefined || config.options[option.key] === null)) {
          throw new Error(`Required configuration option "${option.key}" is missing`);
        }
        
        // Validate option value if provided
        if (config.options[option.key] !== undefined && 
            option.validate && 
            !option.validate(config.options[option.key])) {
          throw new Error(`Invalid value for configuration option "${option.key}"`);
        }
        
        // Validate select options
        if (option.type === 'select' && 
            config.options[option.key] !== undefined &&
            option.options) {
          const allowedValues = option.options.map(o => o.value);
          
          if (!allowedValues.includes(config.options[option.key])) {
            throw new Error(
              `Invalid value for select option "${option.key}": ` +
              `${config.options[option.key]}. Allowed values: ${allowedValues.join(', ')}`
            );
          }
        }
      }
    }
  }
  
  /**
   * Add a dependency instance ID to the provider lookup map
   */
  private addToProviderMap(providerId: string, dependencyId: string): void {
    if (!this.providerToDependencyMap.has(providerId)) {
      this.providerToDependencyMap.set(providerId, new Set());
    }
    
    this.providerToDependencyMap.get(providerId)!.add(dependencyId);
  }
  
  /**
   * Remove a dependency instance ID from the provider lookup map
   */
  private removeFromProviderMap(providerId: string, dependencyId: string): void {
    const providerDependencies = this.providerToDependencyMap.get(providerId);
    
    if (providerDependencies) {
      providerDependencies.delete(dependencyId);
      
      if (providerDependencies.size === 0) {
        this.providerToDependencyMap.delete(providerId);
      }
    }
  }
  
  /**
   * Add a dependency instance ID to the consumer lookup map
   */
  private addToConsumerMap(consumerId: string, dependencyId: string): void {
    if (!this.consumerToDependencyMap.has(consumerId)) {
      this.consumerToDependencyMap.set(consumerId, new Set());
    }
    
    this.consumerToDependencyMap.get(consumerId)!.add(dependencyId);
  }
  
  /**
   * Remove a dependency instance ID from the consumer lookup map
   */
  private removeFromConsumerMap(consumerId: string, dependencyId: string): void {
    const consumerDependencies = this.consumerToDependencyMap.get(consumerId);
    
    if (consumerDependencies) {
      consumerDependencies.delete(dependencyId);
      
      if (consumerDependencies.size === 0) {
        this.consumerToDependencyMap.delete(consumerId);
      }
    }
  }
  
  /**
   * Set up event listeners for the dependency manager
   */
  private setupEventListeners(): void {
    // Listen for component registration and removal events
    componentCommunication.addEventListener('component:registered', this.handleComponentRegistered);
    componentCommunication.addEventListener('component:unregistered', this.handleComponentUnregistered);
    
    // Listen for component updates
    componentCommunication.addEventListener('component:updated', this.handleComponentUpdated);
  }
  
  /**
   * Handle component registration events
   */
  private handleComponentRegistered = (event: any): void => {
    const componentId = event.componentId;
    const componentType = event.metadata.componentType;
    
    // Check if this component can be a provider or consumer
    const providerDependencies = dependencyRegistry.getDependenciesForProvider(componentType);
    const consumerDependencies = dependencyRegistry.getDependenciesForConsumer(componentType);
    
    // Log for debugging
    if (providerDependencies.length > 0 || consumerDependencies.length > 0) {
      console.log(
        `Component ${componentId} (${componentType}) registered with ` +
        `${providerDependencies.length} provider dependencies and ` +
        `${consumerDependencies.length} consumer dependencies`
      );
    }
    
    // TODO: Implement auto-dependency creation if needed
  };
  
  /**
   * Handle component unregistration events
   */
  private handleComponentUnregistered = (event: any): void => {
    const componentId = event.componentId;
    
    // Get all dependencies for this component
    const providerDependencies = this.getDependenciesForProvider(componentId);
    const consumerDependencies = this.getDependenciesForConsumer(componentId);
    
    // Remove all dependencies where this component is a provider or consumer
    for (const dependency of [...providerDependencies, ...consumerDependencies]) {
      this.removeDependency(dependency.id);
    }
  };
  
  /**
   * Handle component update events
   */
  private handleComponentUpdated = (event: any): void => {
    const componentId = event.componentId;
    
    // Get all dependencies for this component
    const providerDependencies = this.getDependenciesForProvider(componentId);
    const consumerDependencies = this.getDependenciesForConsumer(componentId);
    
    // Update active status of dependencies if component visibility changed
    if (event.changes && 'isVisible' in event.changes) {
      const isVisible = event.changes.isVisible;
      
      // Set dependencies as active/inactive based on visibility
      for (const dependency of [...providerDependencies, ...consumerDependencies]) {
        this.setDependencyStatus(
          dependency.id,
          isVisible ? DependencyStatus.ACTIVE : DependencyStatus.INACTIVE
        );
      }
    }
  };
  
  /**
   * Set up a data push handler for a dependency
   */
  private setupDataPushHandler(instance: DependencyInstance): void {
    // TODO: Implement data push handling, such as registering event listeners
    // or setting up request handlers on the provider component
  }
  
  /**
   * Request initial data for a dependency
   */
  private requestInitialData(instance: DependencyInstance): void {
    // Only request data if the dependency is active and ready
    if (!instance.isActive || !instance.isReady) {
      return;
    }
    
    const definition = dependencyRegistry.getDependency(instance.definitionId);
    
    if (!definition) {
      console.error(`Cannot request initial data: definition ${instance.definitionId} not found`);
      return;
    }
    
    // Check if the dependency supports pull strategy
    if (
      definition.syncStrategy === DependencySyncStrategy.PULL || 
      definition.syncStrategy === DependencySyncStrategy.BOTH
    ) {
      // Request data from provider
      this.requestData(instance.id)
        .catch(error => {
          console.error(`Failed to request initial data for dependency ${instance.id}:`, error);
        });
    }
  }
  
  /**
   * Notify a consumer component about updated data
   */
  private notifyConsumer(instance: DependencyInstance, data: any): void {
    try {
      // Send notification to consumer component
      componentCommunication.sendNotification(
        instance.providerId,
        instance.consumerId,
        'dependencyDataUpdated',
        {
          dependencyId: instance.id,
          data
        }
      );
    } catch (error) {
      console.error(`Failed to notify consumer for dependency ${instance.id}:`, error);
    }
  }
}

// Export singleton instance
export const dependencyManager = DependencyManager.getInstance();