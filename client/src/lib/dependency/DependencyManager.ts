/**
 * Dependency Manager for Component Dependency System
 * 
 * The DependencyManager is responsible for creating and managing dependencies between
 * component instances at runtime. It handles data flow and status management for
 * dependencies.
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  DependencyInstance,
  DependencyDefinition,
  DependencyConfig,
  DependencyStatus,
  DependencyDataUpdateEvent,
  DependencyDataRequest
} from './DependencyInterfaces';
import { dependencyRegistry } from './DependencyRegistry';
import { ComponentType } from '../communication/ComponentCommunication';
import { eventBus, BaseEvent } from '../communication/EventBus';

// Dependency manager events
export enum DependencyManagerEvent {
  DEPENDENCY_CREATED = 'dependency-manager:dependency-created',
  DEPENDENCY_REMOVED = 'dependency-manager:dependency-removed',
  DEPENDENCY_DATA_UPDATED = 'dependency-manager:dependency-data-updated',
  DEPENDENCY_DATA_REQUESTED = 'dependency-manager:dependency-data-requested',
  DEPENDENCY_STATUS_CHANGED = 'dependency-manager:dependency-status-changed'
}

// Default dependency configuration
const DEFAULT_DEPENDENCY_CONFIG: DependencyConfig = {
  isActive: true,
  autoUpdate: true,
  notifyOnChange: true,
  options: {}
};

/**
 * DependencyManager class for managing runtime dependencies
 */
export class DependencyManager {
  private dependencies: Map<string, DependencyInstance> = new Map();
  private isInitialized: boolean = false;
  
  /**
   * Initialize the dependency manager
   */
  constructor() {
    console.log('DependencyManager initialized');
  }
  
  /**
   * Initialize dependencies
   */
  initialize(): void {
    if (this.isInitialized) {
      return;
    }
    
    this.isInitialized = true;
  }
  
  /**
   * Create a dependency instance
   * 
   * @param definitionId Dependency definition ID
   * @param providerId Provider component ID
   * @param consumerId Consumer component ID
   * @param config Optional configuration
   * @returns ID of the created dependency
   */
  createDependency(
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
    
    // Create the dependency instance
    const id = uuidv4();
    const timestamp = Date.now();
    
    // Merge with default config
    const mergedConfig: DependencyConfig = {
      ...DEFAULT_DEPENDENCY_CONFIG,
      ...config,
      options: {
        ...DEFAULT_DEPENDENCY_CONFIG.options,
        ...(config?.options || {})
      }
    };
    
    const dependency: DependencyInstance = {
      id,
      definitionId,
      providerId,
      providerType: definition.providerType,
      consumerId,
      consumerType: definition.consumerType,
      dataType: definition.dataType,
      isActive: mergedConfig.isActive,
      isReady: false, // Not ready until explicitly set
      config: mergedConfig,
      createdAt: timestamp
    };
    
    // Store the dependency
    this.dependencies.set(id, dependency);
    
    // Publish event
    eventBus.publish(
      DependencyManagerEvent.DEPENDENCY_CREATED,
      { instance: dependency },
      'dependency-manager'
    );
    
    return id;
  }
  
  /**
   * Remove a dependency
   * 
   * @param id Dependency ID
   * @returns Whether the removal was successful
   */
  removeDependency(id: string): boolean {
    const dependency = this.dependencies.get(id);
    
    if (!dependency) {
      return false;
    }
    
    // Remove the dependency
    this.dependencies.delete(id);
    
    // Publish event
    eventBus.publish(
      DependencyManagerEvent.DEPENDENCY_REMOVED,
      { instance: dependency },
      'dependency-manager'
    );
    
    return true;
  }
  
  /**
   * Get a dependency by ID
   * 
   * @param id Dependency ID
   * @returns The dependency instance
   */
  getDependency(id: string): DependencyInstance | undefined {
    return this.dependencies.get(id);
  }
  
  /**
   * Get all dependencies
   * 
   * @returns Array of all dependency instances
   */
  getAllDependencies(): DependencyInstance[] {
    return Array.from(this.dependencies.values());
  }
  
  /**
   * Update dependency configuration
   * 
   * @param id Dependency ID
   * @param config Configuration updates
   * @returns Whether the update was successful
   */
  updateDependencyConfig(
    id: string,
    config: Partial<DependencyConfig>
  ): boolean {
    const dependency = this.dependencies.get(id);
    
    if (!dependency) {
      return false;
    }
    
    // Update the configuration
    dependency.config = {
      ...dependency.config,
      ...config,
      options: {
        ...dependency.config.options,
        ...(config.options || {})
      }
    };
    
    return true;
  }
  
  /**
   * Get dependencies for a provider
   * 
   * @param providerId Provider component ID
   * @returns Array of dependencies
   */
  getDependenciesForProvider(providerId: string): DependencyInstance[] {
    return this.getAllDependencies().filter(
      dep => dep.providerId === providerId
    );
  }
  
  /**
   * Get dependencies for a consumer
   * 
   * @param consumerId Consumer component ID
   * @returns Array of dependencies
   */
  getDependenciesForConsumer(consumerId: string): DependencyInstance[] {
    return this.getAllDependencies().filter(
      dep => dep.consumerId === consumerId
    );
  }
  
