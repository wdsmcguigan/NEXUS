/**
 * Dependency Registry for Component Dependency System
 * 
 * The DependencyRegistry manages dependency definitions between component types.
 * It provides methods for registering, updating, and querying dependency definitions.
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  DependencyDefinition,
  DependencyDataType,
  DependencySyncStrategy
} from './DependencyInterfaces';
import { ComponentType } from '../communication/ComponentCommunication';
import { eventBus, BaseEvent } from '../communication/EventBus';

// Registry events
export enum DependencyRegistryEvent {
  DEPENDENCY_REGISTERED = 'dependency-registry:dependency-registered',
  DEPENDENCY_UPDATED = 'dependency-registry:dependency-updated',
  DEPENDENCY_REMOVED = 'dependency-registry:dependency-removed'
}

/**
 * DependencyRegistry class for managing dependency definitions
 */
export class DependencyRegistry {
  private dependencies: Map<string, DependencyDefinition> = new Map();
  
  /**
   * Initialize the registry
   */
  constructor() {
    console.log('DependencyRegistry initialized');
  }
  
  /**
   * Register a new dependency definition
   * 
   * @param definition The dependency definition (without ID)
   * @returns ID of the registered dependency
   */
  registerDependency(definition: Omit<DependencyDefinition, 'id' | 'createdAt'>): string {
    const id = uuidv4();
    const timestamp = Date.now();
    
    const fullDefinition: DependencyDefinition = {
      ...definition,
      id,
      createdAt: timestamp
    };
    
    this.dependencies.set(id, fullDefinition);
    
    // Publish event
    eventBus.publish(
      DependencyRegistryEvent.DEPENDENCY_REGISTERED,
      { definition: fullDefinition },
      'dependency-registry'
    );
    
    return id;
  }
  
  /**
   * Get a dependency definition by ID
   * 
   * @param id The dependency ID
   * @returns The dependency definition
   */
  getDependency(id: string): DependencyDefinition | undefined {
    return this.dependencies.get(id);
  }
  
  /**
   * Get all dependency definitions
   * 
   * @returns Array of all dependency definitions
   */
  getAllDependencies(): DependencyDefinition[] {
    return Array.from(this.dependencies.values());
  }
  
  /**
   * Update a dependency definition
   * 
   * @param id The dependency ID
   * @param updates Updates to apply
   * @returns Whether the update was successful
   */
  updateDependency(
    id: string, 
    updates: Partial<Omit<DependencyDefinition, 'id' | 'createdAt'>>
  ): boolean {
    const definition = this.dependencies.get(id);
    
    if (!definition) {
      return false;
    }
    
    const updatedDefinition: DependencyDefinition = {
      ...definition,
      ...updates
    };
    
    this.dependencies.set(id, updatedDefinition);
    
    // Publish event
    eventBus.publish(
      DependencyRegistryEvent.DEPENDENCY_UPDATED,
      { definition: updatedDefinition },
      'dependency-registry'
    );
    
    return true;
  }
  
  /**
   * Remove a dependency definition
   * 
   * @param id The dependency ID
   * @returns Whether the removal was successful
   */
  removeDependency(id: string): boolean {
    const definition = this.dependencies.get(id);
    
    if (!definition) {
      return false;
    }
    
    this.dependencies.delete(id);
    
    // Publish event
    eventBus.publish(
      DependencyRegistryEvent.DEPENDENCY_REMOVED,
      { definition },
      'dependency-registry'
    );
    
    return true;
  }
  
  /**
   * Get dependencies for a provider component type
   * 
   * @param providerType The provider component type
   * @returns Array of matching dependency definitions
   */
  getDependenciesForProvider(providerType: ComponentType): DependencyDefinition[] {
    return this.getAllDependencies().filter(
      dep => dep.providerType === providerType
    );
  }
  
  /**
   * Get dependencies for a consumer component type
   * 
   * @param consumerType The consumer component type
   * @returns Array of matching dependency definitions
   */
  getDependenciesForConsumer(consumerType: ComponentType): DependencyDefinition[] {
    return this.getAllDependencies().filter(
      dep => dep.consumerType === consumerType
    );
  }
  
  /**
   * Get dependencies by data type
   * 
   * @param dataType The data type
   * @returns Array of matching dependency definitions
   */
  getDependenciesByDataType(dataType: DependencyDataType): DependencyDefinition[] {
    return this.getAllDependencies().filter(
      dep => dep.dataType === dataType
    );
  }
  
  /**
   * Find possible dependencies between component types
   * 
   * @param providerType The provider component type
   * @param consumerType The consumer component type
   * @returns Array of matching dependency definitions
   */
  findPossibleDependencies(
    providerType: ComponentType,
    consumerType: ComponentType
  ): DependencyDefinition[] {
    return this.getAllDependencies().filter(
      dep => dep.providerType === providerType && 
             dep.consumerType === consumerType
    );
  }
  
  /**
   * Check if a component type can provide data to another
   * 
   * @param providerType The provider component type
   * @param consumerType The consumer component type
   * @returns Whether the provider can provide for the consumer
   */
  canProvideFor(
    providerType: ComponentType,
    consumerType: ComponentType
  ): boolean {
    return this.findPossibleDependencies(providerType, consumerType).length > 0;
  }
  
  /**
   * Check if a component type can consume data from another
   * 
   * @param consumerType The consumer component type
   * @param providerType The provider component type
   * @returns Whether the consumer can consume from the provider
   */
  canConsumeFrom(
    consumerType: ComponentType,
    providerType: ComponentType
  ): boolean {
    return this.findPossibleDependencies(providerType, consumerType).length > 0;
  }
  
  /**
   * Clear all dependency definitions
   */
  clear(): void {
    this.dependencies.clear();
  }
}

// Create a singleton instance
export const dependencyRegistry = new DependencyRegistry();