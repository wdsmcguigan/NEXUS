/**
 * DependencyRegistry class for the Component Dependency System
 * 
 * This class manages possible dependencies between component types and
 * provides methods to register, query, and validate dependencies.
 */

import { ComponentType } from '../communication/ComponentCommunication';
import { eventBus } from '../communication/EventBus';
import { nanoid } from 'nanoid';
import {
  DependencyDefinition,
  DependencyDataType,
  DependencySyncStrategy,
} from './DependencyInterfaces';

/**
 * Events emitted by the DependencyRegistry
 */
export enum DependencyRegistryEvent {
  DEPENDENCY_REGISTERED = 'dependency:registered',
  DEPENDENCY_UPDATED = 'dependency:updated',
  DEPENDENCY_REMOVED = 'dependency:removed',
}

/**
 * Registry for possible dependencies between component types
 */
export class DependencyRegistry {
  private static instance: DependencyRegistry;
  
  /**
   * Map of dependency definitions by ID
   */
  private definitions: Map<string, DependencyDefinition> = new Map();
  
  /**
   * Map of provider component types to possible dependency definitions
   */
  private providerToDependencyMap: Map<ComponentType, Set<string>> = new Map();
  
  /**
   * Map of consumer component types to possible dependency definitions
   */
  private consumerToDependencyMap: Map<ComponentType, Set<string>> = new Map();
  
