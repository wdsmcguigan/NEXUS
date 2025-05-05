import { 
  DependencyDefinition, 
  DependencyRegistry as IDependencyRegistry,
  Dependency,
  DependencyDataTypes,
  DependencyStatus
} from './DependencyInterfaces';
import { nanoid } from 'nanoid';

/**
 * Implementation of the DependencyRegistry interface.
 * Manages dependency definitions and relationships between components.
 */
export class DependencyRegistry implements IDependencyRegistry {
  private definitions: Map<string, DependencyDefinition> = new Map();
  private dependencies: Map<string, Dependency> = new Map();
  
  // Store lookups for quick access
  private definitionsByComponent: Map<string, Set<string>> = new Map();
  private definitionsByType: Map<DependencyDataTypes, Set<string>> = new Map();
  private dependenciesByProvider: Map<string, Set<string>> = new Map();
  private dependenciesByConsumer: Map<string, Set<string>> = new Map();
  private dependenciesByType: Map<DependencyDataTypes, Set<string>> = new Map();
  
  constructor() {
    console.log('DependencyRegistry initialized');
  }
  
  /**
   * Register a dependency definition for a component.
   */
  registerDefinition(definition: DependencyDefinition): void {
    // Ensure the definition has an ID
    if (!definition.id) {
      definition.id = `def-${nanoid(8)}`;
    }
    
    // Register the definition
    this.definitions.set(definition.id, definition);
    
    // Update lookup indexes
    this.addToSetMap(this.definitionsByComponent, definition.componentId, definition.id);
    this.addToSetMap(this.definitionsByType, definition.dataType, definition.id);
  }
  
  /**
   * Remove a dependency definition.
   */
  removeDefinition(definitionId: string): void {
    const definition = this.definitions.get(definitionId);
    
    if (definition) {
      // Remove from indexes
      this.removeFromSetMap(this.definitionsByComponent, definition.componentId, definitionId);
      this.removeFromSetMap(this.definitionsByType, definition.dataType, definitionId);
      
      // Remove related dependencies
      const dependenciesToRemove: string[] = [];
      
      for (const [id, dependency] of this.dependencies.entries()) {
        if (
          dependency.providerDefinitionId === definitionId || 
          dependency.consumerDefinitionId === definitionId
        ) {
          dependenciesToRemove.push(id);
        }
      }
      
      dependenciesToRemove.forEach(id => this.removeDependency(id));
      
      // Remove the definition
      this.definitions.delete(definitionId);
    }
  }
  
  /**
   * Get a dependency definition by ID.
   */
  getDefinition(definitionId: string): DependencyDefinition | undefined {
    return this.definitions.get(definitionId);
  }
  
  /**
   * Get all dependency definitions for a component.
   */
  getDefinitionsByComponent(componentId: string): DependencyDefinition[] {
    const definitionIds = this.definitionsByComponent.get(componentId) || new Set();
    return Array.from(definitionIds).map(id => this.definitions.get(id)!).filter(Boolean);
  }
  
  /**
   * Get all dependency definitions for a data type.
   */
  getDefinitionsByType(dataType: DependencyDataTypes): DependencyDefinition[] {
    const definitionIds = this.definitionsByType.get(dataType) || new Set();
    return Array.from(definitionIds).map(id => this.definitions.get(id)!).filter(Boolean);
  }
  
  /**
   * Get all provider definitions for a data type.
   */
  getProviderDefinitions(dataType: DependencyDataTypes): DependencyDefinition[] {
    return this.getDefinitionsByType(dataType).filter(
      def => def.role === 'provider' || def.role === 'both'
    );
  }
  
  /**
   * Get all consumer definitions for a data type.
   */
  getConsumerDefinitions(dataType: DependencyDataTypes): DependencyDefinition[] {
    return this.getDefinitionsByType(dataType).filter(
      def => def.role === 'consumer' || def.role === 'both'
    );
  }
  
