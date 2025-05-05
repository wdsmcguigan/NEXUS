/**
 * Dependency Manager
 * 
 * This file implements the runtime management of dependencies.
 * It creates, tracks, and updates dependency instances
 * and manages data flow between components.
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  DependencyInstance, 
  DependencyConfig,
  DependencyStatus,
  DependencyDataRequest,
  DependencyDataResponse
} from './DependencyInterfaces';
import { dependencyRegistry } from './DependencyRegistry';
import { ComponentType } from '../communication/ComponentCommunication';

/**
 * The DependencyManager handles runtime aspects of the dependency system
 * including dependency instances and data flow.
 */
class DependencyManager {
  private dependencies: Map<string, DependencyInstance> = new Map();
  private providerDependencies: Map<string, Set<string>> = new Map();
  private consumerDependencies: Map<string, Set<string>> = new Map();
  private pendingRequests: Map<string, (data?: any, error?: string) => void> = new Map();
  private initialized: boolean = false;

  /**
   * Initialize the dependency manager
   */
  initialize() {
    if (!this.initialized) {
      this.dependencies.clear();
      this.providerDependencies.clear();
      this.consumerDependencies.clear();
      this.pendingRequests.clear();
      this.initialized = true;
      console.log("DependencyManager initialized");
    }
  }

  /**
   * Create a new dependency instance
   * @param definitionId The ID of the dependency definition
   * @param providerId The ID of the provider component
   * @param consumerId The ID of the consumer component
   * @returns The ID of the created dependency instance
   */
  createDependency(
    definitionId: string,
    providerId: string,
    consumerId: string
  ): string {
    // Get the dependency definition
    const definition = dependencyRegistry.getDependency(definitionId);
    
    if (!definition) {
      throw new Error(`Dependency definition not found: ${definitionId}`);
    }
    
    // Check if a dependency already exists
    const existingDependency = this.findDependency(providerId, consumerId, definitionId);
    
    if (existingDependency) {
      return existingDependency.id;
    }
    
    // Create a new dependency instance
    const id = uuidv4();
    const dependency: DependencyInstance = {
      id,
      definitionId,
      providerId,
      providerType: definition.providerType,
      consumerId,
      consumerType: definition.consumerType,
      dataType: definition.dataType,
      isActive: true,
      isReady: false,
      createdAt: Date.now(),
      config: {
        isActive: true,
        autoUpdate: true,
        notifyOnChange: true,
        options: {}
      }
    };
    
    // Store the dependency
    this.dependencies.set(id, dependency);
    
    // Update provider and consumer maps
    this.addToComponentDependencies(this.providerDependencies, providerId, id);
    this.addToComponentDependencies(this.consumerDependencies, consumerId, id);
    
    return id;
  }

  /**
   * Add a dependency ID to a component dependencies map
   * @param map The map to update
   * @param componentId The component ID
   * @param dependencyId The dependency ID
   */
  private addToComponentDependencies(
    map: Map<string, Set<string>>,
    componentId: string,
    dependencyId: string
  ): void {
    if (!map.has(componentId)) {
      map.set(componentId, new Set());
    }
    
    map.get(componentId)?.add(dependencyId);
  }

  /**
   * Get a dependency instance by ID
   * @param id The dependency ID
   * @returns The dependency instance or undefined if not found
   */
  getDependency(id: string): DependencyInstance | undefined {
    return this.dependencies.get(id);
  }

  /**
   * Find a dependency instance by provider and consumer IDs
   * @param providerId The provider component ID
   * @param consumerId The consumer component ID
   * @param definitionId Optional dependency definition ID
   * @returns The dependency instance or undefined if not found
   */
  findDependency(
    providerId: string,
    consumerId: string,
    definitionId?: string
  ): DependencyInstance | undefined {
    // Get all dependencies for the provider
    const providerDeps = this.getDependenciesForProvider(providerId);
    
    // Filter by consumer ID
    const matchingDeps = providerDeps.filter(dep => dep.consumerId === consumerId);
    
    // Filter by definition ID if provided
    if (definitionId) {
      return matchingDeps.find(dep => dep.definitionId === definitionId);
    }
    
    // Return first matching dependency
    return matchingDeps[0];
  }

  /**
   * Get all dependencies for a provider component
   * @param providerId The provider component ID
   * @returns Array of dependency instances
   */
  getDependenciesForProvider(providerId: string): DependencyInstance[] {
    const dependencyIds = this.providerDependencies.get(providerId) || new Set();
    return Array.from(dependencyIds)
      .map(id => this.dependencies.get(id))
      .filter(Boolean) as DependencyInstance[];
  }

  /**
   * Get all dependencies for a consumer component
   * @param consumerId The consumer component ID
   * @returns Array of dependency instances
   */
  getDependenciesForConsumer(consumerId: string): DependencyInstance[] {
    const dependencyIds = this.consumerDependencies.get(consumerId) || new Set();
    return Array.from(dependencyIds)
      .map(id => this.dependencies.get(id))
      .filter(Boolean) as DependencyInstance[];
  }