  /**
   * Map of data types to possible dependency definitions
   */
  private dataTypeToDependencyMap: Map<DependencyDataType, Set<string>> = new Map();
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {}
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): DependencyRegistry {
    if (!DependencyRegistry.instance) {
      DependencyRegistry.instance = new DependencyRegistry();
    }
    
    return DependencyRegistry.instance;
  }
  
  /**
   * Initialize the registry
   */
  public initialize(): void {
    // Register built-in dependencies (if any)
  }
  
  /**
   * Register a new dependency definition
   * 
   * @param definition The dependency definition to register
   * @returns The ID of the registered dependency definition
   */
  public registerDependency(definition: Omit<DependencyDefinition, 'id'>): string {
    // Generate an ID if not provided
    const id = nanoid();
    
    // Create the full definition
    const fullDefinition: DependencyDefinition = {
      ...definition,
      id
    };
    
    // Validate the definition
    this.validateDefinition(fullDefinition);
    
    // Store the definition
    this.definitions.set(id, fullDefinition);
    
    // Update the lookup maps
    this.addToProviderMap(fullDefinition);
    this.addToConsumerMap(fullDefinition);
    this.addToDataTypeMap(fullDefinition);
    
    // Emit registration event
    eventBus.publish(
      DependencyRegistryEvent.DEPENDENCY_REGISTERED,
      { definition: fullDefinition }
    );
    
    return id;
  }
  
  /**
   * Update an existing dependency definition
   * 
   * @param id The ID of the dependency definition to update
   * @param updates The updates to apply
   * @returns Whether the update was successful
   */
  public updateDependency(
    id: string, 
    updates: Partial<Omit<DependencyDefinition, 'id'>>
  ): boolean {
    const existingDefinition = this.definitions.get(id);
    
    if (!existingDefinition) {
      console.error(`Cannot update dependency definition: ID ${id} not found`);
      return false;
    }
    
    // Create updated definition
    const updatedDefinition: DependencyDefinition = {
      ...existingDefinition,
      ...updates
    };
    
    // Validate the updated definition
    try {
      this.validateDefinition(updatedDefinition);
    } catch (error) {
      console.error('Invalid dependency definition update:', error);
      return false;
    }
    
    // Update lookup maps if provider or consumer type changed
    if (updates.providerType && updates.providerType !== existingDefinition.providerType) {
      this.removeFromProviderMap(existingDefinition);
      this.addToProviderMap(updatedDefinition);
    }
    
    if (updates.consumerType && updates.consumerType !== existingDefinition.consumerType) {
      this.removeFromConsumerMap(existingDefinition);
      this.addToConsumerMap(updatedDefinition);
    }
    
    if (updates.dataType && updates.dataType !== existingDefinition.dataType) {
      this.removeFromDataTypeMap(existingDefinition);
      this.addToDataTypeMap(updatedDefinition);
    }
    
    // Store the updated definition
    this.definitions.set(id, updatedDefinition);
    
    // Emit update event
    eventBus.publish(
      DependencyRegistryEvent.DEPENDENCY_UPDATED,
      { 
        definition: updatedDefinition,
        previousDefinition: existingDefinition
      }
    );
    
    return true;
  }
  
  /**
   * Remove a dependency definition
   * 
   * @param id The ID of the dependency definition to remove
   * @returns Whether the removal was successful
   */
  public removeDependency(id: string): boolean {
    const definition = this.definitions.get(id);
    
    if (!definition) {
      console.error(`Cannot remove dependency definition: ID ${id} not found`);
      return false;
    }
    
    // Remove from lookup maps
    this.removeFromProviderMap(definition);
    this.removeFromConsumerMap(definition);
    this.removeFromDataTypeMap(definition);
    
    // Remove from definitions map
    this.definitions.delete(id);
    
    // Emit removal event
    eventBus.publish(
      DependencyRegistryEvent.DEPENDENCY_REMOVED,
      { definition }
    );
    
    return true;
  }
  
  /**
   * Get a dependency definition by ID
   * 
   * @param id The ID of the dependency definition
   * @returns The dependency definition, or undefined if not found
   */
  public getDependency(id: string): DependencyDefinition | undefined {
    return this.definitions.get(id);
  }
  
  /**
   * Get all registered dependency definitions
   * 
   * @returns Array of all dependency definitions
   */
  public getAllDependencies(): DependencyDefinition[] {
    return Array.from(this.definitions.values());
  }
  
  /**
   * Get all dependencies where the specified component type can be a provider
   * 
   * @param componentType The component type to check
   * @returns Array of matching dependency definitions
   */
  public getDependenciesForProvider(componentType: ComponentType): DependencyDefinition[] {
    const dependencyIds = this.providerToDependencyMap.get(componentType);
    
    if (!dependencyIds) {
      return [];
    }
    
    return Array.from(dependencyIds)
      .map(id => this.definitions.get(id))
      .filter(Boolean) as DependencyDefinition[];
  }
  
  /**
   * Get all dependencies where the specified component type can be a consumer
   * 
   * @param componentType The component type to check
   * @returns Array of matching dependency definitions
   */
  public getDependenciesForConsumer(componentType: ComponentType): DependencyDefinition[] {
    const dependencyIds = this.consumerToDependencyMap.get(componentType);
    
    if (!dependencyIds) {
      return [];
    }
    
    return Array.from(dependencyIds)
      .map(id => this.definitions.get(id))
      .filter(Boolean) as DependencyDefinition[];
  }
  
  /**
   * Get all dependencies that share a specific data type
   * 
   * @param dataType The data type to check
   * @returns Array of matching dependency definitions
   */
  public getDependenciesByDataType(dataType: DependencyDataType): DependencyDefinition[] {
    const dependencyIds = this.dataTypeToDependencyMap.get(dataType);
    
    if (!dependencyIds) {
      return [];
    }
    
    return Array.from(dependencyIds)
      .map(id => this.definitions.get(id))
      .filter(Boolean) as DependencyDefinition[];
  }
  
  /**
   * Check if a component type can be a provider for a specific consumer component type
   * 
   * @param providerType Potential provider component type
   * @param consumerType Consumer component type
   * @returns Whether the dependency is possible
   */
  public canProvideFor(providerType: ComponentType, consumerType: ComponentType): boolean {
    const providerDependencies = this.getDependenciesForProvider(providerType);
    
    return providerDependencies.some(def => def.consumerType === consumerType);
  }
  
  /**
   * Check if a component type can be a consumer for a specific provider component type
   * 
   * @param consumerType Potential consumer component type
   * @param providerType Provider component type
   * @returns Whether the dependency is possible
   */
  public canConsumeFrom(consumerType: ComponentType, providerType: ComponentType): boolean {
    const consumerDependencies = this.getDependenciesForConsumer(consumerType);
    
    return consumerDependencies.some(def => def.providerType === providerType);
  }
  
  /**
   * Find all possible dependency definitions between a provider and consumer
   * 
   * @param providerType Provider component type
   * @param consumerType Consumer component type
   * @returns Array of matching dependency definitions
   */
  public findPossibleDependencies(
    providerType: ComponentType, 
    consumerType: ComponentType
  ): DependencyDefinition[] {
    return this.getAllDependencies().filter(def => 
      def.providerType === providerType && def.consumerType === consumerType
    );
  }
  
  /**
   * Validate a dependency definition
   * 
   * @param definition The definition to validate
   * @throws Error if the definition is invalid
   */
  private validateDefinition(definition: DependencyDefinition): void {
    // Check required fields
    if (!definition.name) {
      throw new Error('Dependency definition must have a name');
    }
    
    if (!definition.providerType) {
      throw new Error('Dependency definition must have a provider component type');
    }
    
    if (!definition.consumerType) {
      throw new Error('Dependency definition must have a consumer component type');
    }
    
    if (!definition.dataType) {
      throw new Error('Dependency definition must have a data type');
    }
    
    if (!definition.syncStrategy) {
      throw new Error('Dependency definition must have a sync strategy');
    }
    
    // Validate configuration options
    if (definition.configOptions) {
      for (const option of definition.configOptions) {
        if (!option.key) {
          throw new Error('Configuration option must have a key');
        }
        
        if (!option.name) {
          throw new Error('Configuration option must have a name');
        }
        
        if (!option.type) {
          throw new Error('Configuration option must have a type');
        }
        
        // Validate select options
        if (option.type === 'select' && (!option.options || option.options.length === 0)) {
          throw new Error('Select configuration option must have options');
        }
      }
    }
  }
  
  /**
   * Add a dependency definition to the provider lookup map
   */
  private addToProviderMap(definition: DependencyDefinition): void {
    if (!this.providerToDependencyMap.has(definition.providerType)) {
      this.providerToDependencyMap.set(definition.providerType, new Set());
    }
    
    this.providerToDependencyMap.get(definition.providerType)!.add(definition.id);
  }
  
  /**
   * Remove a dependency definition from the provider lookup map
   */
  private removeFromProviderMap(definition: DependencyDefinition): void {
    const providerDependencies = this.providerToDependencyMap.get(definition.providerType);
    
    if (providerDependencies) {
      providerDependencies.delete(definition.id);
      
      if (providerDependencies.size === 0) {
        this.providerToDependencyMap.delete(definition.providerType);
      }
    }
  }
  
  /**
   * Add a dependency definition to the consumer lookup map
   */
  private addToConsumerMap(definition: DependencyDefinition): void {
    if (!this.consumerToDependencyMap.has(definition.consumerType)) {
      this.consumerToDependencyMap.set(definition.consumerType, new Set());
    }
    
    this.consumerToDependencyMap.get(definition.consumerType)!.add(definition.id);
  }
  
  /**
   * Remove a dependency definition from the consumer lookup map
   */
  private removeFromConsumerMap(definition: DependencyDefinition): void {
    const consumerDependencies = this.consumerToDependencyMap.get(definition.consumerType);
    
    if (consumerDependencies) {
      consumerDependencies.delete(definition.id);
      
      if (consumerDependencies.size === 0) {
        this.consumerToDependencyMap.delete(definition.consumerType);
      }
    }
  }
  
  /**
   * Add a dependency definition to the data type lookup map
   */
  private addToDataTypeMap(definition: DependencyDefinition): void {
    if (!this.dataTypeToDependencyMap.has(definition.dataType)) {
      this.dataTypeToDependencyMap.set(definition.dataType, new Set());
    }
    
    this.dataTypeToDependencyMap.get(definition.dataType)!.add(definition.id);
  }
  
  /**
   * Remove a dependency definition from the data type lookup map
   */
  private removeFromDataTypeMap(definition: DependencyDefinition): void {
    const dataTypeDependencies = this.dataTypeToDependencyMap.get(definition.dataType);
    
    if (dataTypeDependencies) {
      dataTypeDependencies.delete(definition.id);
      
      if (dataTypeDependencies.size === 0) {
        this.dataTypeToDependencyMap.delete(definition.dataType);
      }
    }
  }
}

// Export singleton instance
export const dependencyRegistry = DependencyRegistry.getInstance();