  /**
   * Create a dependency between a provider and consumer.
   */
  createDependency(
    providerId: string, 
    consumerId: string, 
    dataType: DependencyDataTypes
  ): Dependency | undefined {
    // Find provider definition
    const providerDefs = this.getDefinitionsByComponent(providerId).filter(
      def => (def.role === 'provider' || def.role === 'both') && def.dataType === dataType
    );
    
    // Find consumer definition
    const consumerDefs = this.getDefinitionsByComponent(consumerId).filter(
      def => (def.role === 'consumer' || def.role === 'both') && def.dataType === dataType
    );
    
    if (providerDefs.length === 0 || consumerDefs.length === 0) {
      console.warn(`Cannot create dependency: no matching definitions for ${dataType}`);
      return undefined;
    }
    
    // Use the first matching definition for each
    const providerDef = providerDefs[0];
    const consumerDef = consumerDefs[0];
    
    // Check if a dependency already exists
    for (const dependency of this.dependencies.values()) {
      if (
        dependency.providerId === providerId &&
        dependency.consumerId === consumerId &&
        dependency.dataType === dataType
      ) {
        return dependency;
      }
    }
    
    // Create the dependency
    const dependency: Dependency = {
      id: `dep-${nanoid(8)}`,
      providerId,
      consumerId,
      providerDefinitionId: providerDef.id,
      consumerDefinitionId: consumerDef.id,
      dataType,
      status: DependencyStatus.DISCONNECTED
    };
    
    // Store the dependency
    this.dependencies.set(dependency.id, dependency);
    
    // Update lookups
    this.addToSetMap(this.dependenciesByProvider, providerId, dependency.id);
    this.addToSetMap(this.dependenciesByConsumer, consumerId, dependency.id);
    this.addToSetMap(this.dependenciesByType, dataType, dependency.id);
    
    return dependency;
  }
  
  /**
   * Remove a dependency.
   */
  removeDependency(dependencyId: string): void {
    const dependency = this.dependencies.get(dependencyId);
    
    if (dependency) {
      // Remove from lookup indexes
      this.removeFromSetMap(this.dependenciesByProvider, dependency.providerId, dependencyId);
      this.removeFromSetMap(this.dependenciesByConsumer, dependency.consumerId, dependencyId);
      this.removeFromSetMap(this.dependenciesByType, dependency.dataType, dependencyId);
      
      // Remove the dependency
      this.dependencies.delete(dependencyId);
    }
  }
  
  /**
   * Get a dependency by ID.
   */
  getDependency(dependencyId: string): Dependency | undefined {
    return this.dependencies.get(dependencyId);
  }
  
  /**
   * Get all dependencies for a provider.
   */
  getDependenciesByProvider(providerId: string): Dependency[] {
    const dependencyIds = this.dependenciesByProvider.get(providerId) || new Set();
    return Array.from(dependencyIds).map(id => this.dependencies.get(id)!).filter(Boolean);
  }
  
  /**
   * Get all dependencies for a consumer.
   */
  getDependenciesByConsumer(consumerId: string): Dependency[] {
    const dependencyIds = this.dependenciesByConsumer.get(consumerId) || new Set();
    return Array.from(dependencyIds).map(id => this.dependencies.get(id)!).filter(Boolean);
  }
  
  /**
   * Get all dependencies for a data type.
   */
  getDependenciesByType(dataType: DependencyDataTypes): Dependency[] {
    const dependencyIds = this.dependenciesByType.get(dataType) || new Set();
    return Array.from(dependencyIds).map(id => this.dependencies.get(id)!).filter(Boolean);
  }
  
  /**
   * Update the status of a dependency.
   */
  updateDependencyStatus(dependencyId: string, status: DependencyStatus): void {
    const dependency = this.dependencies.get(dependencyId);
    
    if (dependency) {
      dependency.status = status;
      
      // Update timestamp for READY status
      if (status === DependencyStatus.READY) {
        dependency.lastUpdated = Date.now();
      }
    }
  }
  
  /**
   * Find compatible providers for a consumer definition.
   */
  findCompatibleProviders(consumerDefinitionId: string): DependencyDefinition[] {
    const consumerDef = this.definitions.get(consumerDefinitionId);
    
    if (!consumerDef) {
      return [];
    }
    
    return this.getProviderDefinitions(consumerDef.dataType);
  }
  
  /**
   * Find compatible consumers for a provider definition.
   */
  findCompatibleConsumers(providerDefinitionId: string): DependencyDefinition[] {
    const providerDef = this.definitions.get(providerDefinitionId);
    
    if (!providerDef) {
      return [];
    }
    
    return this.getConsumerDefinitions(providerDef.dataType);
  }
  
  /**
   * Helper method to add a value to a set in a map.
   */
  private addToSetMap<K, V>(map: Map<K, Set<V>>, key: K, value: V): void {
    if (!map.has(key)) {
      map.set(key, new Set());
    }
    
    map.get(key)!.add(value);
  }
  
  /**
   * Helper method to remove a value from a set in a map.
   */
  private removeFromSetMap<K, V>(map: Map<K, Set<V>>, key: K, value: V): void {
    const set = map.get(key);
    
    if (set) {
      set.delete(value);
      
      if (set.size === 0) {
        map.delete(key);
      }
    }
  }
}