  /**
   * Find a dependency between a provider and consumer
   * 
   * @param providerId Provider component ID
   * @param consumerId Consumer component ID
   * @param definitionId Optional definition ID to filter by
   * @returns The first matching dependency
   */
  findDependency(
    providerId: string,
    consumerId: string,
    definitionId?: string
  ): DependencyInstance | undefined {
    return this.getAllDependencies().find(dep => 
      dep.providerId === providerId && 
      dep.consumerId === consumerId &&
      (definitionId ? dep.definitionId === definitionId : true)
    );
  }
  
  /**
   * Update dependency data
   * 
   * @param id Dependency ID
   * @param data New data
   * @returns Whether the update was successful
   */
  updateDependencyData<T>(id: string, data: T): boolean {
    const dependency = this.dependencies.get(id);
    
    if (!dependency || !dependency.isActive) {
      return false;
    }
    
    // Get the definition
    const definition = dependencyRegistry.getDependency(dependency.definitionId);
    
    if (!definition) {
      return false;
    }
    
    // Validate data if validation function exists
    if (definition.validateData && !definition.validateData(data)) {
      return false;
    }
    
    // Apply filter if it exists
    if (dependency.config.filter && !dependency.config.filter(data)) {
      return false;
    }
    
    // Apply transformations
    let transformedData: any = data;
    
    // Apply definition-level transformation
    if (definition.transformData) {
      transformedData = definition.transformData(transformedData);
    }
    
    // Apply instance-level transformation
    if (dependency.config.customTransform) {
      transformedData = dependency.config.customTransform(transformedData);
    }
    
    // Update the dependency data
    dependency.currentData = transformedData;
    dependency.lastUpdated = Date.now();
    
    // Set as ready if not already
    if (!dependency.isReady) {
      dependency.isReady = true;
    }
    
    // Publish update event if configured to notify
    if (dependency.config.notifyOnChange) {
      const updateEvent: DependencyDataUpdateEvent = {
        dependencyId: id,
        data: transformedData,
        timestamp: dependency.lastUpdated!,
        providerId: dependency.providerId,
        consumerId: dependency.consumerId
      };
      
      eventBus.publish(
        DependencyManagerEvent.DEPENDENCY_DATA_UPDATED,
        updateEvent,
        'dependency-manager'
      );
    }
    
    return true;
  }
  
  /**
   * Request data from a dependency
   * 
   * @param id Dependency ID
   * @param params Optional request parameters
   * @returns Promise resolving to the requested data
   */
  async requestData<T>(id: string, params?: any): Promise<T> {
    const dependency = this.dependencies.get(id);
    
    if (!dependency || !dependency.isActive) {
      throw new Error(`Dependency not found or inactive: ${id}`);
    }
    
    // If data is already available and no params are provided, return immediately
    if (dependency.currentData !== undefined && !params) {
      return dependency.currentData as T;
    }
    
    // Create request ID
    const requestId = uuidv4();
    
    // Create request event
    const request: DependencyDataRequest = {
      requestId,
      dependencyId: id,
      consumerId: dependency.consumerId,
      providerId: dependency.providerId,
      params,
      timestamp: Date.now()
    };
    
    // Publish request event
    eventBus.publish(
      DependencyManagerEvent.DEPENDENCY_DATA_REQUESTED,
      request,
      'dependency-manager'
    );
    
    // Wait for response (simple implementation)
    // In a real system, this would be more sophisticated with timeout handling
    return new Promise<T>((resolve, reject) => {
      // Wait a short time for data to be updated
      setTimeout(() => {
        const updatedDependency = this.dependencies.get(id);
        
        if (!updatedDependency || !updatedDependency.isActive) {
          reject(new Error(`Dependency not found or inactive: ${id}`));
          return;
        }
        
        if (updatedDependency.currentData === undefined) {
          reject(new Error(`No data available for dependency: ${id}`));
          return;
        }
        
        resolve(updatedDependency.currentData as T);
      }, 100);
    });
  }
  
  /**
   * Set the status of a dependency
   * 
   * @param id Dependency ID
   * @param status New status
   * @param error Optional error message
   * @returns Whether the update was successful
   */
  setDependencyStatus(
    id: string,
    status: DependencyStatus,
    error?: string
  ): boolean {
    const dependency = this.dependencies.get(id);
    
    if (!dependency) {
      return false;
    }
    
    // Update status fields
    switch (status) {
      case DependencyStatus.ACTIVE:
        dependency.isActive = true;
        dependency.error = undefined;
        break;
        
      case DependencyStatus.INACTIVE:
        dependency.isActive = false;
        dependency.error = undefined;
        break;
        
      case DependencyStatus.ERROR:
        dependency.isActive = false;
        dependency.error = error || 'Unknown error';
        break;
        
      case DependencyStatus.PENDING:
        dependency.isActive = true;
        dependency.isReady = false;
        dependency.error = undefined;
        break;
    }
    
    // Publish event
    eventBus.publish(
      DependencyManagerEvent.DEPENDENCY_STATUS_CHANGED,
      { instance: dependency },
      'dependency-manager'
    );
    
    return true;
  }
  
  /**
   * Clear all dependencies
   */
  clear(): void {
    this.dependencies.clear();
  }
}

// Create a singleton instance
export const dependencyManager = new DependencyManager();