  /**
   * Update dependency data from provider to consumer
   * @param id The dependency ID
   * @param data The data to update
   * @returns True if the update succeeded
   */
  updateDependencyData<T>(id: string, data: T): boolean {
    const dependency = this.dependencies.get(id);
    
    if (!dependency) {
      return false;
    }
    
    // Get the dependency definition
    const definition = dependencyRegistry.getDependency(dependency.definitionId);
    
    if (!definition) {
      return false;
    }
    
    // Validate data if a validator is defined
    if (definition.validateData && !definition.validateData(data)) {
      console.warn(`Invalid data provided for dependency ${id}`);
      return false;
    }
    
    // Transform data if a transformer is defined
    let transformedData = data;
    
    if (definition.transformData) {
      transformedData = definition.transformData(data);
    } else if (dependency.config.customTransform) {
      transformedData = dependency.config.customTransform(data);
    }
    
    // Update the dependency instance
    dependency.currentData = transformedData;
    dependency.lastUpdated = Date.now();
    dependency.isReady = true;
    
    // Handle any pending requests
    this.resolvePendingRequests(dependency);
    
    return true;
  }

  /**
   * Resolve any pending data requests for a dependency
   * @param dependency The dependency instance
   */
  private resolvePendingRequests(dependency: DependencyInstance): void {
    // Check for pending requests
    const requestIds = Array.from(this.pendingRequests.keys())
      .filter(requestId => requestId.startsWith(`${dependency.id}:`));
    
    // Resolve each pending request
    requestIds.forEach(requestId => {
      const resolver = this.pendingRequests.get(requestId);
      
      if (resolver) {
        resolver(dependency.currentData);
        this.pendingRequests.delete(requestId);
      }
    });
  }

  /**
   * Request data from a dependency
   * @param id The dependency ID
   * @param params Optional parameters for the request
   * @returns Promise that resolves with the requested data
   */
  async requestData<T>(id: string, params?: any): Promise<T> {
    const dependency = this.dependencies.get(id);
    
    if (!dependency) {
      throw new Error(`Dependency not found: ${id}`);
    }
    
    // If data is already available and ready, return it immediately
    if (dependency.isReady && dependency.currentData !== undefined) {
      return dependency.currentData as T;
    }
    
    // Otherwise, create a new data request
    const requestId = `${id}:${uuidv4()}`;
    
    // Create a promise to resolve when data becomes available
    return new Promise<T>((resolve, reject) => {
      // Set a timeout to reject the promise if data is not received
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Timeout waiting for data from dependency ${id}`));
      }, 5000);
      
      // Store the resolver
      this.pendingRequests.set(requestId, (data, error) => {
        clearTimeout(timeoutId);
        
        if (error) {
          reject(new Error(error));
        } else {
          resolve(data as T);
        }
      });
    });
  }

  /**
   * Set the status of a dependency
   * @param id The dependency ID
   * @param status The new status
   * @param error Optional error message
   * @returns True if the status was updated
   */
  setDependencyStatus(id: string, status: DependencyStatus, error?: string): boolean {
    const dependency = this.dependencies.get(id);
    
    if (!dependency) {
      return false;
    }
    
    dependency.isActive = status === DependencyStatus.ACTIVE;
    
    if (status === DependencyStatus.ERROR) {
      dependency.error = error || 'Unknown error';
    } else {
      dependency.error = undefined;
    }
    
    return true;
  }

  /**
   * Update a dependency's configuration
   * @param id The dependency ID
   * @param config The new configuration
   * @returns True if the configuration was updated
   */
  updateDependencyConfig(id: string, config: Partial<DependencyConfig>): boolean {
    const dependency = this.dependencies.get(id);
    
    if (!dependency) {
      return false;
    }
    
    dependency.config = {
      ...dependency.config,
      ...config
    };
    
    return true;
  }

  /**
   * Remove a dependency instance
   * @param id The dependency ID
   * @returns True if the dependency was removed
   */
  removeDependency(id: string): boolean {
    const dependency = this.dependencies.get(id);
    
    if (!dependency) {
      return false;
    }
    
    // Remove from provider and consumer maps
    this.removeFromComponentDependencies(this.providerDependencies, dependency.providerId, id);
    this.removeFromComponentDependencies(this.consumerDependencies, dependency.consumerId, id);
    
    // Remove any pending requests
    const requestIds = Array.from(this.pendingRequests.keys())
      .filter(requestId => requestId.startsWith(`${id}:`));
    
    requestIds.forEach(requestId => {
      const resolver = this.pendingRequests.get(requestId);
      
      if (resolver) {
        resolver(undefined, 'Dependency removed');
        this.pendingRequests.delete(requestId);
      }
    });
    
    // Remove from dependencies map
    return this.dependencies.delete(id);
  }

  /**
   * Remove a dependency ID from a component dependencies map
   * @param map The map to update
   * @param componentId The component ID
   * @param dependencyId The dependency ID
   */
  private removeFromComponentDependencies(
    map: Map<string, Set<string>>,
    componentId: string,
    dependencyId: string
  ): void {
    const dependencyIds = map.get(componentId);
    
    if (dependencyIds) {
      dependencyIds.delete(dependencyId);
      
      if (dependencyIds.size === 0) {
        map.delete(componentId);
      }
    }
  }
}

// Create singleton instance
export const dependencyManager = new DependencyManager();